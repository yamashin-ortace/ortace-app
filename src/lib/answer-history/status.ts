import type { Question, Field } from "@/lib/questions";
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
 * 間隔反復スケジュール（`nextReviewAt`）が設定されている問題はその日付以前のみ、
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
): Question[] {
  const targets = getReviewTargetIds(entries);
  return questions.filter((question) => targets.has(question.id));
}

export type FieldStat = {
  field: string;
  total: number;
  answered: number;
  remaining: number;
  /** 正誤判定済みの解答数（同じ問題は最新のみ集計） */
  judged: number;
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

export type EstimatedScore = {
  /** 150点満点換算の推定スコア（小数点を四捨五入） */
  score: number;
  /** 0〜100 のカバー率（推定に使えた分野の出題数 / 合計出題数） */
  coverage: number;
  /** 5問未満などでスコア化できなかった分野名 */
  insufficientFields: Field[];
  /** 合格圏ライン（点） */
  passLineScore: number;
  /** 満点 */
  maxScore: number;
};

/**
 * 分野別の最新正答率を、本試験の分野別出題数で加重平均して
 * 150点満点の推定スコアに換算する。
 *
 * - 解答数が `MIN_FIELD_JUDGED_FOR_SCORE` 未満の分野はカウントしない（仮値で埋めない）。
 * - 対象外になった分野はカバー率としてユーザーに表示し、データ充実を促す。
 */
export function calculateEstimatedScore(
  fieldStats: readonly FieldStat[],
  passLineScore: number = DEFAULT_PASS_LINE_SCORE,
): EstimatedScore {
  let score = 0;
  let coveredDistribution = 0;
  const insufficientFields: Field[] = [];

  for (const stat of fieldStats) {
    const field = stat.field as Field;
    const dist = EXAM_FIELD_DISTRIBUTION[field] ?? 0;
    if (dist === 0) continue;
    if (stat.judged < MIN_FIELD_JUDGED_FOR_SCORE || stat.accuracyRate === null) {
      insufficientFields.push(field);
      continue;
    }
    score += (stat.accuracyRate / 100) * dist;
    coveredDistribution += dist;
  }

  const totalDistribution = EXAM_FIELD_DISTRIBUTION_TOTAL || 1;
  return {
    score: Math.round(score),
    coverage: Math.round((coveredDistribution / totalDistribution) * 100),
    insufficientFields,
    passLineScore,
    maxScore: MAX_EXAM_SCORE,
  };
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
