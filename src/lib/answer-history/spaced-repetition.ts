/**
 * 復習キューの最小スケジューリング。
 *
 * - 正解だけでは復習対象に積まない。自信度が後から付いた場合だけ必要に応じて調整する。
 * - 誤答の場合は streak=0 にリセットし、少し間を空けて復習対象として戻ってくる。
 */

import type { AnswerJudgement } from "@/lib/quiz";

/** 卒業基準：これ以上は復習対象に出さない */
export const STREAK_GRADUATION = 4;

/** 誤答後、復習対象に戻すまでの間隔（日） */
export const INCORRECT_REVIEW_DELAY_DAYS = 2;

/**
 * 与えられた解答結果から、新しい streak と次回復習日（"YYYY-MM-DD"）を返す。
 *
 * - 不正解: streak=0、2日後に復習
 * - 正解: streak=prevStreak+1、復習対象には積まない
 * - 公式正答なし（no_answer）: streak=0、復習対象にはしない
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
  if (result === "no_answer") {
    return { streak: 0, nextReviewAt: null };
  }
  if (result === "incorrect") {
    return {
      streak: 0,
      nextReviewAt: formatLocalDate(addDays(now, INCORRECT_REVIEW_DELAY_DAYS)),
    };
  }
  const streak = previousStreak + 1;
  return { streak, nextReviewAt: null };
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
  if (entry.result === "no_answer") return false;
  // 旧データには nextReviewAt が無いので、従来挙動を維持
  return entry.result === "incorrect";
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
