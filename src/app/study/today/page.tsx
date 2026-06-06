import { BackLink } from "@/components/study/back-link";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function TodayPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlanForProfile(sessionContext.profile)
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/" label="ホーム" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          AIコーチMiLu先生 今日のおすすめ
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          回答履歴・正答率・解いた感覚・解答時間を分析して、今日の20問を自動で組みます
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} plan={plan} />

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
