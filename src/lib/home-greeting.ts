import {
  FIRST_VISIT_GREETINGS,
  GREETING_POOLS,
  getTimeSlotFromHour,
  toPublicLines,
  type HomeGreetingLines,
  type PooledGreeting,
  type TimeSlot,
} from "./home-greeting-messages";

export { getTimeSlotFromHour };
export type { HomeGreetingLines, TimeSlot } from "./home-greeting-messages";

/** 初回起動（この端末）かどうか。認証の「ログイン」ではない。 */
export const APP_VISITED_KEY = "ortace.appVisited";

function formatDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 日付 + 文脈キー から、プール内インデックスに変換（同一シードは同一結果）
 * @see https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function
 */
export function hashSeedToUint32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 再訪者: 日付＋スロットで 1 通固定（同日内リロードでも同じ） */
export function pickPooledGreeting(now: Date, slot: TimeSlot): PooledGreeting {
  const pool = GREETING_POOLS[slot];
  if (pool.length === 0) {
    throw new Error(`Empty greeting pool: ${slot}`);
  }
  const key = `${formatDateKeyLocal(now)}|${slot}`;
  const idx = hashSeedToUint32(key) % pool.length;
  return pool[idx]!;
}

/** 初回: 日付でプール内から 1 通（同日は固定） */
export function pickFirstVisitGreeting(now: Date): PooledGreeting {
  const pool = FIRST_VISIT_GREETINGS;
  if (pool.length === 0) {
    throw new Error("Empty first-visit pool");
  }
  const key = `${formatDateKeyLocal(now)}|first`;
  const idx = hashSeedToUint32(key) % pool.length;
  return pool[idx]!;
}

/**
 * 端末内の初回起動 / 再訪 / 時刻帯＋日付シードに応じたトップ文言。
 * ユーザーの氏名・ログイン状態は未実装のため、ローカル保存のみ使用する。
 */
export function getHomeGreetingLines(now: Date, hasVisitedBefore: boolean): HomeGreetingLines {
  if (!hasVisitedBefore) {
    return toPublicLines(pickFirstVisitGreeting(now));
  }

  const slot = getTimeSlotFromHour(now.getHours());
  return toPublicLines(pickPooledGreeting(now, slot));
}

/** テスト用: 与えた `Date` のローカル日付キー */
export function getDateKeyForTests(d: Date): string {
  return formatDateKeyLocal(d);
}
