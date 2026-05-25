import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { isExamRound, loadSession } from "@/lib/questions/loader";

type Props = {
  params: Promise<{ round: string; session: string }>;
};

const SESSION_LABELS = {
  am: "午前",
  pm: "午後",
  all: "全問",
} as const;

type SessionKey = keyof typeof SESSION_LABELS;

function isSessionKey(value: string): value is SessionKey {
  return value === "am" || value === "pm" || value === "all";
}

export default async function QuizPage({ params }: Props) {
  const { round: roundStr, session } = await params;
  const round = Number(roundStr);
  if (!isExamRound(round)) notFound();
  if (!isSessionKey(session)) notFound();

  const questions = await loadSession(round, session);
  if (questions.length === 0) notFound();
  const authSession = await getSessionContext();
  const plan = authSession?.profile
    ? getEffectivePlanForProfile(authSession.profile)
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <BackLink
        href={`/study/${round}`}
        label={`第${round}回 ${SESSION_LABELS[session]}`}
      />
      <QuizPlayer
        questions={questions}
        plan={plan}
        resumeLabel={`第${round}回 ${SESSION_LABELS[session]}`}
      />
    </div>
  );
}
