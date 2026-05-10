import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import {
  EXAM_ROUNDS,
  FIELDS,
  type ExamRound,
  type Field,
  type Session,
} from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";
import { shuffle } from "@/lib/quiz";

type Props = {
  searchParams: Promise<{
    count?: string;
    round?: string;
    session?: string;
    field?: string;
  }>;
};

const ALLOWED_COUNTS = new Set([10, 20, 50, 100]);

export default async function FilteredQuizPage({ searchParams }: Props) {
  const params = await searchParams;
  const count = Number(params.count ?? 20);
  if (!ALLOWED_COUNTS.has(count)) notFound();

  const round = parseRound(params.round);
  const session = parseSession(params.session);
  const field = parseField(params.field);
  const allQuestions = await loadAllQuestions();
  const filtered = allQuestions.filter((question) => {
    if (round !== "all" && question.round !== round) return false;
    if (session !== "all" && question.session !== session) return false;
    if (field !== "all" && question.majorCategory !== field) return false;
    return true;
  });

  if (filtered.length === 0) notFound();

  const picked = shuffle(filtered).slice(0, Math.min(count, filtered.length));
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
      <BackLink
        href="/study/filter"
        label={`絞り込み演習 ${picked.length}問`}
      />
      <QuizPlayer questions={picked} mode="random" plan={plan} />
    </div>
  );
}

function parseRound(value: string | undefined): "all" | ExamRound {
  if (!value || value === "all") return "all";
  const round = Number(value);
  return (EXAM_ROUNDS as readonly number[]).includes(round)
    ? (round as ExamRound)
    : "all";
}

function parseSession(value: string | undefined): "all" | Session {
  if (value === "am" || value === "pm") return value;
  return "all";
}

function parseField(value: string | undefined): "all" | Field {
  if (!value || value === "all") return "all";
  return (FIELDS as readonly string[]).includes(value) ? (value as Field) : "all";
}
