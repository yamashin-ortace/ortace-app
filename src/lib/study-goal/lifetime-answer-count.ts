import {
  ANSWER_HISTORY_STORAGE_KEY,
  getUniqueSortedAnswerHistoryEntries,
  parseAnswerHistoryStore,
} from "@/lib/answer-history";

export const LIFETIME_ANSWER_COUNT_KEY = "ortace.stats.lifetimeAnswerCount";

/**
 * 同期済みの解答履歴から導出する累計解答数。
 * 旧 localStorage カウンタは端末ごとに分岐するため、表示値としては使わない。
 */
export function readLifetimeAnswerCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const count = countLifetimeAnswersFromHistoryRaw(
      window.localStorage.getItem(ANSWER_HISTORY_STORAGE_KEY),
    );
    return count;
  } catch {
    return 0;
  }
}

/** 旧呼び出し互換。現在は常に同期済み履歴件数を返す。 */
export function bootstrapLifetimeFromHistory(): number {
  if (typeof window === "undefined") return 0;
  try {
    return countLifetimeAnswersFromHistoryRaw(
      window.localStorage.getItem(ANSWER_HISTORY_STORAGE_KEY),
    );
  } catch {
    return 0;
  }
}

export const LIFETIME_ANSWER_UPDATED_EVENT = "ortace:lifetime-answer-updated";

export function countLifetimeAnswersFromHistoryRaw(raw: string | null): number {
  return getUniqueSortedAnswerHistoryEntries(parseAnswerHistoryStore(raw)).length;
}

export function notifyLifetimeAnswerCountUpdated(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = readLifetimeAnswerCount();
    window.dispatchEvent(new Event(LIFETIME_ANSWER_UPDATED_EVENT));
    return next;
  } catch {
    return readLifetimeAnswerCount();
  }
}

/** @deprecated 累計数は answer_history から導出する。更新通知用途のみ残す。 */
export const incrementLifetimeAnswerCount = notifyLifetimeAnswerCountUpdated;
