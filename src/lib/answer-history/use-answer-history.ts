"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AnswerJudgement } from "@/lib/quiz";
import type { ChoiceKey, Question } from "@/lib/questions";
import {
  ANSWER_HISTORY_STORAGE_KEY,
  createAnswerHistoryStore,
  getSortedAnswerHistoryEntries,
  parseAnswerHistoryStore,
  recordAnswerHistory,
  serializeAnswerHistoryStore,
  updateAnswerConfidence,
  type AnswerHistoryStore,
  type ConfidenceLevel,
} from ".";
import {
  pushAnswerHistoryEntryToDatabase,
  syncAnswerHistoryWithDatabase,
} from "@/lib/study-sync";
import { useDataSync } from "@/lib/study-sync/use-data-sync";
import { incrementLifetimeAnswerCount } from "@/lib/study-goal/lifetime-answer-count";

const ANSWER_HISTORY_UPDATED_EVENT = "ortace:answer-history-updated";

export function useAnswerHistory() {
  useEnsureAnswerHistorySynced();
  const recordAnswer = useCallback(
    (params: {
      question: Question;
      result: AnswerJudgement;
      selectedAnswers: readonly ChoiceKey[];
      confidence?: ConfidenceLevel | null;
    }) => {
      const now = new Date();
      const next = recordAnswerHistory(readAnswerHistoryStore(), {
        ...params,
        now,
      });
      writeAnswerHistoryStore(next);
      notifyAnswerHistoryUpdated();
      incrementLifetimeAnswerCount();
      const recorded = next.entries.find(
        (entry) =>
          entry.id === params.question.id &&
          entry.answeredAt === now.toISOString(),
      );
      if (recorded) {
        void pushAnswerHistoryEntryToDatabase(recorded);
      }
    },
    [],
  );

  const setConfidence = useCallback(
    (params: {
      questionId: string;
      answeredAt?: string;
      confidence: ConfidenceLevel | null;
    }) => {
      const current = readAnswerHistoryStore();
      const next = updateAnswerConfidence(current, params);
      if (next === current) return;
      writeAnswerHistoryStore(next);
      notifyAnswerHistoryUpdated();
    },
    [],
  );

  return { recordAnswer, setConfidence };
}

export function useAnswerHistoryList() {
  useEnsureAnswerHistorySynced();
  const store = useAnswerHistoryStore();
  return useMemo(
    () => ({
      entries: getSortedAnswerHistoryEntries(store),
    }),
    [store],
  );
}

function useAnswerHistoryStore() {
  const snapshot = useSyncExternalStore(
    subscribeAnswerHistory,
    getAnswerHistorySnapshot,
    getAnswerHistoryServerSnapshot,
  );

  return useMemo(() => parseAnswerHistoryStore(snapshot), [snapshot]);
}

let fallbackAnswerHistoryStore: AnswerHistoryStore | null = null;

async function runAnswerHistorySync() {
  const merged = await syncAnswerHistoryWithDatabase(readAnswerHistoryStore());
  if (!merged) return;
  writeAnswerHistoryStore(merged);
  notifyAnswerHistoryUpdated();
}

function useEnsureAnswerHistorySynced() {
  useDataSync({ key: "answer-history", run: runAnswerHistorySync });
}

function subscribeAnswerHistory(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === ANSWER_HISTORY_STORAGE_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ANSWER_HISTORY_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ANSWER_HISTORY_UPDATED_EVENT, onStoreChange);
  };
}

function getAnswerHistorySnapshot(): string {
  return serializeAnswerHistoryStore(readAnswerHistoryStore());
}

function getAnswerHistoryServerSnapshot(): string {
  return serializeAnswerHistoryStore(createAnswerHistoryStore());
}

function readAnswerHistoryStore(): AnswerHistoryStore {
  if (typeof window === "undefined") {
    return fallbackAnswerHistoryStore ?? createAnswerHistoryStore();
  }

  try {
    const store = parseAnswerHistoryStore(
      window.localStorage.getItem(ANSWER_HISTORY_STORAGE_KEY),
    );
    fallbackAnswerHistoryStore = store;
    return store;
  } catch {
    return fallbackAnswerHistoryStore ?? createAnswerHistoryStore();
  }
}

function writeAnswerHistoryStore(store: AnswerHistoryStore) {
  const before = store.entries.length;
  const next = parseAnswerHistoryStore(serializeAnswerHistoryStore(store));
  const after = next.entries.length;
  if (typeof window !== "undefined" && before !== after) {
    console.warn(
      `[answer-history write] 再パースで ${before - after}件 落ちました (before=${before}, after=${after})`,
    );
  }
  fallbackAnswerHistoryStore = next;
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ANSWER_HISTORY_STORAGE_KEY,
      serializeAnswerHistoryStore(next),
    );
  } catch {
    // LocalStorage が使えない環境では、その場の state だけで扱う。
  }
}

function notifyAnswerHistoryUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ANSWER_HISTORY_UPDATED_EVENT));
}
