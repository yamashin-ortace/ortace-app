import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "お支払い情報が見つかりません" },
      { status: 404 },
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    ...(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID
      ? { configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID }
      : {}),
    return_url: `${getAppUrl()}/plans`,
  });

  return NextResponse.json({ url: session.url });
}
