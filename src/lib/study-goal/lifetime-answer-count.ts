import {
  ANSWER_HISTORY_STORAGE_KEY,
  getUniqueSortedAnswerHistoryEntries,
  parseAnswerHistoryStore,
} from "@/lib/answer-history";
import { getAccountStorageKey } from "@/lib/auth/account-storage";

export const LIFETIME_ANSWER_COUNT_KEY = "ortace.stats.lifetimeAnswerCount";
const MAX_LOCAL_HISTORY_COUNT = 10_000;

/**
 * 生涯累計の解答数。
 * 履歴は表示・同期負荷を抑えるため上限があるので、累計だけは別カウンタで保持する。
 */
export function readLifetimeAnswerCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const storedCount = readStoredLifetimeAnswerCount();
    const historyCount = countLifetimeAnswersFromHistoryRaw(
      window.localStorage.getItem(getAccountStorageKey(ANSWER_HISTORY_STORAGE_KEY)),
    );
    if (
      historyCount > 0 &&
      historyCount < MAX_LOCAL_HISTORY_COUNT &&
      storedCount > historyCount + 1
    ) {
      writeStoredLifetimeAnswerCount(historyCount);
      return historyCount;
    }
    return Math.max(storedCount, historyCount);
  } catch {
    return 0;
  }
}

/** 履歴件数より小さい古いカウンタを見つけたら、履歴件数まで底上げする。 */
export function bootstrapLifetimeFromHistory(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = readLifetimeAnswerCount();
    writeStoredLifetimeAnswerCount(next);
    return next;
  } catch {
    return 0;
  }
}

export function incrementLifetimeAnswerCount(amount: number = 1): number {
  if (typeof window === "undefined") return 0;
  try {
    const current = readLifetimeAnswerCount();
    const next = Math.max(0, current + amount);
    writeStoredLifetimeAnswerCount(next);
    window.dispatchEvent(new Event(LIFETIME_ANSWER_UPDATED_EVENT));
    return next;
  } catch {
    return readLifetimeAnswerCount();
  }
}

export const LIFETIME_ANSWER_UPDATED_EVENT = "ortace:lifetime-answer-updated";

export function countLifetimeAnswersFromHistoryRaw(raw: string | null): number {
  return getUniqueSortedAnswerHistoryEntries(parseAnswerHistoryStore(raw)).length;
}

export function notifyLifetimeAnswerCountUpdated(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = bootstrapLifetimeFromHistory();
    window.dispatchEvent(new Event(LIFETIME_ANSWER_UPDATED_EVENT));
    return next;
  } catch {
    return readLifetimeAnswerCount();
  }
}

function readStoredLifetimeAnswerCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(
    getAccountStorageKey(LIFETIME_ANSWER_COUNT_KEY),
  );
  if (!raw) return 0;
  const count = Number(raw);
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.floor(count);
}

function writeStoredLifetimeAnswerCount(count: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getAccountStorageKey(LIFETIME_ANSWER_COUNT_KEY),
    String(Math.max(0, Math.floor(count))),
  );
}
