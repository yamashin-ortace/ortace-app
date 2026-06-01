"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  WEAK_PRACTICE_STATE_STORAGE_KEY,
  WEAK_PRACTICE_STATE_UPDATED_EVENT,
  createWeakPracticeState,
  parseWeakPracticeState,
  recordWeakPracticeSession,
  serializeWeakPracticeState,
} from "./practice-state";

export function useWeakPracticeState() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const state = useMemo(() => parseWeakPracticeState(snapshot), [snapshot]);
  const recordSession = useCallback(
    (params: {
      categoryKey: string;
      questionIds: readonly string[];
      correctCount: number;
    }) => {
      writeState(recordWeakPracticeSession(readState(), params));
      notifyUpdated();
    },
    [],
  );

  return { state, recordSession };
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(WEAK_PRACTICE_STATE_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(WEAK_PRACTICE_STATE_UPDATED_EVENT, onStoreChange);
  };
}

function getSnapshot(): string {
  return serializeWeakPracticeState(readState());
}

function getServerSnapshot(): string {
  return serializeWeakPracticeState(createWeakPracticeState());
}

function readState() {
  if (typeof window === "undefined") return createWeakPracticeState();
  try {
    return parseWeakPracticeState(
      window.localStorage.getItem(WEAK_PRACTICE_STATE_STORAGE_KEY),
    );
  } catch {
    return createWeakPracticeState();
  }
}

function writeState(state: ReturnType<typeof readState>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      WEAK_PRACTICE_STATE_STORAGE_KEY,
      serializeWeakPracticeState(state),
    );
  } catch {
    // LocalStorage が使えない環境では、次回表示時に履歴だけから再判定する。
  }
}

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WEAK_PRACTICE_STATE_UPDATED_EVENT));
}
