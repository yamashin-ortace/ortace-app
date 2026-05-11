/**
 * 問題ごとの挑戦履歴ヘルパー
 *
 * - 同じ問題の過去解答を集約して、UI で扱いやすい形に整える。
 * - 解答前は `Try #N` バッジ、解答後は直近5件のリストとして利用する。
 */

import type { AnswerHistoryEntry } from ".";

export const ATTEMPT_HISTORY_RECENT_LIMIT = 5;
export const ATTEMPT_HISTORY_CONSECUTIVE_CORRECT_LIMIT = 3;

export type AttemptHistory = {
  /** これまで（最新の解答も含む）何回回答したか */
  totalAttempts: number;
  /** 新しい順に並べた直近の解答 */
  recent: AnswerHistoryEntry[];
  /** 表示用に切り詰められていない、全件（新しい順） */
  all: AnswerHistoryEntry[];
  /** 「同じ選択肢で2回以上ミス」の発生 */
  repeatedMistake: {
    /** 同じ選択肢の組み合わせ（"3" や "1+2" など） */
    choiceKey: string;
    count: number;
  } | null;
  /** 直近5件がすべて不正解か */
  recentAllIncorrect: boolean;
  /** 直近3件がすべて正解か */
  recentAllCorrect: boolean;
};

export function getAttemptHistory(
  entries: readonly AnswerHistoryEntry[],
  questionId: string,
  recentLimit: number = ATTEMPT_HISTORY_RECENT_LIMIT,
): AttemptHistory {
  const all = entries
    .filter((entry) => entry.id === questionId)
    .slice()
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt));

  const recent = all.slice(0, recentLimit);

  const mistakeCounts = new Map<string, number>();
  for (const entry of all) {
    if (entry.result !== "incorrect") continue;
    if (entry.selectedAnswers.length === 0) continue;
    const key = entry.selectedAnswers.join("+");
    mistakeCounts.set(key, (mistakeCounts.get(key) ?? 0) + 1);
  }
  let repeatedMistake: AttemptHistory["repeatedMistake"] = null;
  for (const [choiceKey, count] of mistakeCounts) {
    if (count >= 2 && (!repeatedMistake || count > repeatedMistake.count)) {
      repeatedMistake = { choiceKey, count };
    }
  }

  const recentAllIncorrect =
    recent.length === recentLimit &&
    recent.every((entry) => entry.result === "incorrect");

  const headForConsecutive = all.slice(0, ATTEMPT_HISTORY_CONSECUTIVE_CORRECT_LIMIT);
  const recentAllCorrect =
    headForConsecutive.length === ATTEMPT_HISTORY_CONSECUTIVE_CORRECT_LIMIT &&
    headForConsecutive.every((entry) => entry.result === "correct");

  return {
    totalAttempts: all.length,
    recent,
    all,
    repeatedMistake,
    recentAllIncorrect,
    recentAllCorrect,
  };
}
