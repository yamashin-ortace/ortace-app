import { afterEach, describe, expect, it } from "vitest";
import { ANSWER_HISTORY_STORAGE_KEY } from "@/lib/answer-history";
import { createAccountStorageKey } from "@/lib/auth/account-storage";
import {
  countLifetimeAnswersFromHistoryRaw,
  incrementLifetimeAnswerCount,
  LIFETIME_ANSWER_COUNT_KEY,
  notifyLifetimeAnswerCountUpdated,
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

const USER_ID = "test-user";
const scopedHistoryKey = createAccountStorageKey(
  ANSWER_HISTORY_STORAGE_KEY,
  USER_ID,
);
const scopedLifetimeCountKey = createAccountStorageKey(
  LIFETIME_ANSWER_COUNT_KEY,
  USER_ID,
);

describe("lifetime-answer-count", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });
  });

  it("履歴件数を累計カウンタの下限として使う", () => {
    expect(countLifetimeAnswersFromHistoryRaw(historyRaw)).toBe(2);
    expect(countLifetimeAnswersFromHistoryRaw("{invalid")).toBe(0);
  });

  it("履歴が上限未満なら、不自然に大きい累計カウンタを履歴件数に戻す", () => {
    const storage = new Map<string, string>([
      [scopedHistoryKey, historyRaw],
      [scopedLifetimeCountKey, "999"],
    ]);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        __ORTACE_ACCOUNT_USER_ID__: USER_ID,
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
        },
        dispatchEvent: () => true,
      },
    });

    expect(readLifetimeAnswerCount()).toBe(2);
    expect(storage.get(scopedLifetimeCountKey)).toBe("2");
  });

  it("履歴上限とは別に累計カウンタを増やす", () => {
    const storage = new Map<string, string>([
      [scopedHistoryKey, historyRaw],
      [scopedLifetimeCountKey, "2"],
    ]);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        __ORTACE_ACCOUNT_USER_ID__: USER_ID,
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
        },
        dispatchEvent: () => true,
      },
    });

    expect(incrementLifetimeAnswerCount()).toBe(3);
    expect(storage.get(scopedLifetimeCountKey)).toBe("3");
    expect(readLifetimeAnswerCount()).toBe(3);
  });

  it("同期後は履歴件数までカウンタを底上げする", () => {
    const storage = new Map<string, string>([
      [scopedHistoryKey, historyRaw],
      [scopedLifetimeCountKey, "1"],
    ]);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        __ORTACE_ACCOUNT_USER_ID__: USER_ID,
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
        },
        dispatchEvent: () => true,
      },
    });

    expect(notifyLifetimeAnswerCountUpdated()).toBe(2);
    expect(storage.get(scopedLifetimeCountKey)).toBe("2");
  });
});
