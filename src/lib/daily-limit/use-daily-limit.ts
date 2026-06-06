"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DAILY_LIMIT,
  DAILY_LIMIT_STORAGE_KEY,
  canConsumeQuestion,
  createDailyLimitRecord,
  getDailyLimitForPlan,
  getDailyLimitRemaining,
  getTokyoDateString,
  incrementDailyLimitRecord,
  isDailyLimitReached,
  normalizeDailyLimitRecord,
  parseDailyLimitRecord,
  serializeDailyLimitRecord,
  type DailyLimitRecord,
  type PlanType,
} from ".";
import {
  pushDailyLimitToDatabase,
  syncDailyLimitWithDatabase,
} from "@/lib/study-sync";
import { useDataSync } from "@/lib/study-sync/use-data-sync";
import {
  getAccountStorageKey,
  getAccountStorageUserId,
  isCurrentAccountStorageKey,
} from "@/lib/auth/account-storage";

const DAILY_LIMIT_UPDATED_EVENT = "ortace:daily-limit-updated";

export type DailyLimitState = {
  used: number;
  limit: number;
  remaining: number;
  isLoaded: boolean;
  isLimitReached: boolean;
  consumeQuestion: () => boolean;
};

export function useDailyLimit(plan: PlanType = "free"): DailyLimitState {
  const snapshot = useSyncExternalStore(
    subscribeDailyLimit,
    getDailyLimitSnapshot,
    getDailyLimitServerSnapshot,
  );

  const record = useMemo(
    () => parseDailyLimitRecord(snapshot, getTokyoDateString()),
    [snapshot],
  );

  useEnsureDailyLimitSynced(record, plan);

  const consumeQuestion = useCallback(() => {
    if (plan === "exam") return true;

    const current = readDailyLimitRecord();
    if (!canConsumeQuestion(current, plan)) {
      notifyDailyLimitUpdated();
      return false;
    }

    const next = incrementDailyLimitRecord(current, getTokyoDateString(), plan);
    writeDailyLimitRecord(next);
    notifyDailyLimitUpdated();
    void pushDailyLimitToDatabase(next);
    return true;
  }, [plan]);

  const remaining = getDailyLimitRemaining(record, plan);
  const limit = getDailyLimitForPlan(plan);

  return useMemo(
    () => ({
      used: record.count,
      limit: limit ?? DAILY_LIMIT,
      remaining,
      isLoaded: true,
      isLimitReached: isDailyLimitReached(record, plan),
      consumeQuestion,
    }),
    [consumeQuestion, limit, plan, record, remaining],
  );
}

let fallbackRecord: DailyLimitRecord | null = null;

async function runDailyLimitSync() {
  const current = readDailyLimitRecord();
  const merged = await syncDailyLimitWithDatabase(current);
  if (!merged) return;
  writeDailyLimitRecord(merged);
  notifyDailyLimitUpdated();
}

function useEnsureDailyLimitSynced(_record: DailyLimitRecord, plan: PlanType) {
  // 上限がある無料プラン・基礎定着パスはDB同期対象。
  // key に plan と日付を含めて、日付が変わったら別の同期サイクルとして扱う
  const today = getTokyoDateString();
  const accountUserId = getAccountStorageUserId() ?? "unscoped";
  const shouldSync = plan !== "exam";
  const key = shouldSync
    ? `daily-limit:${accountUserId}:${plan}:${today}`
    : "daily-limit:disabled";
  useDataSync({
    key,
    run: shouldSync ? runDailyLimitSync : async () => {},
  });
}

export function resetDailyLimitForToday() {
  const next = createDailyLimitRecord(getTokyoDateString());
  writeDailyLimitRecord(next);
  notifyDailyLimitUpdated();
  void pushDailyLimitToDatabase(next);
}

function subscribeDailyLimit(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      onStoreChange();
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (isCurrentAccountStorageKey(event.key, DAILY_LIMIT_STORAGE_KEY)) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DAILY_LIMIT_UPDATED_EVENT, onStoreChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const intervalId = window.setInterval(onStoreChange, 60_000);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DAILY_LIMIT_UPDATED_EVENT, onStoreChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.clearInterval(intervalId);
  };
}

function getDailyLimitSnapshot(): string {
  return serializeDailyLimitRecord(readDailyLimitRecord());
}

function getDailyLimitServerSnapshot(): string {
  return serializeDailyLimitRecord(createDailyLimitRecord());
}

function readDailyLimitRecord(): DailyLimitRecord {
  const today = getTokyoDateString();
  if (typeof window === "undefined") {
    return normalizeDailyLimitRecord(fallbackRecord, today);
  }

  try {
    const record = parseDailyLimitRecord(
      window.localStorage.getItem(getAccountStorageKey(DAILY_LIMIT_STORAGE_KEY)),
      today,
    );
    fallbackRecord = record;
    return record;
  } catch {
    return normalizeDailyLimitRecord(fallbackRecord, today);
  }
}

function writeDailyLimitRecord(record: DailyLimitRecord) {
  fallbackRecord = normalizeDailyLimitRecord(record, getTokyoDateString());
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getAccountStorageKey(DAILY_LIMIT_STORAGE_KEY),
      serializeDailyLimitRecord(record),
    );
  } catch {
    // Private mode 等で LocalStorage が使えない場合は、その場の state だけで扱う。
  }
}

function notifyDailyLimitUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DAILY_LIMIT_UPDATED_EVENT));
}
