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
    rounds?: string;
    sessions?: string;
    fields?: string;
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

  const rounds = parseRounds(params.rounds ?? params.round);
  const sessions = parseSessions(params.sessions ?? params.session);
  const fields = parseFields(params.fields ?? params.field);
  const allQuestions = await loadAllQuestions();
  const filtered = allQuestions.filter((question) => {
    return (
      rounds.includes(question.round) &&
      sessions.includes(question.session) &&
      fields.includes(question.majorCategory as Field)
    );
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
      <QuizPlayer
        questions={picked}
        mode="random"
        plan={plan}
        resumeLabel={`絞り込み演習 ${picked.length}問`}
      />
    </div>
  );
}

function parseRounds(value: string | undefined): ExamRound[] {
  if (!value || value === "all") return [...EXAM_ROUNDS];
  const rounds = value
    .split(",")
    .map((item) => Number(item))
    .filter((round): round is ExamRound =>
      (EXAM_ROUNDS as readonly number[]).includes(round),
    );
  return rounds.length > 0 ? rounds : [...EXAM_ROUNDS];
}

function parseSessions(value: string | undefined): Session[] {
  if (!value || value === "all") return ["am", "pm"];
  const sessions = value
    .split(",")
    .filter((session): session is Session => session === "am" || session === "pm");
  return sessions.length > 0 ? sessions : ["am", "pm"];
}

function parseFields(value: string | undefined): Field[] {
  if (!value || value === "all") return [...FIELDS];
  const fields = value
    .split("|")
    .filter((field): field is Field => (FIELDS as readonly string[]).includes(field));
  return fields.length > 0 ? fields : [...FIELDS];
}
