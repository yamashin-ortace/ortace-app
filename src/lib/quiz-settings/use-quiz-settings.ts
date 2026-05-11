"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_QUIZ_SETTINGS,
  QUIZ_SETTINGS_STORAGE_KEY,
  parseQuizSettings,
  serializeQuizSettings,
  type QuizSettings,
} from ".";

const CHANGE_EVENT = "ortace.quizSettings.changed";

function readSettings(): QuizSettings {
  if (typeof window === "undefined") return DEFAULT_QUIZ_SETTINGS;
  return parseQuizSettings(
    window.localStorage.getItem(QUIZ_SETTINGS_STORAGE_KEY),
  );
}

let cached: QuizSettings = readSettings();
let cachedJson: string = serializeQuizSettings(cached);

function getSnapshot(): string {
  return cachedJson;
}

function getServerSnapshot(): string {
  return serializeQuizSettings(DEFAULT_QUIZ_SETTINGS);
}

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handle = (event: StorageEvent | Event) => {
    if (event instanceof StorageEvent && event.key !== QUIZ_SETTINGS_STORAGE_KEY) {
      return;
    }
    cached = readSettings();
    cachedJson = serializeQuizSettings(cached);
    listener();
  };
  window.addEventListener("storage", handle);
  window.addEventListener(CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(CHANGE_EVENT, handle);
  };
}

export function useQuizSettings(): QuizSettings & {
  setShowAttemptCountBeforeAnswer: (value: boolean) => void;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = parseQuizSettings(snapshot);

  const setShowAttemptCountBeforeAnswer = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    const next: QuizSettings = { ...readSettings(), showAttemptCountBeforeAnswer: value };
    window.localStorage.setItem(
      QUIZ_SETTINGS_STORAGE_KEY,
      serializeQuizSettings(next),
    );
    cached = next;
    cachedJson = serializeQuizSettings(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    ...settings,
    setShowAttemptCountBeforeAnswer,
  };
}
