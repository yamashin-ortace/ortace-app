import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/questions";
import { getExpectedSelectionCount, judgeAnswer } from "./index";

function buildQuestion(overrides: Partial<Question>): Question {
  return {
    id: "47-1",
    round: 47,
    number: 1,
    displayNumber: 1,
    session: "am",
    field: "テスト",
    theme: "テスト",
    questionText: "テスト問題",
    choices: { "1": "a", "2": "b", "3": "c", "4": "d", "5": "e" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: "テスト",
    minorCategory: "テスト",
    explanation: "解説",
    ...overrides,
  };
}

describe("getExpectedSelectionCount", () => {
  it("1択は1", () => {
    expect(getExpectedSelectionCount(buildQuestion({ format: "1択" }))).toBe(1);
  });
  it("2択は2", () => {
    expect(getExpectedSelectionCount(buildQuestion({ format: "2択" }))).toBe(2);
  });
  it("組み合わせは正答数に応じて1か2", () => {
    expect(
      getExpectedSelectionCount(
        buildQuestion({ format: "組み合わせ", correctAnswers: ["1"] }),
      ),
    ).toBe(1);
    expect(
      getExpectedSelectionCount(
        buildQuestion({ format: "組み合わせ", correctAnswers: ["2", "5"] }),
      ),
    ).toBe(2);
  });
});

describe("judgeAnswer", () => {
  it("1択：正答に一致なら正解", () => {
    const q = buildQuestion({ correctAnswers: ["3"] });
    expect(judgeAnswer(q, ["3"])).toBe("correct");
    expect(judgeAnswer(q, ["1"])).toBe("incorrect");
  });

  it("2択：選択セットが正答セットと完全一致なら正解（順序無関係）", () => {
    const q = buildQuestion({ format: "2択", correctAnswers: ["2", "4"] });
    expect(judgeAnswer(q, ["2", "4"])).toBe("correct");
    expect(judgeAnswer(q, ["4", "2"])).toBe("correct");
    expect(judgeAnswer(q, ["2", "3"])).toBe("incorrect");
    expect(judgeAnswer(q, ["2"])).toBe("incorrect");
  });

  it("出題ミス（1択で正答複数）：どちらか選べば正解", () => {
    const q = buildQuestion({ format: "1択", correctAnswers: ["3", "5"] });
    expect(judgeAnswer(q, ["3"])).toBe("correct");
    expect(judgeAnswer(q, ["5"])).toBe("correct");
    expect(judgeAnswer(q, ["1"])).toBe("incorrect");
  });

  it("正答未確定：no_answer", () => {
    const q = buildQuestion({ correctAnswers: [] });
    expect(judgeAnswer(q, ["1"])).toBe("no_answer");
    expect(judgeAnswer(q, [])).toBe("no_answer");
  });
});
