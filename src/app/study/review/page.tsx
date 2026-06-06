import { BackLink } from "@/components/study/back-link";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function ReviewPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlanForProfile(sessionContext.profile)
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          復習する
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          自信あり誤答・繰り返し誤答・迷いが残った問題から優先して確認します
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} plan={plan} />

      <RecommendedPlayClient
        questions={questions}
        mode="review"
        limit={20}
        resumeLabel="復習"
        emptyTitle="復習対象がありません"
        emptyMessage="まずは問題を解いてみましょう。間違えた問題や、迷いが残った問題が必要に応じてここに入ります。"
        plan={plan}
      />
    </div>
  );
}
