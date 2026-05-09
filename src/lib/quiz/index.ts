/**
 * クイズ実行のヘルパー関数群
 */
import type { ChoiceKey, Question } from "@/lib/questions";

/** ユーザーが選ぶべき選択肢の数を判定 */
export function getExpectedSelectionCount(q: Question): number {
  if (q.format === "1択") return 1;
  if (q.format === "2択") return 2;
  // 組み合わせは通常1つ。「2つ選べ」と指示する例外は correctAnswers の長さで判定
  if (q.format === "組み合わせ") {
    return q.correctAnswers.length === 2 ? 2 : 1;
  }
  return 1;
}

export type AnswerJudgement = "correct" | "incorrect" | "no_answer";

/**
 * 選択肢の集合を採点する
 *
 * - 通常：選んだセットと正答セットが完全一致なら正解
 * - 出題ミス（1択で正答が複数）：選んだ1つが正答リストに含まれていれば正解
 * - 正答未確定：判定不能 ("no_answer")
 */
export function judgeAnswer(
  q: Question,
  selected: ChoiceKey[],
): AnswerJudgement {
  if (q.correctAnswers.length === 0) return "no_answer";

  // 出題ミス：1択なのに正答が複数 → 1つ選んでそれが正答に含まれれば正解
  if (q.format === "1択" && q.correctAnswers.length > 1) {
    if (selected.length === 1 && q.correctAnswers.includes(selected[0])) {
      return "correct";
    }
    return "incorrect";
  }

  // 通常：完全一致
  if (selected.length !== q.correctAnswers.length) return "incorrect";
  const correctSet = new Set(q.correctAnswers);
  for (const s of selected) {
    if (!correctSet.has(s)) return "incorrect";
  }
  return "correct";
}

/** Fisher-Yates シャッフル */
export function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
