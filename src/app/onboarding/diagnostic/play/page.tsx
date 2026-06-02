import { BackLink } from "@/components/study/back-link";
import { DiagnosticPlayClient } from "@/components/onboarding/diagnostic-play-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { DIAGNOSTIC_QUESTION_COUNT } from "@/lib/onboarding/diagnostic";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function DiagnosticPlayPage() {
  const questions = await loadAllQuestions();
  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlanForProfile(sessionContext.profile)
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/onboarding/diagnostic" label="診断トップ" />
        <h1 className="text-[24px] font-extrabold tracking-tight text-[var(--text-1)]">
          初回診断 {DIAGNOSTIC_QUESTION_COUNT}問
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          最初に受ける診断だけ、1日の制限とは別カウント。途中の解答も記録されます。
        </p>
      </div>

      <DiagnosticPlayClient questions={questions} plan={plan} />
    </div>
  );
}
