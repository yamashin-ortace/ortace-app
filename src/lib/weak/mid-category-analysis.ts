import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import { classifyAnswerDuration } from "@/lib/ai-coach/recommendation";
import type { Question } from "@/lib/questions";
import type { WeakPracticeState } from "./practice-state";

export const EXAM_WEAK_DATA_READINESS_THRESHOLD = 30;
export const MID_CATEGORY_MIN_JUDGED = 3;
export const MID_CATEGORY_TOP_N = 3;
export const MID_CATEGORY_RECENT_ENTRY_LIMIT = 300;
export const WEAK_RECENT_ENTRY_LIMIT = 5;
export const WEAK_RECENT_INCORRECT_STREAK = 3;
export const WEAK_RECENT_MAX_CORRECT = 2;
export const WATCH_RECENT_CORRECT = 3;

export type MidCategoryWeaknessStatus = "weak" | "watch";

export type MidCategoryWeaknessRow = {
  categoryKey: string;
  majorCategory: string;
  minorCategory: string;
  status: MidCategoryWeaknessStatus;
  judged: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  highConfidenceMisses: number;
  slowAnswers: number;
  slowMisses: number;
  repeatedMisses: number;
  latestHighConfidenceMissQuestionIds: string[];
};

export type MidCategoryWeaknessAnalysis = {
  readiness: "collecting" | "ready";
  judgedCount: number;
  requiredCount: number;
  /** 明確な失点傾向があるテーマ。苦手克服の演習対象にする。 */
  rows: MidCategoryWeaknessRow[];
  /** 苦手とは断定しないが、今後の学習で意識したいテーマ。 */
  watchRows: MidCategoryWeaknessRow[];
};

type MidCategoryAnalysisOptions = {
  minJudged?: number;
  topN?: number;
  requiredCount?: number;
  recentEntryLimit?: number;
  practiceState?: WeakPracticeState;
};

type MidCategoryBucket = {
  majorCategory: string;
  minorCategory: string;
  entries: AnswerHistoryEntry[];
};

export function analyzeMidCategoryWeakness(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  options: MidCategoryAnalysisOptions = {},
): MidCategoryWeaknessAnalysis {
  const requiredCount =
    options.requiredCount ?? EXAM_WEAK_DATA_READINESS_THRESHOLD;
  const minJudged = options.minJudged ?? MID_CATEGORY_MIN_JUDGED;
  const topN = options.topN ?? MID_CATEGORY_TOP_N;
  const recentEntryLimit =
    options.recentEntryLimit ?? MID_CATEGORY_RECENT_ENTRY_LIMIT;
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const recentEntries = getRecentEntries(entries, recentEntryLimit);
  const latest = getLatestEntryByQuestionId(recentEntries);
  const historicalMissesByCategory = countHistoricalMissesByCategory(
    recentEntries,
    questionById,
  );
  const buckets = new Map<string, MidCategoryBucket>();
  let judgedCount = 0;

  for (const entry of latest.values()) {
    if (entry.result === "no_answer") continue;
    const question = questionById.get(entry.id);
    if (!question) continue;
    judgedCount += 1;

    const categoryKey = createMidCategoryKey(question);
    const bucket = buckets.get(categoryKey) ?? {
      majorCategory: question.majorCategory,
      minorCategory: normalizeMinorCategory(question),
      entries: [],
    };

    bucket.entries.push(entry);
    buckets.set(categoryKey, bucket);
  }

  const readiness = judgedCount >= requiredCount ? "ready" : "collecting";
  const rows = [...buckets.entries()]
    .filter(([, bucket]) => bucket.entries.length >= minJudged)
    .map(([categoryKey, bucket]) => {
      const recent = getRecentJudgedEntries(bucket.entries);
      const correct = recent.filter((entry) => entry.result === "correct").length;
      const incorrect = recent.filter((entry) => entry.result === "incorrect").length;
      const highConfidenceMisses = recent.filter(
        (entry) => entry.result === "incorrect" && entry.confidence === "high",
      ).length;
      const slowAnswers = recent.filter(
        (entry) => classifyAnswerDuration(entry.durationMs) === "deliberate",
      ).length;
      const slowMisses = recent.filter(
        (entry) =>
          entry.result === "incorrect" &&
          classifyAnswerDuration(entry.durationMs) === "deliberate",
      ).length;
      const historicalMisses = historicalMissesByCategory.get(categoryKey) ?? 0;
      const row = {
        categoryKey,
        majorCategory: bucket.majorCategory,
        minorCategory: bucket.minorCategory,
        judged: recent.length,
        correct,
        incorrect,
        accuracy: Math.round((correct / recent.length) * 100),
        highConfidenceMisses,
        slowAnswers,
        slowMisses,
        repeatedMisses: Math.max(0, historicalMisses - incorrect),
        latestHighConfidenceMissQuestionIds: recent
          .filter(
            (entry) =>
              entry.result === "incorrect" && entry.confidence === "high",
          )
          .map((entry) => entry.id),
      };
      const status = classifyWeaknessStatus(
        row,
        recent,
        bucket.entries,
        options.practiceState,
      );
      return status ? { ...row, status } : null;
    })
    .filter((row): row is MidCategoryWeaknessRow => row !== null);
  const weakRows = rows
    .filter((row) => row.status === "weak")
    .sort(compareWeaknessRows)
    .slice(0, topN);
  const watchRows = rows
    .filter((row) => row.status === "watch")
    .sort(compareWeaknessRows)
    .slice(0, topN);

  return {
    readiness,
    judgedCount,
    requiredCount,
    rows: readiness === "ready" ? weakRows : [],
    watchRows: readiness === "ready" ? watchRows : [],
  };
}

