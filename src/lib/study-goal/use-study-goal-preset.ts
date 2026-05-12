"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  STUDY_GOAL_DEFAULT_ID,
  STUDY_GOAL_STORAGE_KEY,
  getStudyGoalPreset,
  isStudyGoalPresetId,
  type StudyGoalPresetId,
} from ".";

const CHANGE_EVENT = "ortace.studyGoal.changed";

function readPresetId(): StudyGoalPresetId {
  if (typeof window === "undefined") return STUDY_GOAL_DEFAULT_ID;
  const raw = window.localStorage.getItem(STUDY_GOAL_STORAGE_KEY);
  return isStudyGoalPresetId(raw) ? raw : STUDY_GOAL_DEFAULT_ID;
}

let cached: StudyGoalPresetId = readPresetId();

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STUDY_GOAL_STORAGE_KEY) return;
    cached = readPresetId();
    listener();
  };
  const handle = () => {
    cached = readPresetId();
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
 * 学習プリセット（B案：none / base / safe / top）を読み書きするフック。
 * SSR では既定値（none）。マウント後に localStorage の値に同期する。
 */
export function useStudyGoalPreset() {
  const presetId = useSyncExternalStore(
    subscribe,
    () => cached,
    () => STUDY_GOAL_DEFAULT_ID,
  );

  const setPresetId = useCallback((next: StudyGoalPresetId) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STUDY_GOAL_STORAGE_KEY, next);
    cached = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    presetId,
    preset: getStudyGoalPreset(presetId),
    setPresetId,
  };
}
