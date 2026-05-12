import {
  ANSWER_HISTORY_STORAGE_KEY,
  getSortedAnswerHistoryEntries,
  parseAnswerHistoryStore,
} from "@/lib/answer-history";

export const LIFETIME_ANSWER_COUNT_KEY = "ortace.stats.lifetimeAnswerCount";

/**
 * LocalStorage に保存済みの累計解答数（1問解答のたびに +1）。
 * 履歴500件トリムと無関係に「何回ボタンを押したか」を近似する。
 */
export function readLifetimeAnswerCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LIFETIME_ANSWER_COUNT_KEY);
    if (raw !== null && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return Math.floor(n);
    }
    return bootstrapLifetimeFromHistory();
  } catch {
    return 0;
  }
}

/** 初回またはキー無し時、現存の履歴件数から補う（下限の近似） */
export function bootstrapLifetimeFromHistory(): number {
  if (typeof window === "undefined") return 0;
  try {
    const historyRaw = window.localStorage.getItem(ANSWER_HISTORY_STORAGE_KEY);
    const store = parseAnswerHistoryStore(historyRaw);
    const n = getSortedAnswerHistoryEntries(store).length;
    window.localStorage.setItem(LIFETIME_ANSWER_COUNT_KEY, String(n));
    return n;
  } catch {
    return 0;
  }
}

export const LIFETIME_ANSWER_UPDATED_EVENT = "ortace:lifetime-answer-updated";

export function incrementLifetimeAnswerCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const cur = readLifetimeAnswerCount();
    const next = cur + 1;
    window.localStorage.setItem(LIFETIME_ANSWER_COUNT_KEY, String(next));
    window.dispatchEvent(new Event(LIFETIME_ANSWER_UPDATED_EVENT));
    return next;
  } catch {
    return readLifetimeAnswerCount();
  }
}
