"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_STUDY_GOAL,
  STUDY_GOAL_STORAGE_KEY,
  parseStudyGoalConfig,
  serializeStudyGoalConfig,
  type StudyGoalConfig,
} from ".";

const CHANGE_EVENT = "ortace.studyGoal.changed";

function readConfig(): StudyGoalConfig {
  if (typeof window === "undefined") return DEFAULT_STUDY_GOAL;
  return parseStudyGoalConfig(
    window.localStorage.getItem(STUDY_GOAL_STORAGE_KEY),
  );
}

let cached: StudyGoalConfig = readConfig();

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STUDY_GOAL_STORAGE_KEY) return;
    cached = readConfig();
    listener();
  };
  const handle = () => {
    cached = readConfig();
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
    () => cached,
    () => DEFAULT_STUDY_GOAL,
  );

  const setConfig = useCallback((next: StudyGoalConfig) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STUDY_GOAL_STORAGE_KEY,
      serializeStudyGoalConfig(next),
    );
    cached = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<StudyGoalConfig>) => {
      setConfig({ ...cached, ...patch });
    },
    [setConfig],
  );

  return { config, setConfig, updateConfig };
}
