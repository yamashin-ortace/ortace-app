import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { isExamRound, loadQuestion } from "@/lib/questions/loader";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    note?: string;
  }>;
};

export default async function SavedQuestionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const parsed = parseQuestionId(id);
  if (!parsed) notFound();

  const question = await loadQuestion(parsed.round, parsed.number);
  if (!question) notFound();
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlan({
        plan: session.profile.plan,
        status: session.profile.plan_status,
        expiresAt: session.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <BackLink
        href="/records"
        label="記録"
        useHistory={query.from === "records"}
      />
      <QuizPlayer
        questions={[question]}
        mode="random"
        plan={plan}
        initialStudyAction={query.note === "1" ? "note" : undefined}
        saveProgress={false}
      />
    </div>
  );
}

function parseQuestionId(value: string) {
  const match = value.match(/^(\d{2})-(\d{1,3})$/);
  if (!match) return null;

  const round = Number(match[1]);
  const number = Number(match[2]);
  if (!isExamRound(round)) return null;
  if (!Number.isInteger(number) || number < 1 || number > 175) return null;

  return { round, number };
}
