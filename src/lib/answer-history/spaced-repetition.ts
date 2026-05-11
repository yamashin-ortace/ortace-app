/**
 * 間隔反復（Spaced Repetition）の最小実装
 *
 * - 連続正解数（streak）に応じて、次回の復習日を 1 / 3 / 7 / 21 / 60 日後にスケジュール。
 * - 連続正解 5 回以上で「卒業」とみなし、復習対象から外す。
 * - 誤答の場合は streak=0 にリセットし、翌日に復習対象として戻ってくる。
 */

import type { AnswerJudgement } from "@/lib/quiz";

/** 卒業基準：これ以上は復習対象に出さない */
export const STREAK_GRADUATION = 5;

/** 連続正解 N 回後の次回復習までの間隔（日） */
const INTERVALS_BY_STREAK: Record<number, number> = {
  1: 3,
  2: 7,
  3: 21,
  4: 60,
};

/**
 * 与えられた解答結果から、新しい streak と次回復習日（"YYYY-MM-DD"）を返す。
 *
 * - 不正解: streak=0、翌日復習
 * - 正解: streak=prevStreak+1、interval は INTERVALS_BY_STREAK に従う
 * - 出題ミス（no_answer）: streak=0、翌日復習（リトライ可能性のため）
 * - streak が GRADUATION に達したら nextReviewAt=null（卒業）
 */
export function computeSpacedRepetition({
  result,
  previousStreak,
  now,
}: {
  result: AnswerJudgement;
  previousStreak: number;
  now: Date;
}): { streak: number; nextReviewAt: string | null } {
  if (result === "incorrect" || result === "no_answer") {
    return { streak: 0, nextReviewAt: formatLocalDate(addDays(now, 1)) };
  }
  const streak = previousStreak + 1;
  if (streak >= STREAK_GRADUATION) {
    return { streak, nextReviewAt: null };
  }
  const intervalDays = INTERVALS_BY_STREAK[streak] ?? 1;
  return { streak, nextReviewAt: formatLocalDate(addDays(now, intervalDays)) };
}

/** 「直近のエントリ」だけ見て、今日復習対象かどうかを判定する */
export function isDueForReview(
  entry: {
    result: AnswerJudgement;
    streak?: number;
    nextReviewAt?: string | null;
  },
  todayLocalDate: string,
): boolean {
  if (
    typeof entry.streak === "number" &&
    entry.streak >= STREAK_GRADUATION
  ) {
    return false;
  }
  if (entry.nextReviewAt) {
    return entry.nextReviewAt <= todayLocalDate;
  }
  // 旧データには nextReviewAt が無いので、従来挙動を維持
  return entry.result === "incorrect" || entry.result === "no_answer";
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Date → ローカル日付 "YYYY-MM-DD" */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
