import type { AnswerJudgement } from "@/lib/quiz";
import type { ChoiceKey, Question, Session } from "@/lib/questions";
import { computeSpacedRepetition } from "./spaced-repetition";

export const ANSWER_HISTORY_STORAGE_KEY = "ortace.stats";
const MAX_ANSWER_HISTORY_ENTRIES = 10_000;

export type ConfidenceLevel = "high" | "mid" | "guess";

export type AnswerHistoryEntry = {
  id: string;
  answeredAt: string;
  result: AnswerJudgement;
  selectedAnswers: ChoiceKey[];
  round: number;
  session: Session;
  displayNumber: number;
  majorCategory: string;
  /** 解答時の自信度（任意・未入力なら null） */
  confidence?: ConfidenceLevel | null;
  /** この問題での連続正解数（0=未連続、誤答でリセット） */
  streak?: number;
  /** 次回復習日（"YYYY-MM-DD"・卒業や対象外なら null） */
  nextReviewAt?: string | null;
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
    confidence?: ConfidenceLevel | null;
    now?: Date;
  },
): AnswerHistoryStore {
  const current = normalizeAnswerHistoryStore(store);
  const { question, result, selectedAnswers, confidence = null, now = new Date() } = params;

  const previousLatest = current.entries.find(
    (entry) => entry.id === question.id,
  );
  const previousStreak =
    typeof previousLatest?.streak === "number" ? previousLatest.streak : 0;
  const { streak, nextReviewAt } = computeSpacedRepetition({
    result,
    previousStreak,
    now,
  });

  const entry: AnswerHistoryEntry = {
    id: question.id,
    answeredAt: now.toISOString(),
    result,
    selectedAnswers: uniqueChoiceKeys(selectedAnswers),
    round: question.round,
    session: question.session,
    displayNumber: question.displayNumber,
    majorCategory: question.majorCategory,
    confidence,
    streak,
    nextReviewAt,
  };

  return normalizeAnswerHistoryStore({
    version: 1,
    entries: [entry, ...current.entries],
  });
}

/**
 * 既存のエントリに自信度を後付けで反映する。
 * 同じ問題IDの最新エントリを更新する想定。
 */
export function updateAnswerConfidence(
  store: AnswerHistoryStore,
  params: {
    questionId: string;
    confidence: ConfidenceLevel | null;
    answeredAt?: string;
  },
): AnswerHistoryStore {
  const current = normalizeAnswerHistoryStore(store);
  const targetAnsweredAt = params.answeredAt;
  let updated = false;
  const entries = current.entries.map((entry) => {
    if (updated) return entry;
    if (entry.id !== params.questionId) return entry;
    if (targetAnsweredAt && entry.answeredAt !== targetAnsweredAt) return entry;
    updated = true;
    return { ...entry, confidence: params.confidence };
  });
  if (!updated) return current;
  return normalizeAnswerHistoryStore({ version: 1, entries });
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
    typeof value.majorCategory === "string" &&
    (value.confidence === undefined ||
      value.confidence === null ||
      isConfidenceLevel(value.confidence)) &&
    (value.streak === undefined ||
      (typeof value.streak === "number" && Number.isFinite(value.streak))) &&
    (value.nextReviewAt === undefined ||
      value.nextReviewAt === null ||
      (typeof value.nextReviewAt === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.nextReviewAt)))
  );
}

function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return value === "high" || value === "mid" || value === "guess";
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
  // DB CHECK で正規 ID（例：47-12）は保証されているが、それ以外の文字列も
  // 「履歴データ」としてはそのまま保持したい（履歴のドロップで再同期不一致が
  // 発生しないようにする）。最低限、非空文字列であることだけ確認する。
  return typeof value === "string" && value.length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
