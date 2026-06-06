import { afterEach, describe, expect, it } from "vitest";
import type { Question } from "@/lib/questions";
import {
  clearLastQuizProgress,
  readLastQuizProgress,
  restoreQuestionsFromLastProgress,
  writeLastQuizProgress,
} from ".";

const questions: Question[] = [
  makeQuestion("56-1", 1),
  makeQuestion("56-2", 2),
  makeQuestion("56-3", 3),
];

describe("quiz-progress", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });
  });

  it("stores answered state and restores the same question set by id", () => {
    installLocalStorage();

    writeLastQuizProgress({
      href: "/study/today",
      label: "今日のおすすめ",
      index: 1,
      total: 3,
      savedAt: "2026-06-06T00:00:00.000Z",
      questionIds: ["56-2", "56-1"],
      states: {
        "56-2": { selected: ["1"], judgement: "correct" },
      },
    });

    expect(readLastQuizProgress()).toMatchObject({
      href: "/study/today",
      index: 1,
      states: {
        "56-2": { selected: ["1"], judgement: "correct" },
      },
    });
    expect(
      restoreQuestionsFromLastProgress("/study/today", questions).map(
        (question) => question.id,
      ),
    ).toEqual(["56-2", "56-1"]);
  });

  it("does not restore a question set when a saved id is unavailable", () => {
    installLocalStorage();

    writeLastQuizProgress({
      href: "/study/today",
      label: "今日のおすすめ",
      index: 0,
      total: 2,
      savedAt: "2026-06-06T00:00:00.000Z",
      questionIds: ["56-1", "missing"],
    });

    expect(restoreQuestionsFromLastProgress("/study/today", questions)).toBeNull();
  });

  it("clears saved progress", () => {
    installLocalStorage();

    writeLastQuizProgress({
      href: "/study/today",
      label: "今日のおすすめ",
      index: 0,
      total: 1,
      savedAt: "2026-06-06T00:00:00.000Z",
    });
    clearLastQuizProgress();

    expect(readLastQuizProgress()).toBeNull();
  });
});

function installLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    },
  });
}

function makeQuestion(id: string, displayNumber: number): Question {
  return {
    id,
    round: 56,
    number: displayNumber,
    displayNumber,
    session: "am",
    field: "視能検査・検査機器",
    theme: "視力検査",
    questionText: "問題文",
    choices: { "1": "A", "2": "B" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: "視能検査・検査機器",
    minorCategory: "視力検査",
    explanation: "解説",
  };
}
