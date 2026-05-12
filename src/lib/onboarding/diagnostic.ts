/**
 * 初回診断パッケージ（27問・任意）
 *
 * - 9分野 × 3問 = 27問。
 * - 端末ローカル（localStorage）に状態を保存する MVP 実装。
 *   Supabase 連携は後続フェーズで検討。
 * - QuizPlayer の `bypassDailyLimit` で初日のキャップを実質拡張する。
 */

import type { Question } from "@/lib/questions";
import { FIELDS } from "@/lib/questions";
import { shuffle } from "@/lib/quiz";

export const DIAGNOSTIC_STATUS_KEY = "ortace.diagnostic.status";
export const DIAGNOSTIC_QUESTIONS_PER_FIELD = 3;
export const DIAGNOSTIC_QUESTION_COUNT =
  FIELDS.length * DIAGNOSTIC_QUESTIONS_PER_FIELD;

export type DiagnosticStatus = "completed" | "skipped" | null;

/** `completed` のときだけホームから診断リマインダーを消す */
export function isDiagnosticComplete(status: DiagnosticStatus): boolean {
  return status === "completed";
}

export function isDiagnosticStatus(value: unknown): value is DiagnosticStatus {
  return value === "completed" || value === "skipped" || value === null;
}

/**
 * 全問題から「各分野3問ずつ」をランダム抽出。
 * 同じ問題が混じらないよう問題IDで重複排除する。
 */
export function selectDiagnosticQuestions(
  questions: readonly Question[],
): Question[] {
  const picked: Question[] = [];
  const seen = new Set<string>();
  for (const field of FIELDS) {
    const inField = questions.filter((q) => q.majorCategory === field);
    const shuffled = shuffle(inField);
    let added = 0;
    for (const q of shuffled) {
      if (seen.has(q.id)) continue;
      picked.push(q);
      seen.add(q.id);
      added += 1;
      if (added >= DIAGNOSTIC_QUESTIONS_PER_FIELD) break;
    }
  }
  // 全分野からの問題をシャッフルして、出題順が分野ごとに固まらないようにする
  return shuffle(picked);
}
