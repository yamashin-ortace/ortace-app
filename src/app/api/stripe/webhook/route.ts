import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { calculatePlanExpiresAt, isPaidPlan } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { getStripe } from "@/lib/stripe/server";

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
    case "checkout.session.async_payment_succeeded":
      await grantPlanFromSession(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await markPaymentFailed(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  await grantPlanFromSession(session);
}

async function grantPlanFromSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const plan = session.metadata?.plan;

  if (!userId || !plan || !isPaidPlan(plan)) return;

  const now = new Date();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      plan,
      plan_status: "active",
      plan_expires_at: calculatePlanExpiresAt(plan, now),
      stripe_customer_id: getStripeId(session.customer),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getStripeId(session.payment_intent),
      plan_updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to grant billing plan: ${error.message}`);
  }
}

async function markPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  if (!userId) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      plan_status: "payment_failed",
      stripe_payment_intent_id: paymentIntent.id,
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to mark payment failed: ${error.message}`);
  }
}

function getStripeId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
