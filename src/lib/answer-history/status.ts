import { FIELDS, type Question, type Field } from "@/lib/questions";
import {
  DEFAULT_PASS_LINE_SCORE,
  EXAM_FIELD_DISTRIBUTION,
  EXAM_FIELD_DISTRIBUTION_TOTAL,
  MAX_EXAM_SCORE,
} from "@/lib/exam/distribution";
import type { AnswerHistoryEntry } from ".";
import { isDueForReview } from "./spaced-repetition";

export type QuestionStatus =
  | "untouched"
  | "latest_correct"
  | "latest_incorrect"
  | "no_answer";

export function getLatestEntryByQuestionId(
  entries: readonly AnswerHistoryEntry[],
): Map<string, AnswerHistoryEntry> {
  const latest = new Map<string, AnswerHistoryEntry>();
  for (const entry of entries) {
    const existing = latest.get(entry.id);
    if (!existing || entry.answeredAt > existing.answeredAt) {
      latest.set(entry.id, entry);
    }
  }
  return latest;
}

export function getQuestionStatus(
  entry: AnswerHistoryEntry | undefined,
): QuestionStatus {
  if (!entry) return "untouched";
  if (entry.result === "correct") return "latest_correct";
  if (entry.result === "incorrect") return "latest_incorrect";
  return "no_answer";
}

/**
 * 「今日復習すべき問題」の問題IDを返す。
 *
 * 復習スケジュール（`nextReviewAt`）が設定されている問題はその日付以前のみ、
 * スケジュール未設定の旧データはこれまで通り直近不正解/未確定を対象にする。
 */
export function getReviewTargetIds(
  entries: readonly AnswerHistoryEntry[],
  now: Date = new Date(),
): Set<string> {
  const todayLocalDate = formatLocalDate(now);
  const latest = getLatestEntryByQuestionId(entries);
  const ids = new Set<string>();
  for (const [id, entry] of latest) {
    if (isDueForReview(entry, todayLocalDate)) {
      ids.add(id);
    }
  }
  return ids;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function filterByStatus(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  status: QuestionStatus,
): Question[] {
  const latest = getLatestEntryByQuestionId(entries);
  return questions.filter(
    (question) => getQuestionStatus(latest.get(question.id)) === status,
  );
}

export function getUntouchedQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
): Question[] {
  const answered = new Set(entries.map((entry) => entry.id));
  return questions.filter((question) => !answered.has(question.id));
}

export function getReviewQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  now: Date = new Date(),
): Question[] {
  const targets = getReviewTargetIds(entries, now);
  const latest = getLatestEntryByQuestionId(entries);
  const entriesByQuestionId = groupEntriesByQuestionId(entries);
  return questions
    .filter((question) => targets.has(question.id))
    .sort((a, b) => {
      const aEntry = latest.get(a.id);
      const bEntry = latest.get(b.id);
      const aScore = getReviewPriorityScore(
        aEntry,
        entriesByQuestionId.get(a.id) ?? [],
        now,
      );
      const bScore = getReviewPriorityScore(
        bEntry,
        entriesByQuestionId.get(b.id) ?? [],
        now,
      );
      if (aScore !== bScore) return bScore - aScore;
      const aAnsweredAt = aEntry?.answeredAt ?? "";
      const bAnsweredAt = bEntry?.answeredAt ?? "";
      if (aAnsweredAt !== bAnsweredAt) return bAnsweredAt.localeCompare(aAnsweredAt);
      return compareQuestionSource(a, b);
    });
}

function groupEntriesByQuestionId(
  entries: readonly AnswerHistoryEntry[],
): Map<string, AnswerHistoryEntry[]> {
  const grouped = new Map<string, AnswerHistoryEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.id) ?? [];
    list.push(entry);
    grouped.set(entry.id, list);
  }
  return grouped;
}

