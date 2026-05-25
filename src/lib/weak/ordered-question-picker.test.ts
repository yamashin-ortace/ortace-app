import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import { createMidCategoryKey } from "./mid-category-analysis";
import { pickOrderedWeakQuestions } from "./ordered-question-picker";

describe("pickOrderedWeakQuestions", () => {
  it("中分類ごとに基礎問題、自信あり誤答、類題の順で出題候補を作る", () => {
    const questions = [
      question("56-1", 1),
      question("56-2", 2),
      question("56-3", 3),
      question("56-4", 4),
      question("56-5", 5),
      question("56-6", 6),
    ];
    const entries: AnswerHistoryEntry[] = [
      entry(questions[1], 1, { result: "correct" }),
      entry(questions[3], 2, { result: "incorrect", confidence: "high" }),
      entry(questions[4], 3, { result: "incorrect", confidence: "high" }),
    ];

    const picked = pickOrderedWeakQuestions(
      questions,
      entries,
      [
        {
          categoryKey: createMidCategoryKey(questions[0]),
          majorCategory: questions[0].majorCategory,
          minorCategory: questions[0].minorCategory,
          judged: 5,
          correct: 1,
          incorrect: 4,
          accuracy: 20,
          highConfidenceMisses: 2,
          slowAnswers: 0,
          slowMisses: 0,
          repeatedMisses: 0,
          latestHighConfidenceMissQuestionIds: ["56-4", "56-5"],
        },
      ],
      5,
    );

    expect(picked.map((item) => item.id)).toEqual([
      "56-1",
      "56-2",
      "56-3",
      "56-5",
      "56-4",
    ]);
  });

  it("対象中分類がない場合は空配列を返す", () => {
    expect(pickOrderedWeakQuestions([], [], [], 20)).toEqual([]);
  });
});

function question(id: string, displayNumber: number): Question {
  return {
    id,
    round: 56,
    number: displayNumber,
    displayNumber,
    session: "am",
    field: "眼科疾患・神経眼科",
    theme: "緑内障",
    questionText: "問題文",
    choices: { "1": "選択肢" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: "眼科疾患・神経眼科",
    minorCategory: "緑内障",
    explanation: "解説",
  };
}

function entry(
  question: Question,
  minuteOffset: number,
  overrides: Partial<AnswerHistoryEntry>,
): AnswerHistoryEntry {
  return {
    id: question.id,
    answeredAt: new Date(
      Date.UTC(2026, 4, 25, 0, minuteOffset, 0),
    ).toISOString(),
    result: "correct",
    selectedAnswers: ["1"],
    round: question.round,
    session: question.session,
    displayNumber: question.displayNumber,
    majorCategory: question.majorCategory,
    confidence: null,
    durationMs: null,
    ...overrides,
  };
}
