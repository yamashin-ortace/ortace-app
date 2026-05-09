"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
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
    if (plan === "free") {
      void pushDailyLimitToDatabase(next);
    }
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
const syncedDailyLimitDates = new Set<string>();

function useEnsureDailyLimitSynced(record: DailyLimitRecord, plan: PlanType) {
  useEffect(() => {
    if (plan !== "free") return;
    if (syncedDailyLimitDates.has(record.date)) return;

    syncedDailyLimitDates.add(record.date);
    let cancelled = false;

    void syncDailyLimitWithDatabase(record).then((merged) => {
      if (cancelled || !merged) return;
      writeDailyLimitRecord(merged);
      notifyDailyLimitUpdated();
    });

    return () => {
      cancelled = true;
    };
  }, [plan, record]);
}

function subscribeDailyLimit(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DAILY_LIMIT_UPDATED_EVENT, onStoreChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const intervalId = window.setInterval(onStoreChange, 60_000);

  return () => {
    window.removeEventListener("storage", onStoreChange);
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
      window.localStorage.getItem(DAILY_LIMIT_STORAGE_KEY),
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
      DAILY_LIMIT_STORAGE_KEY,
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
