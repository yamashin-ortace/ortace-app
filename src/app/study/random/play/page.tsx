import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { getDailyLimitForPlan } from "@/lib/daily-limit";
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

  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlanForProfile(session.profile)
    : "free";
  const limit = getDailyLimitForPlan(plan);
  if (limit !== null && count > limit) redirect("/study/random");

  const all = await loadAllQuestions();
  const picked = shuffle(all).slice(0, count);

  return (
    <div className="space-y-4 pt-2">
      <BackLink href="/study/random" label={`ランダム出題 ${count}問`} />
      <QuizPlayer
        questions={picked}
        mode="random"
        plan={plan}
        resumeLabel={`ランダム出題 ${count}問`}
      />
    </div>
  );
}
