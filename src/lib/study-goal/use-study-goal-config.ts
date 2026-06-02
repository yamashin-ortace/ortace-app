"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_STUDY_GOAL,
  STUDY_GOAL_STORAGE_KEY,
  parseStudyGoalConfig,
  serializeStudyGoalConfig,
  type StudyGoalConfig,
} from ".";
import {
  pushStudyGoalConfigToDatabase,
  syncStudyGoalConfigWithDatabase,
  type StudyGoalConfigRecord,
} from "@/lib/study-sync";
import { useDataSync } from "@/lib/study-sync/use-data-sync";
import {
  getAccountStorageKey,
  isCurrentAccountStorageKey,
} from "@/lib/auth/account-storage";

const CHANGE_EVENT = "ortace.studyGoal.changed";
const UPDATED_AT_KEY = "updatedAt";

function readConfigRecord(): StudyGoalConfigRecord {
  if (typeof window === "undefined") {
    return { config: DEFAULT_STUDY_GOAL, updatedAt: null };
  }
  const raw = window.localStorage.getItem(
    getAccountStorageKey(STUDY_GOAL_STORAGE_KEY),
  );
  return {
    config: parseStudyGoalConfig(raw),
    updatedAt: readUpdatedAt(raw),
  };
}

let cachedRecord: StudyGoalConfigRecord = readConfigRecord();

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (!isCurrentAccountStorageKey(event.key, STUDY_GOAL_STORAGE_KEY)) return;
    cachedRecord = readConfigRecord();
    listener();
  };
  const handle = () => {
    cachedRecord = readConfigRecord();
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, handle);
  };
}

/**
 * 学習プリセットの設定（B-prime：ガードレール付き自由設定）を読み書きするフック。
 * SSR では既定値を返し、マウント後に localStorage の値に同期する。
 */
export function useStudyGoalConfig() {
  const config = useSyncExternalStore(
    subscribe,
    () => cachedRecord.config,
    () => DEFAULT_STUDY_GOAL,
  );

  useDataSync({ key: "study-goal", run: runStudyGoalConfigSync });

  const setConfig = useCallback((next: StudyGoalConfig) => {
    if (typeof window === "undefined") return;
    const record = writeStudyGoalConfig(next, new Date().toISOString());
    window.dispatchEvent(new Event(CHANGE_EVENT));
    void pushStudyGoalConfigToDatabase(record);
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<StudyGoalConfig>) => {
      setConfig({ ...cachedRecord.config, ...patch });
    },
    [setConfig],
  );

  return { config, setConfig, updateConfig };
}

async function runStudyGoalConfigSync() {
  const merged = await syncStudyGoalConfigWithDatabase(readConfigRecord());
  if (!merged) return;
  writeStudyGoalConfig(merged.config, merged.updatedAt);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function writeStudyGoalConfig(
  config: StudyGoalConfig,
  updatedAt: string | null,
): StudyGoalConfigRecord {
  const record = { config, updatedAt };
  cachedRecord = record;
  if (typeof window === "undefined") return record;

  window.localStorage.setItem(
    getAccountStorageKey(STUDY_GOAL_STORAGE_KEY),
    JSON.stringify({
      ...JSON.parse(serializeStudyGoalConfig(config)),
      ...(updatedAt ? { [UPDATED_AT_KEY]: updatedAt } : {}),
    }),
  );
  return record;
}

function readUpdatedAt(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const value = (parsed as Record<string, unknown>)[UPDATED_AT_KEY];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
