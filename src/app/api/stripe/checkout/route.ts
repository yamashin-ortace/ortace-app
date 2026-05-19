import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { getStripePriceId, isPaidPlan } from "@/lib/billing/plans";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: string;
  } | null;
  const plan = body?.plan;

  if (!plan || !isPaidPlan(plan)) {
    return NextResponse.json({ error: "プランが不正です" }, { status: 400 });
  }

  const priceId = getStripePriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID が設定されていません" },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  const customerId =
    profile?.stripe_customer_id ??
    (
      await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
      })
    ).id;

  if (!profile?.stripe_customer_id) {
    await createSupabaseAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const appUrl = getAppUrl();
  const sessionParams = {
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // payment_method_types を固定するとStripe Dashboard側の自動出し分けが効きにくい。
    // Google Pay / Apple Pay は card に含まれるウォレットなので、ここでは未指定にする。
    payment_method_options: {
      card: {
        installments: {
          enabled: true,
        },
      },
      konbini: {
        expires_after_days: 3,
      },
    },
    client_reference_id: user.id,
    success_url: `${appUrl}/plans?checkout=success`,
    cancel_url: `${appUrl}/plans?checkout=cancel`,
    metadata: {
      user_id: user.id,
      plan,
    },
    payment_intent_data: {
      metadata: {
        user_id: user.id,
        plan,
      },
    },
  } satisfies Stripe.Checkout.SessionCreateParams;

  const session = await createCheckoutSessionWithFallback(sessionParams);

  if (!session.url) {
    return NextResponse.json(
      { error: "Checkout URL の作成に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}

async function createCheckoutSessionWithFallback(
  params: Stripe.Checkout.SessionCreateParams,
) {
  const stripe = getStripe();

  try {
    return await stripe.checkout.sessions.create(params);
  } catch (error) {
    if (!isPaymentMethodConfigurationError(error)) {
      throw error;
    }

    return stripe.checkout.sessions.create({
      ...params,
      payment_method_types: ["card", "konbini"],
    });
  }
}

function isPaymentMethodConfigurationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("payment_method_types") ||
    lowerMessage.includes("payment method") ||
    lowerMessage.includes("paypay")
  );
}
