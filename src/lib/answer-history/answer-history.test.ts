import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/questions";
import {
  createAnswerHistoryStore,
  getSortedAnswerHistoryEntries,
  normalizeAnswerHistoryStore,
  parseAnswerHistoryStore,
  recordAnswerHistory,
  serializeAnswerHistoryStore,
} from ".";

const question: Question = {
  id: "56-101",
  round: 56,
  number: 101,
  displayNumber: 1,
  session: "pm",
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

describe("answer-history", () => {
  it("解答履歴を新しい順に保存できる", () => {
    const first = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-08T00:00:00.000Z"),
    });
    const second = recordAnswerHistory(first, {
      question: { ...question, id: "56-102", displayNumber: 2, number: 102 },
      result: "incorrect",
      selectedAnswers: ["2"],
      now: new Date("2026-05-08T00:01:00.000Z"),
    });

    expect(getSortedAnswerHistoryEntries(second).map((entry) => entry.id)).toEqual([
      "56-102",
      "56-101",
    ]);
    expect(second.entries[0]).toMatchObject({
      id: "56-102",
      result: "incorrect",
      selectedAnswers: ["2"],
      round: 56,
      session: "pm",
      displayNumber: 2,
      majorCategory: "視能検査・検査機器",
    });
  });

  it("壊れた保存値は空ストアに戻す", () => {
    expect(parseAnswerHistoryStore("{invalid")).toEqual(
      createAnswerHistoryStore(),
    );
  });

  it("不正な履歴を正規化で落とす", () => {
    expect(
      normalizeAnswerHistoryStore({
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
            id: "bad",
            answeredAt: "2026-05-08T00:00:00.000Z",
            result: "correct",
            selectedAnswers: ["1"],
            round: 56,
            session: "pm",
            displayNumber: 1,
            majorCategory: "視能検査・検査機器",
          },
        ],
      }).entries,
    ).toHaveLength(1);
  });

  it("保存形式を version と entries に統一する", () => {
    const store = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    expect(serializeAnswerHistoryStore(store)).toBe(
      '{"version":1,"entries":[{"id":"56-101","answeredAt":"2026-05-08T00:00:00.000Z","result":"correct","selectedAnswers":["1"],"round":56,"session":"pm","displayNumber":1,"majorCategory":"視能検査・検査機器"}]}',
    );
  });
});
