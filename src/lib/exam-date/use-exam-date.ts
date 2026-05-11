"use client";

import { useSyncExternalStore } from "react";
import {
  EXAM_DATE_STORAGE_KEY,
  getDefaultExamDate,
  isValidExamDateString,
} from ".";

const STORAGE_EVENT = "ortace.examDate.changed";

type ExamDateSnapshot = {
  /** ユーザーが明示的に設定した値。未設定なら null */
  customDate: string | null;
  /** 既定値 + customDate を解決した最終的な値 */
  effectiveDate: string;
  /** ユーザーが明示的に設定済みか */
  isCustom: boolean;
};

function readSnapshot(): ExamDateSnapshot {
  if (typeof window === "undefined") {
    const fallback = getDefaultExamDate();
    return { customDate: null, effectiveDate: fallback, isCustom: false };
  }
  const raw = window.localStorage.getItem(EXAM_DATE_STORAGE_KEY);
  if (isValidExamDateString(raw)) {
    return { customDate: raw, effectiveDate: raw, isCustom: true };
  }
  return {
    customDate: null,
    effectiveDate: getDefaultExamDate(),
    isCustom: false,
  };
}

let cachedSnapshot: ExamDateSnapshot = readSnapshot();

function notifyChange() {
  cachedSnapshot = readSnapshot();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === EXAM_DATE_STORAGE_KEY) {
      cachedSnapshot = readSnapshot();
      listener();
    }
  };
  const handleInternal = () => {
    cachedSnapshot = readSnapshot();
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, handleInternal);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, handleInternal);
  };
}

function getSnapshot(): ExamDateSnapshot {
  return cachedSnapshot;
}

function getServerSnapshot(): ExamDateSnapshot {
  return { customDate: null, effectiveDate: getDefaultExamDate(), isCustom: false };
}

export function useExamDate() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setExamDate = (value: string | null) => {
    if (typeof window === "undefined") return;
    if (value === null) {
      window.localStorage.removeItem(EXAM_DATE_STORAGE_KEY);
    } else if (isValidExamDateString(value)) {
      window.localStorage.setItem(EXAM_DATE_STORAGE_KEY, value);
    } else {
      return;
    }
    notifyChange();
  };

  return {
    examDate: snapshot.effectiveDate,
    isCustom: snapshot.isCustom,
    setExamDate,
  };
}
