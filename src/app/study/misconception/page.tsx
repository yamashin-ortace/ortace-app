import { BackLink } from "@/components/study/back-link";
import { DataReadinessHint } from "@/components/study/data-readiness-hint";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function MisconceptionPage() {
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
          AI思い込みチェック
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          自信があった誤答、急ぎすぎた誤答、同テーマの反復ミスを分析します
        </p>
      </div>

      <QuestionCountSelector defaultCount={10} />

      <DataReadinessHint
        threshold={30}
        benefitMessage="自信度と解答履歴が増えるほど、思い込みの検出が安定します。"
      />

      <RecommendedPlayClient
        questions={questions}
        mode="misconception"
        limit={10}
        resumeLabel="AI思い込みチェック"
        emptyTitle="思い込みチェックの候補はまだありません"
        emptyMessage="解答後に自信度をつけると、自信ありの誤答や急ぎすぎた誤答を見つけやすくなります。"
        plan={plan}
      />
    </div>
  );
}
