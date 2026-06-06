/**
 * 初回診断パッケージ（27問・任意）
 *
 * - 9分野 × 3問 = 27問。
 * - 開始/完了/スキップの明示状態は端末ローカル（localStorage）に保存する。
 * - 別端末で解いた場合は同期済み解答履歴から診断相当の完了状態を推定する。
 * - QuizPlayer の `bypassDailyLimit` で初日のキャップを実質拡張する。
 */

import type { Question } from "@/lib/questions";
import { FIELDS } from "@/lib/questions";
import { shuffle } from "@/lib/quiz";
import type { AnswerHistoryEntry } from "@/lib/answer-history";

export const DIAGNOSTIC_STATUS_KEY = "ortace.diagnostic.status";
export const DIAGNOSTIC_QUESTIONS_PER_FIELD = 3;
export const DIAGNOSTIC_QUESTION_COUNT =
  FIELDS.length * DIAGNOSTIC_QUESTIONS_PER_FIELD;

export type DiagnosticStatus = "started" | "completed" | "skipped" | null;

/** `completed` のときだけホームから診断リマインダーを消す */
export function isDiagnosticComplete(status: DiagnosticStatus): boolean {
  return status === "completed";
}

export function isDiagnosticStatus(value: unknown): value is DiagnosticStatus {
  return (
    value === "started" ||
    value === "completed" ||
    value === "skipped" ||
    value === null
  );
}

/**
 * 別端末で診断を終えた場合でも、同期済みの解答履歴から診断相当のデータ量を推定する。
 * 診断は9分野×3問なので、各分野に3問以上の判定済み履歴があればホーム案内は不要。
 */
export function hasDiagnosticBaseline(
  entries: readonly AnswerHistoryEntry[],
): boolean {
  const judgedByField = new Map<string, number>();
  for (const entry of entries) {
    if (entry.result !== "correct" && entry.result !== "incorrect") continue;
    judgedByField.set(
      entry.majorCategory,
      (judgedByField.get(entry.majorCategory) ?? 0) + 1,
    );
  }
  return FIELDS.every(
    (field) => (judgedByField.get(field) ?? 0) >= DIAGNOSTIC_QUESTIONS_PER_FIELD,
  );
}

export function shouldBypassInitialDiagnosticDailyLimit(
  status: DiagnosticStatus,
  entries: readonly AnswerHistoryEntry[],
): boolean {
  return status !== "completed" && !hasDiagnosticBaseline(entries);
}

/**
 * 全問題から「各分野3問ずつ」をランダム抽出。
 * 同じ問題が混じらないよう問題IDで重複排除する。
 * 公式正答が未確定の問題（correctAnswers が空）は判定できないので候補から外す。
 */
export function selectDiagnosticQuestions(
  questions: readonly Question[],
): Question[] {
  const eligible = questions.filter((q) => q.correctAnswers.length > 0);
  const picked: Question[] = [];
  const seen = new Set<string>();
  for (const field of FIELDS) {
    const inField = eligible.filter((q) => q.majorCategory === field);
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
