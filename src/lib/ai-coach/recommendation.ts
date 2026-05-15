import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { isScorableQuestion, type Question } from "@/lib/questions";
import {
  getFieldStats,
  getLatestEntryByQuestionId,
  getReviewTargetIds,
  getStagedWeakFields,
  getUntouchedQuestions,
} from "@/lib/answer-history/status";
import { getAiThemeKey } from "./theme-cluster";

export const AI_COACH_RECOMMENDATION_LIMIT = 20;
export const AI_COACH_DATA_READINESS_THRESHOLD = 30;

export const AI_COACH_TARGETS = {
  review: 6,
  weak: 5,
  misconception: 3,
  unanswered: 6,
} as const;

export type AnswerDurationBucket = "fast" | "standard" | "deliberate";
export type AiCoachBucket =
  | "review"
  | "weak"
  | "misconception"
  | "unanswered"
  | "fill";

export type AiCoachRecommendation = {
  questions: Question[];
  buckets: Record<AiCoachBucket, Question[]>;
  dataReadiness: "collecting" | "ready";
};

export function classifyAnswerDuration(
  durationMs: number | null | undefined,
): AnswerDurationBucket | null {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) return null;
  if (durationMs < 15_000) return "fast";
  if (durationMs < 60_000) return "standard";
  return "deliberate";
}

export function pickAiCoachRecommended(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  limit = AI_COACH_RECOMMENDATION_LIMIT,
): AiCoachRecommendation {
  const scorableQuestions = questions.filter(isScorableQuestion);
  const cappedLimit = Math.max(0, Math.min(limit, AI_COACH_RECOMMENDATION_LIMIT));
  const latest = getLatestEntryByQuestionId(entries);
  const questionById = new Map(
    scorableQuestions.map((question) => [question.id, question]),
  );
  const buckets: Record<AiCoachBucket, Question[]> = {
    review: [],
    weak: [],
    misconception: [],
    unanswered: [],
    fill: [],
  };
  const selected: Question[] = [];
  const seen = new Set<string>();

  const add = (bucket: AiCoachBucket, pool: readonly Question[], max: number) => {
    for (const question of pool) {
      if (selected.length >= cappedLimit || buckets[bucket].length >= max) break;
      if (seen.has(question.id)) continue;
      selected.push(question);
      buckets[bucket].push(question);
      seen.add(question.id);
    }
  };

  const reviewIds = getReviewTargetIds(entries);
  const reviewPool = rankBySourceOrder(
    scorableQuestions.filter((question) => reviewIds.has(question.id)),
  );
  const weakPool = buildWeakPool(scorableQuestions, entries, latest);
  const misconceptionPool = buildMisconceptionPool(
    scorableQuestions,
    entries,
    latest,
    questionById,
  );
  const unansweredPool = rankBySourceOrder(
    getUntouchedQuestions(scorableQuestions, entries),
  );

  add("review", reviewPool, AI_COACH_TARGETS.review);
  add("weak", weakPool, AI_COACH_TARGETS.weak);
  add("misconception", misconceptionPool, AI_COACH_TARGETS.misconception);
  add("unanswered", unansweredPool, AI_COACH_TARGETS.unanswered);

  const fillPool = [
    ...unansweredPool,
    ...reviewPool,
    ...weakPool,
    ...misconceptionPool,
    ...rankBySourceOrder(scorableQuestions),
  ];
  add("fill", fillPool, cappedLimit);

  return {
    questions: shuffleForSession(selected),
    buckets,
    dataReadiness:
      latest.size >= AI_COACH_DATA_READINESS_THRESHOLD ? "ready" : "collecting",
  };
}

/**
 * 思い込みミス候補の件数を、回答履歴だけから素早く算出する。
 * 「最新が誤答」かつ「自信あり または 解答時間が15秒未満」の数を返す。
 * テーマ反復ミスは含まないので pickMisconceptionQuestions の実数より小さくなる場合がある。
 */