export function createMidCategoryKey(question: Question): string {
  return `${question.majorCategory}\u0000${normalizeMinorCategory(question)}`;
}

export function pickRotatedWeaknessRow(
  rows: readonly MidCategoryWeaknessRow[],
  lastPracticedCategoryKey: string | null,
  selectedCategoryKey?: string | null,
): MidCategoryWeaknessRow | null {
  const selected = rows.find((row) => row.categoryKey === selectedCategoryKey);
  if (selected) return selected;
  return (
    rows.find((row) => row.categoryKey !== lastPracticedCategoryKey) ??
    rows[0] ??
    null
  );
}

function normalizeMinorCategory(question: Question): string {
  const trimmed = question.minorCategory.trim();
  return trimmed.length > 0 ? trimmed : "中分類未設定";
}

function getRecentEntries(
  entries: readonly AnswerHistoryEntry[],
  limit: number,
): AnswerHistoryEntry[] {
  return [...entries]
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, Math.max(0, limit));
}

function countHistoricalMissesByCategory(
  entries: readonly AnswerHistoryEntry[],
  questionById: ReadonlyMap<string, Question>,
): Map<string, number> {
  const misses = new Map<string, number>();
  for (const entry of entries) {
    if (entry.result !== "incorrect") continue;
    const question = questionById.get(entry.id);
    if (!question) continue;
    const key = createMidCategoryKey(question);
    misses.set(key, (misses.get(key) ?? 0) + 1);
  }
  return misses;
}

function compareWeaknessRows(
  a: MidCategoryWeaknessRow,
  b: MidCategoryWeaknessRow,
): number {
  if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
  if (a.repeatedMisses !== b.repeatedMisses) {
    return b.repeatedMisses - a.repeatedMisses;
  }
  if (a.highConfidenceMisses !== b.highConfidenceMisses) {
    return b.highConfidenceMisses - a.highConfidenceMisses;
  }
  if (a.slowAnswers !== b.slowAnswers) return b.slowAnswers - a.slowAnswers;
  if (a.judged !== b.judged) return b.judged - a.judged;
  return a.minorCategory.localeCompare(b.minorCategory, "ja");
}

function classifyWeaknessStatus(
  row: Omit<MidCategoryWeaknessRow, "status">,
  recent: readonly AnswerHistoryEntry[],
  categoryEntries: readonly AnswerHistoryEntry[],
  practiceState?: WeakPracticeState,
): MidCategoryWeaknessStatus | null {
  const recentFive = recent.slice(0, WEAK_RECENT_ENTRY_LIMIT);
  const recentThree = recent.slice(0, WEAK_RECENT_INCORRECT_STREAK);
  const hasFiveQuestionWeakness =
    recentFive.length >= WEAK_RECENT_ENTRY_LIMIT &&
    recentFive.filter((entry) => entry.result === "correct").length <=
      WEAK_RECENT_MAX_CORRECT;
  const hasThreeMissStreak =
    recentThree.length >= WEAK_RECENT_INCORRECT_STREAK &&
    recentThree.every((entry) => entry.result === "incorrect");
  const hasReenteredWeakness =
    hasFiveQuestionWeakness || hasThreeMissStreak;
  const practiceRecord = practiceState?.themes[row.categoryKey];

  if (hasReenteredWeakness && !isSuppressedByObservation(practiceRecord, categoryEntries)) {
    return "weak";
  }

  const isStable =
    recentFive.length >= WEAK_RECENT_ENTRY_LIMIT &&
    recentFive.filter((entry) => entry.result === "correct").length >= 4;
  if (isStable) return null;

  const isWatch =
    (recentFive.length >= WEAK_RECENT_ENTRY_LIMIT &&
      recentFive.filter((entry) => entry.result === "correct").length ===
        WATCH_RECENT_CORRECT) ||
    row.highConfidenceMisses > 0 ||
    row.repeatedMisses > 0 ||
    Boolean(practiceRecord?.observing);
  if (isWatch) return "watch";
  return null;
}

function getRecentJudgedEntries(
  entries: readonly AnswerHistoryEntry[],
): AnswerHistoryEntry[] {
  return [...entries]
    .filter((entry) => entry.result !== "no_answer")
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, WEAK_RECENT_ENTRY_LIMIT);
}

function isSuppressedByObservation(
  record: WeakPracticeState["themes"][string] | undefined,
  categoryEntries: readonly AnswerHistoryEntry[],
): boolean {
  if (!record?.observing) return false;
  const followUp = getRecentJudgedEntries(
    categoryEntries.filter((entry) => entry.answeredAt > record.practicedAt),
  );
  const recentFive = followUp.slice(0, WEAK_RECENT_ENTRY_LIMIT);
  const recentThree = followUp.slice(0, WEAK_RECENT_INCORRECT_STREAK);
  const hasFiveQuestionWeakness =
    recentFive.length >= WEAK_RECENT_ENTRY_LIMIT &&
    recentFive.filter((entry) => entry.result === "correct").length <=
      WEAK_RECENT_MAX_CORRECT;
  const hasThreeMissStreak =
    recentThree.length >= WEAK_RECENT_INCORRECT_STREAK &&
    recentThree.every((entry) => entry.result === "incorrect");
  return !hasFiveQuestionWeakness && !hasThreeMissStreak;
}
