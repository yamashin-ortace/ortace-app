import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { FIELDS, isScorableQuestion, type Question } from "@/lib/questions";
import {
  getFieldStats,
  getLatestEntryByQuestionId,
  getReviewQuestions,
  getStagedWeakFields,
  getUntouchedQuestions,
} from "@/lib/answer-history/status";
import { getTokyoDateString } from "@/lib/daily-limit";
import { pickHomeAiCoachFocus } from "./home-focus";
import { getAiThemeCluster, getAiThemeKey } from "./theme-cluster";

export const AI_COACH_RECOMMENDATION_LIMIT = 20;
export const AI_COACH_DATA_READINESS_THRESHOLD = 30;

export const AI_COACH_TARGETS = {
  focus: 3,
  review: 5,
  weak: 4,
  misconception: 3,
  unanswered: 5,
} as const;

const MATURITY_UNANSWERED_ONLY_UNIQUE_ANSWERS = 300;
const MATURITY_LIGHT_REVIEW_UNIQUE_ANSWERS = 500;
const MATURITY_BALANCED_UNIQUE_ANSWERS = 1000;
const LOW_UNTOUCHED_REMAINING_THRESHOLD = 40;

export type AnswerDurationBucket = "fast" | "standard" | "deliberate";
export type AiCoachBucket =
  | "focus"
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

export type AiCoachRecommendationOptions = {
  now?: Date;
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
  options: AiCoachRecommendationOptions = {},
): AiCoachRecommendation {
  const scorableQuestions = questions.filter(isScorableQuestion);
  const cappedLimit = Math.max(0, Math.min(limit, AI_COACH_RECOMMENDATION_LIMIT));
  const latest = getLatestEntryByQuestionId(entries);
  const questionById = new Map(
    scorableQuestions.map((question) => [question.id, question]),
  );
  const answeredTodayIds = getAnsweredTodayIds(entries, options.now);
  const buckets: Record<AiCoachBucket, Question[]> = {
    focus: [],
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

  const filterToday = (pool: readonly Question[]) =>
    pool.filter((question) => !answeredTodayIds.has(question.id));
  const focusPool = filterToday(
    buildFocusPool(scorableQuestions, entries, latest, options.now),
  );
  const reviewPool = filterToday(
    getReviewQuestions(scorableQuestions, entries, options.now),
  );
  const weakPool = filterToday(buildWeakPool(scorableQuestions, entries, latest));
  const misconceptionPool = filterToday(buildMisconceptionPool(
    scorableQuestions,
    entries,
    latest,
    questionById,
  ));
  const unansweredPool = pickBalancedUntouchedQuestions(
    getUntouchedQuestions(scorableQuestions, entries),
    entries,
    questionById,
    cappedLimit,
  );
  const mix = getRecommendationMix(latest.size, unansweredPool.length, cappedLimit);

  if (mix.focus > 0) add("focus", focusPool, mix.focus);
  add("unanswered", unansweredPool, mix.unanswered);
  if (mix.review > 0) add("review", reviewPool, mix.review);
  if (mix.weak > 0) add("weak", weakPool, mix.weak);
  if (mix.misconception > 0) {
    add("misconception", misconceptionPool, mix.misconception);
  }

  const fillPool = [
    ...unansweredPool,
    ...reviewPool,
    ...weakPool,
    ...misconceptionPool,
    ...focusPool,
    ...filterToday(rankBySourceOrder(scorableQuestions)),
  ];
  add("fill", fillPool, cappedLimit);

  return {
    questions: shuffleForSession(selected),
    buckets,
    dataReadiness:
      latest.size >= AI_COACH_DATA_READINESS_THRESHOLD ? "ready" : "collecting",
  };
}

function getRecommendationMix(
  uniqueAnsweredCount: number,
  untouchedCount: number,
  limit: number,
): Record<Exclude<AiCoachBucket, "fill">, number> {
  if (limit <= 0) {
    return { focus: 0, review: 0, weak: 0, misconception: 0, unanswered: 0 };
  }
  if (untouchedCount < Math.min(limit, LOW_UNTOUCHED_REMAINING_THRESHOLD)) {
    return {
      focus: Math.min(3, limit),
      review: Math.min(5, limit),
      weak: Math.min(5, limit),
      misconception: Math.min(3, limit),
      unanswered: Math.min(untouchedCount, limit),
    };
  }
  if (uniqueAnsweredCount < MATURITY_UNANSWERED_ONLY_UNIQUE_ANSWERS) {
    return { focus: 0, review: 0, weak: 0, misconception: 0, unanswered: limit };
  }
  if (uniqueAnsweredCount < MATURITY_LIGHT_REVIEW_UNIQUE_ANSWERS) {
    const support = Math.min(2, Math.max(0, limit - 1));
    const review = Math.min(1, support);
    const weak = Math.max(0, support - review);
    return {
      focus: 0,
      review,
      weak,
      misconception: 0,
      unanswered: limit - support,
    };
  }
  if (uniqueAnsweredCount < MATURITY_BALANCED_UNIQUE_ANSWERS) {
    const support = Math.min(Math.ceil(limit * 0.2), Math.max(0, limit - 1));
    const review = Math.min(2, support);
    const weak = Math.min(2, Math.max(0, support - review));
    const misconception = Math.max(0, support - review - weak);
    return {
      focus: 0,
      review,
      weak,
      misconception,
      unanswered: limit - support,
    };
  }
  return {
    focus: AI_COACH_TARGETS.focus,
    review: AI_COACH_TARGETS.review,
    weak: AI_COACH_TARGETS.weak,
    misconception: AI_COACH_TARGETS.misconception,
    unanswered: AI_COACH_TARGETS.unanswered,
  };
}

function pickBalancedUntouchedQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  questionById: Map<string, Question>,
  limit: number,
): Question[] {
  const touchedMinorByField = new Map<string, Set<string>>();
  const touchedThemeByField = new Map<string, Set<string>>();
  const recentFieldCount = new Map<string, number>();
  const recentEntries = [...entries]
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, 60);

  for (const entry of entries) {
    const question = questionById.get(entry.id);
    if (!question) continue;
    addToNestedSet(touchedMinorByField, question.majorCategory, question.minorCategory);
    addToNestedSet(touchedThemeByField, question.majorCategory, question.theme);
  }
  for (const entry of recentEntries) {
    recentFieldCount.set(
      entry.majorCategory,
      (recentFieldCount.get(entry.majorCategory) ?? 0) + 1,
    );
  }

  const fieldBuckets = new Map<string, Question[]>();
  for (const question of questions) {
    const list = fieldBuckets.get(question.majorCategory) ?? [];
    list.push(question);
    fieldBuckets.set(question.majorCategory, list);
  }
  for (const [field, list] of fieldBuckets) {
    const touchedMinor = touchedMinorByField.get(field) ?? new Set<string>();
    const touchedTheme = touchedThemeByField.get(field) ?? new Set<string>();
    list.sort((a, b) => {
      const aScore = getUntouchedNoveltyScore(a, touchedMinor, touchedTheme);
      const bScore = getUntouchedNoveltyScore(b, touchedMinor, touchedTheme);
      if (aScore !== bScore) return bScore - aScore;
      return compareQuestionSource(a, b);
    });
  }

  const knownFields = new Set<string>(FIELDS);
  const fieldOrder = [...FIELDS, ...[...fieldBuckets.keys()].filter((field) => !knownFields.has(field))]
    .filter((field) => (fieldBuckets.get(field)?.length ?? 0) > 0)
    .sort((a, b) => {
      const recentDiff = (recentFieldCount.get(a) ?? 0) - (recentFieldCount.get(b) ?? 0);
      if (recentDiff !== 0) return recentDiff;
      const remainingDiff = (fieldBuckets.get(b)?.length ?? 0) - (fieldBuckets.get(a)?.length ?? 0);
      if (remainingDiff !== 0) return remainingDiff;
      return getFieldIndex(a) - getFieldIndex(b);
    });

  const picked: Question[] = [];
  while (picked.length < limit && fieldOrder.length > 0) {
    let addedInRound = false;
    for (const field of fieldOrder) {
      if (picked.length >= limit) break;
      const bucket = fieldBuckets.get(field);
      const question = bucket?.shift();
      if (!question) continue;
      picked.push(question);
      addedInRound = true;
    }
    if (!addedInRound) break;
  }
  return picked;
}

