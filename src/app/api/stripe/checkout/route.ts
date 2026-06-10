import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import {
  calculatePlanExpiresAt,
  getStripePriceId,
  isPaidPlan,
  resolveDurationId,
} from "@/lib/billing/plans";
import { calculateTrialEndsAt } from "@/lib/billing/trial";

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
    durationId?: string;
  } | null;
  const plan = body?.plan;
  const requestedDurationId = body?.durationId;

  if (!plan || !isPaidPlan(plan)) {
    return NextResponse.json({ error: "プランが不正です" }, { status: 400 });
  }

  const durationId = resolveDurationId(plan, requestedDurationId);
  const priceId = getStripePriceId(plan, durationId);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID が設定されていません" },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, plan_status, plan_expires_at, stripe_customer_id, stripe_subscription_id, trial_used_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "プロフィールの取得に失敗しました" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  if (
    profile.plan !== "free" &&
    profile.plan_status === "active" &&
    profile.plan_expires_at &&
    new Date(profile.plan_expires_at).getTime() > Date.now()
  ) {
    return NextResponse.json(
      { error: "利用中のプランがあります。利用期限をご確認ください。" },
      { status: 409 },
    );
  }

  if (profile.stripe_subscription_id) {
    const existingSubscription = await retrieveSubscriptionIfPresent(
      stripe,
      profile.stripe_subscription_id,
    );
    if (
      existingSubscription &&
      !["canceled", "incomplete_expired"].includes(existingSubscription.status)
    ) {
      return NextResponse.json(
        { error: "利用中または手続き中のプランがあります。プラン管理画面をご確認ください。" },
        { status: 409 },
      );
    }
  }

  const now = new Date();
  const hasUsedTrial = Boolean(profile.trial_used_at);
  if (
    plan === "exam" &&
    new Date(calculatePlanExpiresAt(plan, now)).getTime() <=
      new Date(hasUsedTrial ? now : calculateTrialEndsAt(now)).getTime()
  ) {
    return NextResponse.json(
      { error: "今年度の国試対策パックは受付期間を終了しました" },
      { status: 409 },
    );
  }

  const customerId =
    profile.stripe_customer_id ??
    (
      await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
      })
    ).id;

  await createSupabaseAdminClient()
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      plan_duration_id: plan === "low" ? durationId ?? null : null,
    })
    .eq("id", user.id);

  const appUrl = getAppUrl();
  const metadata = {
    user_id: user.id,
    plan,
    ...(durationId ? { duration_id: durationId } : {}),
  };
  const sessionParams = {
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      ...(hasUsedTrial ? {} : { trial_period_days: 14 }),
      metadata,
    },
    client_reference_id: user.id,
    success_url: `${appUrl}/plans?checkout=success`,
    cancel_url: `${appUrl}/plans?checkout=cancel`,
    custom_text: hasUsedTrial
      ? undefined
      : {
          submit: {
            message:
              "初回14日間無料トライアルです。無料期間中にキャンセルした場合、料金はかかりません。15日目に表示の料金が決済されます。",
          },
        },
    metadata,
  } satisfies Stripe.Checkout.SessionCreateParams;

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    return NextResponse.json(
      { error: "Checkout URL の作成に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}

async function retrieveSubscriptionIfPresent(stripe: Stripe, subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isMissingStripeResource(error)) return null;
    throw error;
  }
}

function isMissingStripeResource(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "statusCode" in error && error.statusCode === 404;
}
