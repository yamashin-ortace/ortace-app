/** 無料プランの1日あたり解答上限 */
export const DAILY_LIMIT = 20;
export const LOW_PLAN_DAILY_LIMIT = 100;
const MAX_TRACKED_DAILY_LIMIT = LOW_PLAN_DAILY_LIMIT;

/** 残り何問から警告表示するか */
export const DAILY_LIMIT_WARNING_REMAINING = 4;

/** ORT ACE の日次制限カウンタ保存キー */
export const DAILY_LIMIT_STORAGE_KEY = "ortace.dailyLimit";

export type PlanType = "free" | "low" | "exam";

export type DailyLimitRecord = {
  /** Asia/Tokyo 基準の YYYY-MM-DD */
  date: string;
  /** 当日に新規解答した問題数 */
  count: number;
};

const TOKYO_TIME_ZONE = "Asia/Tokyo";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Asia/Tokyo 基準で今日の日付を YYYY-MM-DD で返す */
export function getTokyoDateString(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Asia/Tokyo の日付生成に失敗しました");
  }
  return `${year}-${month}-${day}`;
}

export function createDailyLimitRecord(
  date = getTokyoDateString(),
): DailyLimitRecord {
  return { date, count: 0 };
}

/** 保存済み値を当日用の安全な形に整える。日付が違えば0問にリセットする。 */
export function normalizeDailyLimitRecord(
  value: unknown,
  today = getTokyoDateString(),
): DailyLimitRecord {
  if (!isObject(value)) return createDailyLimitRecord(today);

  const date = typeof value.date === "string" ? value.date : "";
  if (!DATE_PATTERN.test(date) || date !== today) {
    return createDailyLimitRecord(today);
  }

  const rawCount =
    typeof value.count === "number"
      ? value.count
      : typeof value.used === "number"
        ? value.used
        : 0;

  return {
    date,
    count: clampCount(rawCount),
  };
}

export function parseDailyLimitRecord(
  raw: string | null,
  today = getTokyoDateString(),
): DailyLimitRecord {
  if (!raw) return createDailyLimitRecord(today);

  try {
    return normalizeDailyLimitRecord(JSON.parse(raw), today);
  } catch {
    return createDailyLimitRecord(today);
  }
}

export function serializeDailyLimitRecord(record: DailyLimitRecord): string {
  return JSON.stringify({ date: record.date, count: clampCount(record.count) });
}

export function getDailyLimitForPlan(plan: PlanType = "free"): number | null {
  if (plan === "exam") return null;
  if (plan === "low") return LOW_PLAN_DAILY_LIMIT;
  return DAILY_LIMIT;
}

export function getDailyLimitRemaining(
  record: DailyLimitRecord,
  plan: PlanType = "free",
): number {
  const limit = getDailyLimitForPlan(plan);
  if (limit === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - clampCount(record.count));
}

export function isDailyLimitReached(
  record: DailyLimitRecord,
  plan: PlanType = "free",
): boolean {
  return getDailyLimitRemaining(record, plan) === 0;
}

export function canConsumeQuestion(
  record: DailyLimitRecord,
  plan: PlanType = "free",
): boolean {
  return !isDailyLimitReached(record, plan);
}

/** 新しく1問解いた扱いにする。上限を超えて増えない。 */
export function incrementDailyLimitRecord(
  record: DailyLimitRecord,
  today = record.date,
  plan: PlanType = "free",
): DailyLimitRecord {
  const normalized = normalizeDailyLimitRecord(record, today);
  const limit = getDailyLimitForPlan(plan) ?? MAX_TRACKED_DAILY_LIMIT;
  return {
    date: normalized.date,
    count: Math.min(limit, normalized.count + 1),
  };
}

function clampCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_TRACKED_DAILY_LIMIT, Math.max(0, Math.floor(value)));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