function getFieldIndex(field: string): number {
  const index = (FIELDS as readonly string[]).indexOf(field);
  return index >= 0 ? index : FIELDS.length;
}

function getUntouchedNoveltyScore(
  question: Question,
  touchedMinor: Set<string>,
  touchedTheme: Set<string>,
): number {
  let score = 0;
  if (!touchedMinor.has(question.minorCategory)) score += 20;
  if (!touchedTheme.has(question.theme)) score += 10;
  return score;
}

function addToNestedSet(
  map: Map<string, Set<string>>,
  key: string,
  value: string,
) {
  const set = map.get(key) ?? new Set<string>();
  set.add(value);
  map.set(key, set);
}

function getAnsweredTodayIds(
  entries: readonly AnswerHistoryEntry[],
  now: Date = new Date(),
): Set<string> {
  const today = getTokyoDateString(now);
  return new Set(
    entries
      .filter((entry) => getTokyoDateString(new Date(entry.answeredAt)) === today)
      .map((entry) => entry.id),
  );
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

function buildFocusPool(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  latest: Map<string, AnswerHistoryEntry>,
  now: Date = new Date(),
): Question[] {
  const clusterLookup = {
    byId: new Map(
      questions.map((question) => {
        const cluster = getAiThemeCluster(question);
        return [question.id, { id: cluster.id, label: cluster.label }] as const;
      }),
    ),
  };
  const focus = pickHomeAiCoachFocus(entries, clusterLookup, now);
  if (!focus) return [];

  return [...questions]
    .map((question) => {
      const cluster = getAiThemeCluster(question);
      if (cluster.id !== focus.clusterId) return { question, score: 0 };

      const entry = latest.get(question.id);
      if (!entry) return { question, score: 80 };
      if (entry.result === "no_answer") return { question, score: 70 };
      if (entry.result === "correct") return { question, score: 0 };

      const durationBucket = classifyAnswerDuration(entry.durationMs);
      let score = 150;
      if (entry.confidence === "high") score += 50;
      if (entry.confidence === "mid" || entry.confidence === "guess") score += 15;
      if (durationBucket === "deliberate") score += 35;
      if (durationBucket === "fast") score += 10;
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
