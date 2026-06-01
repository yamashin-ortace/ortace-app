import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  calculatePlanExpiresAt,
  isPaidPlan,
  type PaidPlan,
} from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { getStripe } from "@/lib/stripe/server";
import type { ProfilesUpdate } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSession(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case "customer.subscription.updated":
      await syncSubscription(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const subscriptionId = getStripeId(session.subscription);
  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const metadata = getBillingMetadata(subscription.metadata, session.metadata);
  if (!metadata) return;

  const now = new Date();
  const update = {
    stripe_customer_id: getStripeId(session.customer),
    stripe_checkout_session_id: session.id,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_subscription_cancel_at: toIsoString(subscription.cancel_at),
    plan_updated_at: now.toISOString(),
    ...(subscription.status === "trialing" && subscription.trial_end
      ? {
          plan_status: "trialing" as const,
          trial_started_at: toIsoString(subscription.trial_start) ?? now.toISOString(),
          trial_ends_at: toIsoString(subscription.trial_end),
          trial_used_at: toIsoString(subscription.trial_start) ?? now.toISOString(),
          trial_plan: metadata.plan,
        }
      : {}),
  };

  await updateProfile(metadata.userId, update, "save checkout subscription");
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0) return;

  const subscription = await getSubscriptionFromInvoice(invoice);
  if (!subscription) return;

  const metadata = getBillingMetadata(subscription.metadata);
  if (!metadata) return;

  const supabase = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_first_invoice_paid_at")
    .eq("id", metadata.userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(`Failed to load billing profile: ${profileError?.message ?? "not found"}`);
  }

  const now = new Date();
  const planExpiresAt = getPaidPlanExpiresAt(subscription, metadata.plan, metadata.durationId);
  const firstPaidAt = profile.stripe_first_invoice_paid_at ?? now.toISOString();
  const updatedSubscription = await stopAutomaticRenewal(
    subscription,
    metadata.plan,
    planExpiresAt,
  );
  const paymentIntentId = getInvoicePaymentIntentId(invoice);

  await updateProfile(
    metadata.userId,
    {
      plan: metadata.plan,
      plan_status: "active",
      plan_expires_at: planExpiresAt,
      stripe_customer_id: getStripeId(invoice.customer),
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: updatedSubscription.status,
      stripe_subscription_cancel_at: toIsoString(updatedSubscription.cancel_at),
      stripe_first_invoice_paid_at: firstPaidAt,
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
      plan_updated_at: now.toISOString(),
    },
    "activate paid subscription",
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await getSubscriptionFromInvoice(invoice);
  if (!subscription) return;

  const metadata = getBillingMetadata(subscription.metadata);
  if (!metadata) return;

  await updateProfile(
    metadata.userId,
    {
      plan_status: "payment_failed",
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_subscription_cancel_at: toIsoString(subscription.cancel_at),
      plan_updated_at: new Date().toISOString(),
    },
    "mark invoice payment failed",
  );
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const metadata = getBillingMetadata(subscription.metadata);
  if (!metadata) return;

  await updateProfile(
    metadata.userId,
    {
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_subscription_cancel_at: toIsoString(subscription.cancel_at),
      plan_updated_at: new Date().toISOString(),
    },
    "sync subscription",
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const metadata = getBillingMetadata(subscription.metadata);
  if (!metadata) return;

  const supabase = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan_expires_at, stripe_first_invoice_paid_at")
    .eq("id", metadata.userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(`Failed to load billing profile: ${profileError?.message ?? "not found"}`);
  }

  const now = new Date();
  const hasRemainingPaidAccess = Boolean(
    profile.stripe_first_invoice_paid_at &&
      profile.plan_expires_at &&
      new Date(profile.plan_expires_at).getTime() > now.getTime(),
  );

  await updateProfile(
    metadata.userId,
    {
      ...(hasRemainingPaidAccess
        ? { plan_status: "active" as const }
        : {
            plan: "free" as const,
            plan_status: "canceled" as const,
            plan_expires_at: null,
            trial_plan: null,
          }),
      stripe_subscription_status: subscription.status,
      stripe_subscription_cancel_at: toIsoString(subscription.cancel_at),
      plan_updated_at: now.toISOString(),
    },
    "handle deleted subscription",
  );
}

async function getSubscriptionFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = getStripeId(subscription);
  if (!subscriptionId) return null;
  return getStripe().subscriptions.retrieve(subscriptionId);
}

async function stopAutomaticRenewal(
  subscription: Stripe.Subscription,
  plan: PaidPlan,
  planExpiresAt: string,
) {
  if (plan === "low") {
    return getStripe().subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
  }

  return getStripe().subscriptions.update(subscription.id, {
    cancel_at: Math.floor(new Date(planExpiresAt).getTime() / 1000),
    proration_behavior: "none",
  });
}

function getPaidPlanExpiresAt(
  subscription: Stripe.Subscription,
  plan: PaidPlan,
  durationId?: string,
) {
  if (plan === "exam") {
    return calculatePlanExpiresAt(plan, new Date(), durationId);
  }

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  return currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : calculatePlanExpiresAt(plan, new Date(), durationId);
}

function getBillingMetadata(
  primary: Stripe.Metadata | null,
  fallback?: Stripe.Metadata | null,
) {
  const userId = primary?.user_id ?? fallback?.user_id;
  const plan = primary?.plan ?? fallback?.plan;
  const durationId = primary?.duration_id ?? fallback?.duration_id;
  if (!userId || !plan || !isPaidPlan(plan)) return null;
  return { userId, plan, durationId };
}

async function updateProfile(
  userId: string,
  values: ProfilesUpdate,
  action: string,
) {
  const { error } = await createSupabaseAdminClient()
    .from("profiles")
    .update(values)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to ${action}: ${error.message}`);
  }
}

function getInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  const paymentIntent = invoice.payments?.data.find(
    (payment) => payment.payment.type === "payment_intent",
  )?.payment.payment_intent;
  return getStripeId(paymentIntent);
}

function toIsoString(value: number | null): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

function getStripeId(value: { id: string } | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
