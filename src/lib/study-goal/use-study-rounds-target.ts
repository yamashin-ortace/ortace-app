"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  STUDY_GOAL_ROUNDS_DEFAULT,
  STUDY_GOAL_STORAGE_KEY,
  clampRoundsTarget,
  parseRoundsTarget,
} from ".";

const CHANGE_EVENT = "ortace.studyGoal.changed";

function readRounds(): number {
  if (typeof window === "undefined") return STUDY_GOAL_ROUNDS_DEFAULT;
  return parseRoundsTarget(window.localStorage.getItem(STUDY_GOAL_STORAGE_KEY));
}

let cached = readRounds();

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      event.key !== null &&
      event.key !== STUDY_GOAL_STORAGE_KEY
    ) {
      return;
    }
    cached = readRounds();
    listener();
  };
  const handle = () => {
    cached = readRounds();
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, handle);
  };
}

export function useStudyRoundsTarget() {
  const rounds = useSyncExternalStore(subscribe, () => cached, () => STUDY_GOAL_ROUNDS_DEFAULT);

  const setRoundsTarget = useCallback((next: number) => {
    if (typeof window === "undefined") return;
    const v = clampRoundsTarget(next);
    window.localStorage.setItem(STUDY_GOAL_STORAGE_KEY, String(v));
    cached = v;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { roundsTarget: rounds, setRoundsTarget };
}
