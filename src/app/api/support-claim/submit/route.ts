import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildSupportClaimSubmittedAdminText,
  sendSupportClaimMail,
} from "@/lib/support-claim/mail";
import {
  countLearningDays,
  evaluateSupportClaimEligibility,
  getLearningWindowStart,
} from "@/lib/support-claim/eligibility";
import { isValidEvidencePath } from "@/lib/support-claim/evidence";

type SubmitBody = {
  evidencePath?: unknown;
  userComment?: unknown;
  agreed?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  const evidencePath = typeof body?.evidencePath === "string" ? body.evidencePath : "";
  const userComment =
    typeof body?.userComment === "string"
      ? body.userComment.trim().slice(0, 800)
      : "";

  if (body?.agreed !== true) {
    return NextResponse.json(
      { error: "利用規約への同意が必要です" },
      { status: 400 },
    );
  }
  if (!isValidEvidencePath(evidencePath, user.id)) {
    return NextResponse.json(
      { error: "添付画像のパスが不正です" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const [{ data: profile }, { data: answerRows }, { data: pendingClaims }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin
        .from("answer_history")
        .select("answered_at")
        .eq("user_id", user.id)
        .gte("answered_at", getLearningWindowStart(now).toISOString()),
      admin
        .from("support_claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending"),
    ]);

  const eligibility = evaluateSupportClaimEligibility({
    profile: profile ?? null,
    learningDays: countLearningDays(answerRows ?? [], now),
    hasPendingClaim: (pendingClaims?.length ?? 0) > 0,
    now,
  });

  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: eligibility.reasons.join("\n") },
      { status: 403 },
    );
  }

  const { data: claim, error } = await admin
    .from("support_claims")
    .insert({
      user_id: user.id,
      evidence_url: evidencePath,
      user_comment: userComment || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "申請の保存に失敗しました" },
      { status: 500 },
    );
  }

  const toEmail = process.env.CONTACT_TO_EMAIL ?? "info@ortace.jp";
  void sendSupportClaimMail({
    to: toEmail,
    subject: "[ORT ACE] 合格サポート保証の申請が届きました",
    text: buildSupportClaimSubmittedAdminText({
      claimId: claim.id,
      userId: user.id,
      userEmail: user.email ?? null,
      userComment: userComment || null,
    }),
  }).catch((error) => {
    console.error("[support-claim] admin notification failed", error);
  });

  revalidatePath("/support-claim");
  revalidatePath("/admin/support-claims");

  return NextResponse.json({ ok: true, claimId: claim.id });
}
