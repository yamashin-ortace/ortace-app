import type { AnswerJudgement } from "@/lib/quiz";
import type { ChoiceKey, Question, Session } from "@/lib/questions";
import {
  computeSpacedRepetition,
  INCORRECT_REVIEW_DELAY_DAYS,
  STREAK_GRADUATION,
} from "./spaced-repetition";

export const ANSWER_HISTORY_STORAGE_KEY = "ortace.stats";
export const ANSWER_HISTORY_UPDATED_EVENT = "ortace:answer-history-updated";
const MAX_ANSWER_HISTORY_ENTRIES = 10_000;

export type ConfidenceLevel = "high" | "mid" | "guess";
export type AnswerFeeling =
  | "confident"
  | "unsure"
  | "no_basis"
  | "careless"
  | "stuck";

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
  /** 解答後の感覚・誤答理由（任意・未入力なら null） */
  answerFeeling?: AnswerFeeling | null;
  /** 問題表示から解答確定までの時間（ミリ秒・未計測なら null） */
  durationMs?: number | null;
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
    answerFeeling?: AnswerFeeling | null;
    durationMs?: number | null;
    now?: Date;
  },
): AnswerHistoryStore {
  const current = normalizeAnswerHistoryStore(store);
  const {
    question,
    result,
    selectedAnswers,
    confidence = null,
    answerFeeling = null,
    durationMs = null,
    now = new Date(),
  } = params;

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
  const normalizedConfidence =
    answerFeeling === null ? confidence : mapAnswerFeelingToConfidence(answerFeeling);
  const answeredAt = now.toISOString();

  const entry: AnswerHistoryEntry = {
    id: question.id,
    answeredAt,
    result,
    selectedAnswers: uniqueChoiceKeys(selectedAnswers),
    round: question.round,
    session: question.session,
    displayNumber: question.displayNumber,
    majorCategory: question.majorCategory,
    confidence: normalizedConfidence,
    answerFeeling,
    durationMs: normalizeDurationMs(durationMs),
    streak,
    nextReviewAt,
  };
  if (answerFeeling !== null) {
    entry.nextReviewAt = computeAnswerFeelingAdjustedNextReviewAt(
      entry,
      answerFeeling,
    );
  }

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
    return {
      ...entry,
      confidence: params.confidence,
      nextReviewAt: computeConfidenceAdjustedNextReviewAt(entry, params.confidence),
    };
  });
  if (!updated) return current;
  return normalizeAnswerHistoryStore({ version: 1, entries });
}

export function updateAnswerFeeling(
  store: AnswerHistoryStore,
  params: {
    questionId: string;
    answerFeeling: AnswerFeeling | null;
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
    const confidence = mapAnswerFeelingToConfidence(params.answerFeeling);
    return {
      ...entry,
      answerFeeling: params.answerFeeling,
      confidence,
      nextReviewAt: computeAnswerFeelingAdjustedNextReviewAt(
        entry,
        params.answerFeeling,
      ),
    };
  });
  if (!updated) return current;
  return normalizeAnswerHistoryStore({ version: 1, entries });
}

export function mapAnswerFeelingToConfidence(
  answerFeeling: AnswerFeeling | null,
): ConfidenceLevel | null {
  if (answerFeeling === "confident") return "high";
  if (answerFeeling === "unsure" || answerFeeling === "careless") return "mid";
  if (answerFeeling === "no_basis" || answerFeeling === "stuck") return "guess";
  return null;
}

export function isConfidentAnswer(entry: AnswerHistoryEntry | undefined | null) {
  if (!entry) return false;
  return (
    entry.answerFeeling === "confident" ||
    (!entry.answerFeeling && entry.confidence === "high")
  );
}

export function isUncertainAnswer(entry: AnswerHistoryEntry | undefined | null) {
  if (!entry) return false;
  if (
    entry.answerFeeling === "unsure" ||
    entry.answerFeeling === "no_basis" ||
    entry.answerFeeling === "stuck"
  ) {
    return true;
  }
  return (
    !entry.answerFeeling &&
    (entry.confidence === "mid" || entry.confidence === "guess")
  );
}

