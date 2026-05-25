import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import {
  analyzeMidCategoryWeakness,
  createMidCategoryKey,
} from "./mid-category-analysis";

describe("analyzeMidCategoryWeakness", () => {
  it("正誤判定済みの履歴が30問未満なら collecting にする", () => {
    const questions = makeQuestions(29, "視能検査・検査機器", "視力検査");
    const entries = questions.map((question, index) =>
      entry(question, index, { result: "correct" }),
    );

    const analysis = analyzeMidCategoryWeakness(questions, entries);

    expect(analysis.readiness).toBe("collecting");
    expect(analysis.judgedCount).toBe(29);
    expect(analysis.requiredCount).toBe(30);
    expect(analysis.rows).toEqual([]);
  });

  it("中分類ごとの正答率と誤答要因を集計し、弱い順に上位3件を返す", () => {
    const glaucoma = makeQuestions(6, "眼科疾患・神経眼科", "緑内障");
    const refraction = makeQuestions(6, "眼光学・視力学・計算", "視力・視角計算", 10);
    const strabismus = makeQuestions(6, "両眼視・斜視", "斜視・眼球運動検査", 20);
    const filler = makeQuestions(12, "基礎医学・解剖学", "眼の発生・生理的計測値", 30);
    const questions = [...glaucoma, ...refraction, ...strabismus, ...filler];
    const entries: AnswerHistoryEntry[] = [
      entry(glaucoma[0], 0, {
        result: "incorrect",
        confidence: "high",
        durationMs: 70_000,
      }),
      entry(glaucoma[0], -1, {
        result: "incorrect",
        confidence: "high",
        durationMs: 65_000,
      }),
      entry(glaucoma[1], 1, {
        result: "incorrect",
        confidence: "high",
        durationMs: 20_000,
      }),
      entry(glaucoma[2], 2, { result: "incorrect", durationMs: 80_000 }),
      entry(glaucoma[3], 3, { result: "incorrect" }),
      entry(glaucoma[4], 4, { result: "correct" }),
      entry(glaucoma[5], 5, { result: "correct" }),
      ...refraction.map((question, index) =>
        entry(question, 10 + index, {
          result: index < 3 ? "incorrect" : "correct",
        }),
      ),
      ...strabismus.map((question, index) =>
        entry(question, 20 + index, {
          result: index < 2 ? "incorrect" : "correct",
        }),
      ),
      ...filler.map((question, index) =>
        entry(question, 30 + index, { result: "correct" }),
      ),
    ];

    const analysis = analyzeMidCategoryWeakness(questions, entries);

    expect(analysis.readiness).toBe("ready");
    expect(analysis.rows).toHaveLength(3);
    expect(analysis.rows[0]).toMatchObject({
      categoryKey: createMidCategoryKey(glaucoma[0]),
      minorCategory: "緑内障",
      judged: 6,
      correct: 2,
      incorrect: 4,
      accuracy: 33,
      highConfidenceMisses: 2,
      slowAnswers: 2,
      slowMisses: 2,
      repeatedMisses: 1,
    });
    expect(analysis.rows.map((row) => row.minorCategory)).toEqual([
      "緑内障",
      "視力・視角計算",
      "斜視・眼球運動検査",
    ]);
  });
});

function makeQuestions(
  count: number,
  majorCategory: string,
  minorCategory: string,
  offset = 0,
): Question[] {
  return Array.from({ length: count }, (_, index) =>
    question({
      id: `56-${offset + index + 1}`,
      displayNumber: offset + index + 1,
      majorCategory,
      minorCategory,
    }),
  );
}

function question(
  overrides: Pick<Question, "id" | "displayNumber" | "majorCategory" | "minorCategory">,
): Question {
  return {
    id: overrides.id,
    round: 56,
    number: overrides.displayNumber,
    displayNumber: overrides.displayNumber,
    session: "am",
    field: overrides.majorCategory,
    theme: overrides.minorCategory,
    questionText: "問題文",
    choices: { "1": "選択肢" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: overrides.majorCategory,
    minorCategory: overrides.minorCategory,
    explanation: "解説",
  };
}

function entry(
  question: Question,
  dayOffset: number,
  overrides: Partial<AnswerHistoryEntry> = {},
): AnswerHistoryEntry {
  return {
    id: question.id,
    answeredAt: new Date(
      Date.UTC(2026, 4, 1 + dayOffset, 0, 0, 0),
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
