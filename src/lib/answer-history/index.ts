import type { AnswerJudgement } from "@/lib/quiz";
import type { ChoiceKey, Question, Session } from "@/lib/questions";

export const ANSWER_HISTORY_STORAGE_KEY = "ortace.stats";
const MAX_ANSWER_HISTORY_ENTRIES = 500;

export type AnswerHistoryEntry = {
  id: string;
  answeredAt: string;
  result: AnswerJudgement;
  selectedAnswers: ChoiceKey[];
  round: number;
  session: Session;
  displayNumber: number;
  majorCategory: string;
};

export type AnswerHistoryStore = {
  version: 1;
  entries: AnswerHistoryEntry[];
};

export function createAnswerHistoryStore(): AnswerHistoryStore {
  return { version: 1, entries: [] };
}

export function normalizeAnswerHistoryStore(value: unknown): AnswerHistoryStore {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.entries)) {
    return createAnswerHistoryStore();
  }

  const entries = value.entries
    .filter(isAnswerHistoryEntry)
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, MAX_ANSWER_HISTORY_ENTRIES);

  return { version: 1, entries };
}

export function parseAnswerHistoryStore(
  raw: string | null,
): AnswerHistoryStore {
  if (!raw) return createAnswerHistoryStore();
  try {
    return normalizeAnswerHistoryStore(JSON.parse(raw));
  } catch {
    return createAnswerHistoryStore();
  }
}

export function serializeAnswerHistoryStore(
  store: AnswerHistoryStore,
): string {
  return JSON.stringify(normalizeAnswerHistoryStore(store));
}

export function recordAnswerHistory(
  store: AnswerHistoryStore,
  params: {
    question: Question;
    result: AnswerJudgement;
    selectedAnswers: readonly ChoiceKey[];
    now?: Date;
  },
): AnswerHistoryStore {
  const current = normalizeAnswerHistoryStore(store);
  const { question, result, selectedAnswers, now = new Date() } = params;

  const entry: AnswerHistoryEntry = {
    id: question.id,
    answeredAt: now.toISOString(),
    result,
    selectedAnswers: uniqueChoiceKeys(selectedAnswers),
    round: question.round,
    session: question.session,
    displayNumber: question.displayNumber,
    majorCategory: question.majorCategory,
  };

  return normalizeAnswerHistoryStore({
    version: 1,
    entries: [entry, ...current.entries],
  });
}

export function getSortedAnswerHistoryEntries(store: AnswerHistoryStore) {
  return normalizeAnswerHistoryStore(store).entries;
}

function isAnswerHistoryEntry(value: unknown): value is AnswerHistoryEntry {
  if (!isObject(value)) return false;
  return (
    isValidQuestionId(value.id) &&
    typeof value.answeredAt === "string" &&
    value.answeredAt.length > 0 &&
    isAnswerJudgement(value.result) &&
    Array.isArray(value.selectedAnswers) &&
    value.selectedAnswers.every(isChoiceKey) &&
    typeof value.round === "number" &&
    (value.session === "am" || value.session === "pm") &&
    typeof value.displayNumber === "number" &&
    typeof value.majorCategory === "string"
  );
}

function uniqueChoiceKeys(value: readonly ChoiceKey[]): ChoiceKey[] {
  const valid = new Set<ChoiceKey>();
  for (const item of value) {
    if (isChoiceKey(item)) valid.add(item);
  }
  return ["1", "2", "3", "4", "5"].filter((key): key is ChoiceKey =>
    valid.has(key as ChoiceKey),
  );
}

function isAnswerJudgement(value: unknown): value is AnswerJudgement {
  return value === "correct" || value === "incorrect" || value === "no_answer";
}

function isChoiceKey(value: unknown): value is ChoiceKey {
  return value === "1" || value === "2" || value === "3" || value === "4" || value === "5";
}

function isValidQuestionId(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}-\d{1,3}$/.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
