import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import {
  calculateTrialEndsAt,
  getTrialState,
  isTrialEligibleAuthUser,
} from "@/lib/billing/trial";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  if (!isTrialEligibleAuthUser(user)) {
    return NextResponse.json(
      { error: "14日無料トライアルはGoogleまたはLINEログインのアカウントで利用できます" },
      { status: 403 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "プロフィールの取得に失敗しました" },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 },
    );
  }

  const now = new Date();
  const currentTrial = getTrialState(profile, now, true);

  if (currentTrial.isActive) {
    return NextResponse.json({ trial: currentTrial });
  }

  if (!currentTrial.canStart) {
    return NextResponse.json(
      { error: getTrialUnavailableMessage(currentTrial) },
      { status: 409 },
    );
  }

  const startedAt = now.toISOString();
  const endsAt = calculateTrialEndsAt(now);
  const { data: updatedProfile, error: updateError } =
    await createSupabaseAdminClient()
      .from("profiles")
      .update({
        trial_started_at: startedAt,
        trial_ends_at: endsAt,
        trial_used_at: startedAt,
      })
      .eq("id", user.id)
      .is("trial_used_at", null)
      .select("*")
      .single();

  if (updateError) {
    return NextResponse.json(
      { error: "トライアルの開始に失敗しました" },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/plans");
  revalidatePath("/study");

  return NextResponse.json({
    trial: getTrialState(updatedProfile, now, true),
  });
}

function getTrialUnavailableMessage(trial: { hasUsed: boolean }): string {
  if (trial.hasUsed) return "14日無料トライアルは1人1回までです";
  return "現在のプランではトライアルを開始できません";
}
