import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";
import { shuffle } from "@/lib/quiz";

type Props = {
  searchParams: Promise<{ count?: string }>;
};

const ALLOWED_COUNTS = new Set([10, 20, 50, 100]);

export default async function RandomQuizPage({ searchParams }: Props) {
  const { count: countStr } = await searchParams;
  const count = Number(countStr ?? 20);
  if (!ALLOWED_COUNTS.has(count)) notFound();

  const all = await loadAllQuestions();
  const picked = shuffle(all).slice(0, count);
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
      <BackLink href="/study/random" label={`ランダム出題 ${count}問`} />
      <QuizPlayer questions={picked} mode="random" plan={plan} />
    </div>
  );
}
