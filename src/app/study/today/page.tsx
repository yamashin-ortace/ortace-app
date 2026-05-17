import { BackLink } from "@/components/study/back-link";
import { DataReadinessHint } from "@/components/study/data-readiness-hint";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function TodayPage() {
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
        <BackLink href="/" label="ホーム" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          AIコーチMiLu先生 今日のおすすめ
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          回答履歴・正答率・自信度・解答時間を分析して、今日の20問を自動で組みます
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} />

      <DataReadinessHint
        threshold={30}
        benefitMessage="あと少し解くと、復習・弱点・思い込みの判定が効くようになり、おすすめの的中度が上がります。"
      />

      <RecommendedPlayClient
        questions={questions}
        mode="today"
        limit={20}
        resumeLabel="AIコーチMiLu先生 今日のおすすめ"
        emptyTitle="今日のおすすめが用意できませんでした"
        emptyMessage="少し問題を解いて履歴を作ると、毎日のおすすめがここに表示されます。"
        plan={plan}
      />
    </div>
  );
}
