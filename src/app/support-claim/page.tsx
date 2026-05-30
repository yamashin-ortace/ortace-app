import { redirect } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { ClaimEligibilityStats } from "@/components/support/claim-eligibility-stats";
import { ClaimForm } from "@/components/support/claim-form";
import { getSessionContext } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countLearningDays,
  evaluateSupportClaimEligibility,
  getLearningWindowStart,
} from "@/lib/support-claim/eligibility";

export default async function SupportClaimPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const now = new Date();
  const supabase = await createSupabaseServerClient();
  const [{ data: answerRows }, { data: claims }] = await Promise.all([
    supabase
      .from("answer_history")
      .select("answered_at")
      .eq("user_id", session.userId)
      .gte("answered_at", getLearningWindowStart(now).toISOString()),
    supabase
      .from("support_claims")
      .select("id,status,submitted_at,reviewed_at,reject_reason")
      .eq("user_id", session.userId)
      .order("submitted_at", { ascending: false }),
  ]);

  const claimSummaries = (claims ?? []).map((claim) => ({
    id: claim.id,
    status: claim.status,
    submittedAt: claim.submitted_at,
    reviewedAt: claim.reviewed_at,
    rejectReason: claim.reject_reason,
  }));
  const eligibility = evaluateSupportClaimEligibility({
    profile: session.profile,
    learningDays: countLearningDays(answerRows ?? [], now),
    hasPendingClaim: claimSummaries.some((claim) => claim.status === "pending"),
    now,
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/settings" label="設定" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          合格サポート保証 申請
        </h1>
        <p className="text-[12px] leading-relaxed text-[var(--text-3)]">
          国試対策パックを利用して不合格だった場合、条件確認後に翌年度の利用期限を延長します。
        </p>
      </div>

      <ClaimEligibilityStats eligibility={eligibility} />

      <ClaimForm
        userId={session.userId}
        eligibility={eligibility}
        claims={claimSummaries}
      />
    </div>
  );
}
