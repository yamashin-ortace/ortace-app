import { BackLink } from "@/components/study/back-link";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function ReviewPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlan({
        plan: sessionContext.profile.plan,
        status: sessionContext.profile.plan_status,
        expiresAt: sessionContext.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          復習する
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          間隔反復で復習日が来た問題から出題します
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} />

      <RecommendedPlayClient
        questions={questions}
        mode="review"
        limit={20}
        resumeLabel="復習"
        emptyTitle="復習対象がありません"
        emptyMessage="まずは問題を解いてみましょう。間違えた問題はここに溜まります。"
        plan={plan}
      />
    </div>
  );
}
