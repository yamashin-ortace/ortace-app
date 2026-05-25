import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import { classifyAnswerDuration } from "@/lib/ai-coach/recommendation";
import type { Question } from "@/lib/questions";

export const EXAM_WEAK_DATA_READINESS_THRESHOLD = 30;
export const MID_CATEGORY_MIN_JUDGED = 3;
export const MID_CATEGORY_TOP_N = 3;
export const MID_CATEGORY_RECENT_ENTRY_LIMIT = 300;

export type MidCategoryWeaknessRow = {
  categoryKey: string;
  majorCategory: string;
  minorCategory: string;
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
  rows: MidCategoryWeaknessRow[];
};

type MidCategoryAnalysisOptions = {
  minJudged?: number;
  topN?: number;
  requiredCount?: number;
  recentEntryLimit?: number;
};

type MidCategoryBucket = {
  majorCategory: string;
  minorCategory: string;
  judged: number;
  correct: number;
  incorrect: number;
  highConfidenceMisses: number;
  slowAnswers: number;
  slowMisses: number;
  latestHighConfidenceMissQuestionIds: string[];
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
      judged: 0,
      correct: 0,
      incorrect: 0,
      highConfidenceMisses: 0,
      slowAnswers: 0,
      slowMisses: 0,
      latestHighConfidenceMissQuestionIds: [],
    };

    bucket.judged += 1;
    if (entry.result === "correct") {
      bucket.correct += 1;
    } else {
      bucket.incorrect += 1;
      if (entry.confidence === "high") {
        bucket.highConfidenceMisses += 1;
        bucket.latestHighConfidenceMissQuestionIds.push(entry.id);
      }
      if (classifyAnswerDuration(entry.durationMs) === "deliberate") {
        bucket.slowMisses += 1;
      }
    }
    if (classifyAnswerDuration(entry.durationMs) === "deliberate") {
      bucket.slowAnswers += 1;
    }
    buckets.set(categoryKey, bucket);
  }

  const readiness = judgedCount >= requiredCount ? "ready" : "collecting";
  const rows = [...buckets.entries()]
    .filter(([, bucket]) => bucket.judged >= minJudged)
    .map(([categoryKey, bucket]): MidCategoryWeaknessRow => {
      const historicalMisses = historicalMissesByCategory.get(categoryKey) ?? 0;
      return {
        categoryKey,
        majorCategory: bucket.majorCategory,
        minorCategory: bucket.minorCategory,
        judged: bucket.judged,
        correct: bucket.correct,
        incorrect: bucket.incorrect,
        accuracy: Math.round((bucket.correct / bucket.judged) * 100),
        highConfidenceMisses: bucket.highConfidenceMisses,
        slowAnswers: bucket.slowAnswers,
        slowMisses: bucket.slowMisses,
        repeatedMisses: Math.max(0, historicalMisses - bucket.incorrect),
        latestHighConfidenceMissQuestionIds: bucket.latestHighConfidenceMissQuestionIds,
      };
    })
    .sort(compareWeaknessRows)
    .slice(0, topN);

  return {
    readiness,
    judgedCount,
    requiredCount,
    rows: readiness === "ready" ? rows : [],
  };
}

export function createMidCategoryKey(question: Question): string {
  return `${question.majorCategory}\u0000${normalizeMinorCategory(question)}`;
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
  if (a.highConfidenceMisses !== b.highConfidenceMisses) {
    return b.highConfidenceMisses - a.highConfidenceMisses;
  }
  if (a.slowAnswers !== b.slowAnswers) return b.slowAnswers - a.slowAnswers;
  if (a.judged !== b.judged) return b.judged - a.judged;
  return a.minorCategory.localeCompare(b.minorCategory, "ja");
}
