import { getAccountStorageKey } from "@/lib/auth/account-storage";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";

export const LAST_QUIZ_STORAGE_KEY = "ortace.lastQuiz";

export type LastQuizQuestionState = {
  selected: ChoiceKey[];
  judgement?: AnswerJudgement;
};

export type LastQuizProgress = {
  href: string;
  label: string;
  index: number;
  total: number;
  savedAt: string;
  questionIds?: string[];
  states?: Record<string, LastQuizQuestionState>;
};

export function readLastQuizProgress(): LastQuizProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      getAccountStorageKey(LAST_QUIZ_STORAGE_KEY),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastQuizProgress>;
    if (
      typeof parsed.href !== "string" ||
      typeof parsed.label !== "string" ||
      typeof parsed.index !== "number" ||
      typeof parsed.total !== "number" ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }
    return {
      href: parsed.href,
      label: parsed.label,
      index: parsed.index,
      total: parsed.total,
      savedAt: parsed.savedAt,
      questionIds: parseQuestionIds(parsed.questionIds),
      states: parseQuestionStates(parsed.states),
    };
  } catch {
    return null;
  }
}

export function writeLastQuizProgress(progress: LastQuizProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getAccountStorageKey(LAST_QUIZ_STORAGE_KEY),
    JSON.stringify(progress),
  );
}

export function clearLastQuizProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getAccountStorageKey(LAST_QUIZ_STORAGE_KEY));
}

export function restoreQuestionsFromLastProgress(
  href: string,
  questions: readonly Question[],
): Question[] | null {
  const progress = readLastQuizProgress();
  if (!progress || progress.href !== href || !progress.questionIds) return null;

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const restored: Question[] = [];
  for (const id of progress.questionIds) {
    const question = questionById.get(id);
    if (!question) return null;
    restored.push(question);
  }

  return restored.length > 0 ? restored : null;
}

function parseQuestionIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((id): id is string => typeof id === "string");
  return ids.length > 0 ? ids : undefined;
}

function parseQuestionStates(
  value: unknown,
): Record<string, LastQuizQuestionState> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const states: Record<string, LastQuizQuestionState> = {};
  for (const [id, state] of Object.entries(value)) {
    if (!state || typeof state !== "object" || Array.isArray(state)) continue;
    const selected = Array.isArray((state as { selected?: unknown }).selected)
      ? (state as { selected: unknown[] }).selected.filter(isChoiceKey)
      : [];
    const judgement = (state as { judgement?: unknown }).judgement;
    states[id] = {
      selected,
      ...(isAnswerJudgement(judgement) ? { judgement } : {}),
    };
  }

  return Object.keys(states).length > 0 ? states : undefined;
}

function isChoiceKey(value: unknown): value is ChoiceKey {
  return (
    value === "1" ||
    value === "2" ||
    value === "3" ||
    value === "4" ||
    value === "5"
  );
}

function isAnswerJudgement(value: unknown): value is AnswerJudgement {
  return value === "correct" || value === "incorrect" || value === "no_answer";
}