export function countMisconceptionCandidates(
  entries: readonly AnswerHistoryEntry[],
): number {
  const latest = getLatestEntryByQuestionId(entries);
  let count = 0;
  for (const entry of latest.values()) {
    if (entry.result !== "incorrect") continue;
    const isHighConfidence = entry.confidence === "high";
    const isFast = classifyAnswerDuration(entry.durationMs) === "fast";
    if (isHighConfidence || isFast) count += 1;
  }
  return count;
}

export function pickMisconceptionQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  limit = AI_COACH_RECOMMENDATION_LIMIT,
): Question[] {
  const scorableQuestions = questions.filter(isScorableQuestion);
  const latest = getLatestEntryByQuestionId(entries);
  const questionById = new Map(
    scorableQuestions.map((question) => [question.id, question]),
  );
  return buildMisconceptionPool(
    scorableQuestions,
    entries,
    latest,
    questionById,
  ).slice(0, limit);
}

function buildWeakPool(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  latest: Map<string, AnswerHistoryEntry>,
): Question[] {
  const staged = getStagedWeakFields(getFieldStats(questions, entries));
  const rankedFields = [...staged.confirmed, ...staged.provisional].slice(0, 3);
  const fieldRank = new Map(rankedFields.map((stat, index) => [stat.field, index]));
  if (fieldRank.size === 0) return [];

  return [...questions]
    .filter((question) => fieldRank.has(question.majorCategory))
    .filter((question) => {
      const entry = latest.get(question.id);
      return !entry || entry.result === "incorrect";
    })
    .sort((a, b) => {
      const fieldDiff =
        (fieldRank.get(a.majorCategory) ?? 999) -
        (fieldRank.get(b.majorCategory) ?? 999);
      if (fieldDiff !== 0) return fieldDiff;
      const aTouched = latest.has(a.id) ? 1 : 0;
      const bTouched = latest.has(b.id) ? 1 : 0;
      if (aTouched !== bTouched) return aTouched - bTouched;
      return compareQuestionSource(a, b);
    });
}

function buildMisconceptionPool(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  latest: Map<string, AnswerHistoryEntry>,
  questionById: Map<string, Question>,
): Question[] {
  const mistakeCountByTheme = new Map<string, number>();
  for (const entry of entries) {
    if (entry.result !== "incorrect") continue;
    const question = questionById.get(entry.id);
    const themeKey = makeThemeKey(question);
    if (!themeKey) continue;
    mistakeCountByTheme.set(themeKey, (mistakeCountByTheme.get(themeKey) ?? 0) + 1);
  }

  return [...questions]
    .map((question) => {
      const entry = latest.get(question.id);
      if (!entry || entry.result === "correct") return { question, score: 0 };
      if (entry.result === "no_answer") return { question, score: 0 };
      const themeMistakes = mistakeCountByTheme.get(makeThemeKey(question) ?? "") ?? 0;
      const durationBucket = classifyAnswerDuration(entry.durationMs);
      let score = 0;
      if (entry.confidence === "high") score += 100;
      if (durationBucket === "fast") score += 60;
      if (themeMistakes >= 2) score += 35;
      return { question, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      const aEntry = latest.get(a.question.id);
      const bEntry = latest.get(b.question.id);
      const aAnsweredAt = aEntry?.answeredAt ?? "";
      const bAnsweredAt = bEntry?.answeredAt ?? "";
      if (aAnsweredAt !== bAnsweredAt) return bAnsweredAt.localeCompare(aAnsweredAt);
      return compareQuestionSource(a.question, b.question);
    })
    .map((item) => item.question);
}

function makeThemeKey(question: Question | undefined): string | null {
  return question ? getAiThemeKey(question) : null;
}

function rankBySourceOrder(questions: readonly Question[]): Question[] {
  return [...questions].sort(compareQuestionSource);
}

function shuffleForSession(questions: readonly Question[]): Question[] {
  const result = [...questions];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function compareQuestionSource(a: Question, b: Question): number {
  if (a.round !== b.round) return a.round - b.round;
  if (a.session !== b.session) return a.session === "am" ? -1 : 1;
  return a.displayNumber - b.displayNumber;
}
