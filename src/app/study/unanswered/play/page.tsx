import { BackLink } from "@/components/study/back-link";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { UnansweredPlayClient } from "@/components/study/unanswered-play-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { FIELDS } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function UnansweredPlayPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlanForProfile(sessionContext.profile)
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study/unanswered" label="設定" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          未着手から解く
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          設定した分野・出題数で、未着手の問題から出題します
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} plan={plan} />

      <UnansweredPlayClient
        questions={questions}
        fields={FIELDS}
        defaultLimit={20}
        plan={plan}
      />
    </div>
  );
}