export function isCarelessAnswer(entry: AnswerHistoryEntry | undefined | null) {
  return entry?.answerFeeling === "careless";
}

export function getSortedAnswerHistoryEntries(store: AnswerHistoryStore) {
  return normalizeAnswerHistoryStore(store).entries;
}

export function getUniqueSortedAnswerHistoryEntries(store: AnswerHistoryStore) {
  const seen = new Set<string>();
  const entries: AnswerHistoryEntry[] = [];
  for (const entry of getSortedAnswerHistoryEntries(store)) {
    const key = createSemanticAnswerHistoryKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
  }
  return entries;
}

export function createSemanticAnswerHistoryKey(
  entry: AnswerHistoryEntry,
): string {
  return [
    entry.id,
    normalizeAnsweredAtForSemanticKey(entry.answeredAt),
    entry.result,
    entry.selectedAnswers.join(","),
  ].join("|");
}

function normalizeAnsweredAtForSemanticKey(value: string): string {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : value;
}

function computeConfidenceAdjustedNextReviewAt(
  entry: AnswerHistoryEntry,
  confidence: ConfidenceLevel | null,
): string | null {
  if (entry.result === "no_answer") return null;
  const answeredAt = new Date(entry.answeredAt);
  if (!Number.isFinite(answeredAt.getTime())) return entry.nextReviewAt ?? null;

  if (entry.result === "incorrect") {
    return formatLocalDate(addDays(answeredAt, INCORRECT_REVIEW_DELAY_DAYS));
  }

  const streak = typeof entry.streak === "number" ? entry.streak : 1;
  if (streak >= STREAK_GRADUATION) return null;

  const intervalDays = getCorrectConfidenceIntervalDays(confidence);
  if (intervalDays === null) return null;

  return formatLocalDate(addDays(answeredAt, intervalDays));
}

function computeAnswerFeelingAdjustedNextReviewAt(
  entry: AnswerHistoryEntry,
  answerFeeling: AnswerFeeling | null,
): string | null {
  if (entry.result === "no_answer") return null;
  const answeredAt = new Date(entry.answeredAt);
  if (!Number.isFinite(answeredAt.getTime())) return entry.nextReviewAt ?? null;

  if (entry.result === "incorrect") {
    const delayDays = answerFeeling === "careless" ? 1 : INCORRECT_REVIEW_DELAY_DAYS;
    return formatLocalDate(addDays(answeredAt, delayDays));
  }

  const streak = typeof entry.streak === "number" ? entry.streak : 1;
  if (streak >= STREAK_GRADUATION) return null;

  if (answerFeeling === "no_basis") return formatLocalDate(addDays(answeredAt, 7));
  if (answerFeeling === "unsure") return formatLocalDate(addDays(answeredAt, 14));
  return null;
}

function getCorrectConfidenceIntervalDays(
  confidence: ConfidenceLevel | null,
): number | null {
  if (confidence === "guess") return 7;
  if (confidence === "mid") return 14;
  return null;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
    (value.answerFeeling === undefined ||
      value.answerFeeling === null ||
      isAnswerFeeling(value.answerFeeling)) &&
    (value.durationMs === undefined ||
      value.durationMs === null ||
      isValidDurationMs(value.durationMs)) &&
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

function isAnswerFeeling(value: unknown): value is AnswerFeeling {
  return (
    value === "confident" ||
    value === "unsure" ||
    value === "no_basis" ||
    value === "careless" ||
    value === "stuck"
  );
}

function normalizeDurationMs(value: number | null): number | null {
  if (value === null) return null;
  if (!isValidDurationMs(value)) return null;
  return Math.round(value);
}

function isValidDurationMs(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 86_400_000
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
  // DB CHECK で正規 ID（例：47-12）は保証されているが、それ以外の文字列も
  // 「履歴データ」としてはそのまま保持したい（履歴のドロップで再同期不一致が
  // 発生しないようにする）。最低限、非空文字列であることだけ確認する。
  return typeof value === "string" && value.length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
