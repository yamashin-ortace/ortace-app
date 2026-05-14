import { describe, expect, it } from "vitest";
import { ANSWER_HISTORY_STORAGE_KEY } from "@/lib/answer-history";
import {
  countLifetimeAnswersFromHistoryRaw,
  LIFETIME_ANSWER_COUNT_KEY,
  readLifetimeAnswerCount,
} from "./lifetime-answer-count";

const historyRaw = JSON.stringify({
  version: 1,
  entries: [
    {
      id: "56-101",
      answeredAt: "2026-05-08T00:00:00.000Z",
      result: "correct",
      selectedAnswers: ["1"],
      round: 56,
      session: "pm",
      displayNumber: 1,
      majorCategory: "視能検査・検査機器",
    },
    {
      id: "56-102",
      answeredAt: "2026-05-08T00:01:00.000Z",
      result: "incorrect",
      selectedAnswers: ["2"],
      round: 56,
      session: "pm",
      displayNumber: 2,
      majorCategory: "視能検査・検査機器",
    },
  ],
});

describe("lifetime-answer-count", () => {
  it("累計解答数は同期済み answer_history の entries 件数から導出する", () => {
    expect(countLifetimeAnswersFromHistoryRaw(historyRaw)).toBe(2);
    expect(countLifetimeAnswersFromHistoryRaw("{invalid")).toBe(0);
  });

  it("旧 localStorage カウンタより answer_history を優先する", () => {
    const storage = new Map<string, string>([
      [ANSWER_HISTORY_STORAGE_KEY, historyRaw],
      [LIFETIME_ANSWER_COUNT_KEY, "999"],
    ]);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
        },
      },
    });

    expect(readLifetimeAnswerCount()).toBe(2);
    expect(storage.get(LIFETIME_ANSWER_COUNT_KEY)).toBe("999");

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });
  });
});
