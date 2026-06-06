import { BackLink } from "@/components/study/back-link";
import { ExamPackLockedCard } from "@/components/study/exam-pack-locked-card";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function WeakPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlanForProfile(sessionContext.profile)
    : "free";
  const isExamPlan = plan === "exam";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          苦手克服
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          {isExamPlan
            ? "苦手なテーマを見つけ、基礎→自信あり誤答→類題の順で出題"
            : "確定苦手（10問以上）と暫定苦手（5問以上）の3分野からランダム出題"}
        </p>
      </div>

      {isExamPlan ? null : <QuestionCountSelector defaultCount={20} />}

      {isExamPlan ? null : (
        <ExamPackLockedCard
          title="テーマ単位まで深掘りして克服"
          description="国試対策パックでは、中分類の弱点分析、MiLu先生コメント、克服順に沿った集中演習を利用できます。"
        />
      )}

      <RecommendedPlayClient
        questions={questions}
        mode="weak"
        limit={20}
        resumeLabel="苦手克服"
        emptyTitle={
          isExamPlan
            ? "苦手テーマの判定にはデータが足りません"
            : "苦手分野の判定にはデータが足りません"
        }
        emptyMessage={
          isExamPlan
            ? "もっと解くと、テーマ別の正答率からおすすめできるようになります。"
            : "少し問題を解くと、正答率の低い分野からおすすめできるようになります。"
        }
        plan={plan}
      />
    </div>
  );
}