function getReviewPriorityScore(
  latest: AnswerHistoryEntry | undefined,
  entries: readonly AnswerHistoryEntry[],
  now: Date,
): number {
  if (!latest) return 0;
  let score = getReviewOverdueScore(latest, now);
  const incorrectCount = entries.filter((entry) => entry.result === "incorrect").length;

  if (latest.result === "incorrect") {
    score += 1000;
    if (latest.confidence === "high") score += 400;
    if (isFastIncorrect(latest)) score += 260;
    if (incorrectCount >= 2) score += 180 + incorrectCount * 20;
  } else if (latest.result === "correct") {
    if (latest.confidence === "guess") score += 180;
    if (latest.confidence === "mid") score += 120;
  }

  return score;
}

function getReviewOverdueScore(
  entry: AnswerHistoryEntry,
  now: Date,
): number {
  if (!entry.nextReviewAt) return 0;
  const dueAt = new Date(`${entry.nextReviewAt}T00:00:00`);
  const today = new Date(`${formatLocalDate(now)}T00:00:00`);
  if (!Number.isFinite(dueAt.getTime()) || !Number.isFinite(today.getTime())) {
    return 0;
  }
  const days = Math.floor(
    (today.getTime() - dueAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.max(0, Math.min(90, days * 6));
}

function isFastIncorrect(entry: AnswerHistoryEntry): boolean {
  return (
    entry.result === "incorrect" &&
    typeof entry.durationMs === "number" &&
    Number.isFinite(entry.durationMs) &&
    entry.durationMs < 15_000
  );
}

function compareQuestionSource(a: Question, b: Question): number {
  if (a.round !== b.round) return a.round - b.round;
  if (a.session !== b.session) return a.session === "am" ? -1 : 1;
  return a.displayNumber - b.displayNumber;
}

export type FieldStat = {
  field: string;
  total: number;
  answered: number;
  remaining: number;
  /** 正誤判定済みの解答数（同じ問題は最新のみ集計） */
  judged: number;
  correct: number;
  correctRate: number | null;
  accuracyRate: number | null;
};

/** 苦手分野判定の段階閾値 */
export const WEAK_FIELD_PROVISIONAL_THRESHOLD = 5;
export const WEAK_FIELD_CONFIRMED_THRESHOLD = 10;

export type WeakFieldStage = "confirmed" | "provisional" | "insufficient";

export function getWeakFieldStage(judged: number): WeakFieldStage {
  if (judged >= WEAK_FIELD_CONFIRMED_THRESHOLD) return "confirmed";
  if (judged >= WEAK_FIELD_PROVISIONAL_THRESHOLD) return "provisional";
  return "insufficient";
}

export function getFieldStats(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
): FieldStat[] {
  const totalsByField = new Map<string, number>();
  for (const question of questions) {
    totalsByField.set(
      question.majorCategory,
      (totalsByField.get(question.majorCategory) ?? 0) + 1,
    );
  }

  const latest = getLatestEntryByQuestionId(entries);
  const judgedByField = new Map<string, { correct: number; judged: number; answered: number }>();
  for (const [, entry] of latest) {
    const bucket = judgedByField.get(entry.majorCategory) ?? {
      correct: 0,
      judged: 0,
      answered: 0,
    };
    bucket.answered += 1;
    if (entry.result === "correct") {
      bucket.correct += 1;
      bucket.judged += 1;
    } else if (entry.result === "incorrect") {
      bucket.judged += 1;
    }
    judgedByField.set(entry.majorCategory, bucket);
  }

  return Array.from(totalsByField.entries()).map(([field, total]) => {
    const bucket = judgedByField.get(field);
    const answered = bucket?.answered ?? 0;
    const judged = bucket?.judged ?? 0;
    const correctRate = total === 0 ? null : Math.round((answered / total) * 100);
    const accuracyRate =
      bucket && bucket.judged > 0
        ? Math.round((bucket.correct / bucket.judged) * 100)
        : null;
    return {
      field,
      total,
      answered,
      remaining: Math.max(0, total - answered),
      judged,
      correct: bucket?.correct ?? 0,
      correctRate,
      accuracyRate,
    };
  });
}

export function getWeakFields(stats: readonly FieldStat[]): FieldStat[] {
  return [...stats].sort((a, b) => {
    const aRate = a.accuracyRate ?? 999;
    const bRate = b.accuracyRate ?? 999;
    if (aRate !== bRate) return aRate - bRate;
    return b.remaining - a.remaining;
  });
}

export type StagedWeakFields = {
  confirmed: FieldStat[];
  provisional: FieldStat[];
  insufficient: FieldStat[];
};

/**
 * 苦手分野を段階別に分類して返す。
 * - confirmed: 判定済 10問以上で正答率の低い順
 * - provisional: 判定済 5問以上 10問未満で正答率の低い順
 * - insufficient: 判定済 5問未満
 *
 * 「苦手分野モード」の出題対象は confirmed を優先し、足りなければ provisional で補う想定。
 */
export function getStagedWeakFields(
  stats: readonly FieldStat[],
): StagedWeakFields {
  const confirmed: FieldStat[] = [];
  const provisional: FieldStat[] = [];
  const insufficient: FieldStat[] = [];
  for (const stat of stats) {
    const stage = getWeakFieldStage(stat.judged);
    if (stage === "confirmed") confirmed.push(stat);
    else if (stage === "provisional") provisional.push(stat);
    else insufficient.push(stat);
  }
  const sortByAccuracy = (a: FieldStat, b: FieldStat) => {
    const aRate = a.accuracyRate ?? 999;
    const bRate = b.accuracyRate ?? 999;
    if (aRate !== bRate) return aRate - bRate;
    return b.remaining - a.remaining;
  };
  confirmed.sort(sortByAccuracy);
  provisional.sort(sortByAccuracy);
  return { confirmed, provisional, insufficient };
}

/** 推定スコアの計算に使う、分野ごとの最小解答数 */
export const MIN_FIELD_JUDGED_FOR_SCORE = 3;
/** 信頼できる現在地として扱うための、採点可能なユニーク解答数 */
export const TARGET_TOTAL_JUDGED_FOR_SCORE = 1000;
/** 各分野で目標にする収録問題カバー率 */
export const TARGET_FIELD_COVERAGE_RATE_FOR_SCORE = 0.7;
/** 問題数が少ない分野でも目安にする最低到達問数 */
export const MIN_TARGET_FIELD_JUDGED_FOR_SCORE = 60;

const CONSERVATIVE_SCORE_PRIOR_RATE = 0.5;

export type EstimatedScoreReadiness = "collecting" | "provisional" | "ready";

export type EstimatedScoreFieldProgress = {
  field: Field;
  total: number;
  judged: number;
  minimumTargetJudged: number;
  minimumRemaining: number;
  targetJudged: number;
  remaining: number;
  ready: boolean;
};

export type EstimatedScore = {
  /** 150点満点換算の慎重推定スコア（小数点を四捨五入） */
  score: number;
  /** 補正前の実測スコア。UIでは主表示にしない。 */
  observedScore: number;
  /** 0〜100 のカバー率（最低解答数を満たした分野の出題数 / 合計出題数） */
  coverage: number;
  /** 0〜100 の網羅率（目標解答数を満たした分野の出題数 / 合計出題数） */
  readinessCoverage: number;
  /** 正誤判定済みの総解答数（同じ問題は最新のみ集計） */
  totalJudged: number;
  targetTotalJudged: number;
  targetFieldCoverageRate: number;
  minTargetFieldJudged: number;
  /** 全分野3問の仮推定に必要な残り問題数 */
  minimumFieldRemaining: number;
  /** 分野別の信頼目標に必要な残り問題数 */
  readyFieldRemaining: number;
  /** 合計1000問に必要な残り問題数 */
  totalRemaining: number;
  /** 次の評価段階までに最低限必要な残り問題数 */
  nextStageRemaining: number;
  fieldProgress: EstimatedScoreFieldProgress[];
  scoredFieldCount: number;
  readyFieldCount: number;
  totalFieldCount: number;
  readiness: EstimatedScoreReadiness;
  canJudgePassLine: boolean;
  /** 最低解答数未満でスコア化できなかった分野名 */
  insufficientFields: Field[];
  /** スコア化はするが、まだ目標解答数に届いていない分野名 */
  underSampledFields: Field[];
  /** 合格圏ライン（点） */
  passLineScore: number;
  /** 満点 */
  maxScore: number;
};

/**
 * 分野別の最新正答率を、本試験の分野別出題数で加重平均して
 * 150点満点の慎重推定スコアに換算する。
 *
 * - 3問未満の分野はカウントしない（仮値で埋めない）。
 * - 分野ごとの目標到達前は、未到達分を50%として扱い、偶然の高得点を抑える。
 * - 合計1000問と全9分野の網羅目標に届くまでは、合格基準の判定には使わない。
 */
export function calculateEstimatedScore(
  fieldStats: readonly FieldStat[],
  passLineScore: number = DEFAULT_PASS_LINE_SCORE,
): EstimatedScore {
  let score = 0;
  let observedScore = 0;
  let coveredDistribution = 0;
  let readyDistribution = 0;
  let totalJudged = 0;
  let scoredFieldCount = 0;
  let readyFieldCount = 0;
  let minimumFieldRemaining = 0;
  let readyFieldRemaining = 0;
  const fieldProgress: EstimatedScoreFieldProgress[] = [];
  const insufficientFields: Field[] = [];
  const underSampledFields: Field[] = [];

  for (const stat of fieldStats) {
    const field = stat.field as Field;
    const dist = EXAM_FIELD_DISTRIBUTION[field] ?? 0;
    if (dist === 0) continue;
    totalJudged += stat.judged;
    const minimumRemaining = Math.max(0, MIN_FIELD_JUDGED_FOR_SCORE - stat.judged);
    minimumFieldRemaining += minimumRemaining;
    const targetFieldJudged = getTargetFieldJudgedForScore(stat.total);
    const fieldRemaining = Math.max(0, targetFieldJudged - stat.judged);
    readyFieldRemaining += fieldRemaining;
    fieldProgress.push({
      field,
      total: stat.total,
      judged: stat.judged,
      minimumTargetJudged: Math.min(stat.total, MIN_FIELD_JUDGED_FOR_SCORE),
      minimumRemaining,
      targetJudged: targetFieldJudged,
      remaining: fieldRemaining,
      ready: fieldRemaining === 0,
    });
    if (stat.judged < MIN_FIELD_JUDGED_FOR_SCORE || stat.accuracyRate === null) {
      insufficientFields.push(field);
      continue;
    }
    const observedRate = getObservedAccuracyRate(stat);
    const conservativeRate = getConservativeAccuracyRate(
      stat,
      targetFieldJudged,
    );
    observedScore += observedRate * dist;
    score += conservativeRate * dist;
    coveredDistribution += dist;
    scoredFieldCount += 1;
    if (stat.judged >= targetFieldJudged) {
      readyDistribution += dist;
      readyFieldCount += 1;
    } else {
      underSampledFields.push(field);
    }
  }

  const totalDistribution = EXAM_FIELD_DISTRIBUTION_TOTAL || 1;
  const totalFieldCount = FIELDS.length;
  const hasAllFieldsScored = scoredFieldCount === totalFieldCount;
  const hasAllFieldsReady = readyFieldCount === totalFieldCount;
  const hasEnoughTotalJudged = totalJudged >= TARGET_TOTAL_JUDGED_FOR_SCORE;
  const readiness: EstimatedScoreReadiness = hasAllFieldsReady && hasEnoughTotalJudged
    ? "ready"
    : hasAllFieldsScored
      ? "provisional"
      : "collecting";
  const totalRemaining = Math.max(
    0,
    TARGET_TOTAL_JUDGED_FOR_SCORE - totalJudged,
  );
  const nextStageRemaining =
    readiness === "collecting"
      ? minimumFieldRemaining
      : readiness === "provisional"
        ? Math.max(totalRemaining, readyFieldRemaining)
        : 0;

  return {
    score: Math.round(score),
    observedScore: Math.round(observedScore),
    coverage: Math.round((coveredDistribution / totalDistribution) * 100),
    readinessCoverage: Math.round((readyDistribution / totalDistribution) * 100),
    totalJudged,
    targetTotalJudged: TARGET_TOTAL_JUDGED_FOR_SCORE,
    targetFieldCoverageRate: Math.round(
      TARGET_FIELD_COVERAGE_RATE_FOR_SCORE * 100,
    ),
    minTargetFieldJudged: MIN_TARGET_FIELD_JUDGED_FOR_SCORE,
    minimumFieldRemaining,
    readyFieldRemaining,
    totalRemaining,
    nextStageRemaining,
    fieldProgress,
    scoredFieldCount,
    readyFieldCount,
    totalFieldCount,
    readiness,
    canJudgePassLine: readiness === "ready",
    insufficientFields,
    underSampledFields,
    passLineScore,
    maxScore: MAX_EXAM_SCORE,
  };
}

function getObservedAccuracyRate(stat: FieldStat): number {
  if (stat.judged <= 0) return 0;
  return Math.max(0, Math.min(1, stat.correct / stat.judged));
}

export function getTargetFieldJudgedForScore(total: number): number {
  if (total <= 0) return 0;
  const coverageTarget = Math.ceil(total * TARGET_FIELD_COVERAGE_RATE_FOR_SCORE);
  return Math.min(
    total,
    Math.max(MIN_TARGET_FIELD_JUDGED_FOR_SCORE, coverageTarget),
  );
}

function getConservativeAccuracyRate(
  stat: FieldStat,
  targetFieldJudged: number,
): number {
  if (targetFieldJudged <= 0) return getObservedAccuracyRate(stat);
  const correct = Math.max(0, Math.min(stat.correct, stat.judged));
  const missingToTarget = Math.max(0, targetFieldJudged - stat.judged);
  return (
    (correct + CONSERVATIVE_SCORE_PRIOR_RATE * missingToTarget) /
    Math.max(1, stat.judged + missingToTarget)
  );
}

/**
 * 履歴だけから「直近の苦手分野」と判定段階を返す。
 * - 確定: 5問以上の中で最低正答率
 * - 暫定: 5問未満ならスキップ
 */
export function getWeakFieldFromHistory(
  entries: readonly AnswerHistoryEntry[],
): { field: string; stage: WeakFieldStage } | null {
  const latest = getLatestEntryByQuestionId(entries);
  const byField = new Map<string, { correct: number; judged: number }>();
  for (const [, entry] of latest) {
    const bucket = byField.get(entry.majorCategory) ?? { correct: 0, judged: 0 };
    if (entry.result === "correct") {
      bucket.correct += 1;
      bucket.judged += 1;
    } else if (entry.result === "incorrect") {
      bucket.judged += 1;
    }
    byField.set(entry.majorCategory, bucket);
  }
  let weakest: { field: string; rate: number; judged: number } | null = null;
  for (const [field, bucket] of byField) {
    if (bucket.judged < WEAK_FIELD_PROVISIONAL_THRESHOLD) continue;
    const rate = bucket.correct / bucket.judged;
    if (!weakest || rate < weakest.rate) {
      weakest = { field, rate, judged: bucket.judged };
    }
  }
  if (!weakest) return null;
  return { field: weakest.field, stage: getWeakFieldStage(weakest.judged) };
}

export function pickTodaysRecommended(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  limit: number,
): Question[] {
  const reviewIds = getReviewTargetIds(entries);
  const answered = new Set(entries.map((entry) => entry.id));
  const reviewPool = questions.filter((q) => reviewIds.has(q.id));
  const untouchedPool = questions.filter((q) => !answered.has(q.id));

  const stats = getFieldStats(questions, entries);
  const weakFieldOrder = new Map(
    getWeakFields(stats).map((stat, index) => [stat.field, index]),
  );

  const ranked = (pool: readonly Question[]) =>
    [...pool].sort((a, b) => {
      const aRank = weakFieldOrder.get(a.majorCategory) ?? 999;
      const bRank = weakFieldOrder.get(b.majorCategory) ?? 999;
      return aRank - bRank;
    });

  const picked: Question[] = [];
  const seen = new Set<string>();
  for (const q of ranked(reviewPool)) {
    if (picked.length >= limit) break;
    if (seen.has(q.id)) continue;
    picked.push(q);
    seen.add(q.id);
  }
  for (const q of ranked(untouchedPool)) {
    if (picked.length >= limit) break;
    if (seen.has(q.id)) continue;
    picked.push(q);
    seen.add(q.id);
  }
  return picked;
}
