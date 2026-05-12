/**
 * 受験生が設定する「過去問の周回」目標と、試験日までのペース計算。
 * 総解答数カウンターは `lifetime-answer-count` と連動。
 */

export const STUDY_GOAL_STORAGE_KEY = "ortace.studyGoal.rounds";

export const STUDY_GOAL_ROUNDS_MIN = 1;
export const STUDY_GOAL_ROUNDS_MAX = 5;
/** 既定の周回（設定未保存や破損時） */
export const STUDY_GOAL_ROUNDS_DEFAULT = 2;

export function clampRoundsTarget(value: number): number {
  if (!Number.isFinite(value))
    return STUDY_GOAL_ROUNDS_DEFAULT;
  return Math.min(
    STUDY_GOAL_ROUNDS_MAX,
    Math.max(STUDY_GOAL_ROUNDS_MIN, Math.round(value)),
  );
}

export function parseRoundsTarget(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw);
  return clampRoundsTarget(n);
}

/** 試験日までに目標総解答まで埋めるときの「1日あたり」（切り上げ、上限キャップあり） */
export function getAnswersPaceTowardGoal(
  totalTargetAnswers: number,
  answeredSoFar: number,
  daysRemaining: number,
  dailyCap = 80,
): number | null {
  if (daysRemaining <= 0) return null;
  const remaining = Math.max(0, totalTargetAnswers - answeredSoFar);
  if (remaining <= 0) return null;
  const raw = Math.ceil(remaining / daysRemaining);
  return Math.min(dailyCap, Math.max(1, raw));
}
