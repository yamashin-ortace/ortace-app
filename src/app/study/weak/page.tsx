import { BackLink } from "@/components/study/back-link";
import { DataReadinessHint } from "@/components/study/data-readiness-hint";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { RecommendedPlayClient } from "@/components/study/recommended-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function WeakPage() {
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
          苦手克服
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          確定苦手（10問以上）と暫定苦手（5問以上）の3分野からランダム出題
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} />

      <DataReadinessHint
        threshold={15}
        benefitMessage="あと少し解くと、苦手分野の判定がぐっと精度を増します。"
      />

      <RecommendedPlayClient
        questions={questions}
        mode="weak"
        limit={20}
        resumeLabel="苦手克服"
        emptyTitle="苦手分野の判定にはデータが足りません"
        emptyMessage="少し問題を解くと、正答率の低い分野からおすすめできるようになります。"
        plan={plan}
      />
    </div>
  );
}
