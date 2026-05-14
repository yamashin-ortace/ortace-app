import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import {
  classifyAnswerDuration,
  pickAiCoachRecommended,
  pickMisconceptionQuestions,
} from "./recommendation";

describe("AI coach recommendation", () => {
  it("解答時間を速い・標準・じっくりに分類する", () => {
    expect(classifyAnswerDuration(14_999)).toBe("fast");
    expect(classifyAnswerDuration(15_000)).toBe("standard");
    expect(classifyAnswerDuration(59_999)).toBe("standard");
    expect(classifyAnswerDuration(60_000)).toBe("deliberate");
    expect(classifyAnswerDuration(null)).toBeNull();
  });

  it("履歴がない開始直後は未回答を20問に補充する", () => {
    const questions = makeQuestions(25);

    const recommendation = pickAiCoachRecommended(questions, [], 20);

    expect(recommendation.dataReadiness).toBe("collecting");
    expect(recommendation.questions).toHaveLength(20);
    expect(recommendation.buckets.unanswered).toHaveLength(3);
    expect(recommendation.buckets.fill).toHaveLength(17);
    expect(new Set(recommendation.questions.map((q) => q.id)).size).toBe(20);
  });

  it("正答未確定問題はAIコーチ推薦から除外する", () => {
    const questions = [
      ...makeQuestions(3),
      { ...makeQuestions(1)[0], id: "56-99", correctAnswer: "", correctAnswers: [] },
    ];

    const recommendation = pickAiCoachRecommended(questions, [], 20);

    expect(recommendation.questions.map((q) => q.id)).not.toContain("56-99");
  });

  it("自信あり誤答と速すぎた誤答を思い込み候補にする", () => {
    const questions = makeQuestions(5);
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-1", {
        result: "incorrect",
        confidence: "high",
        durationMs: 45_000,
      }),
      makeEntry("56-2", {
        result: "incorrect",
        confidence: "mid",
        durationMs: 10_000,
      }),
      makeEntry("56-3", {
        result: "correct",
        confidence: "high",
        durationMs: 8_000,
      }),
    ];

    expect(pickMisconceptionQuestions(questions, entries, 10).map((q) => q.id)).toEqual([
      "56-1",
      "56-2",
    ]);
  });

  it("no_answer履歴は思い込み候補にしない", () => {
    const questions = makeQuestions(2);
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-1", {
        result: "no_answer",
        confidence: "high",
        durationMs: 10_000,
      }),
    ];

    expect(pickMisconceptionQuestions(questions, entries, 10)).toHaveLength(0);
  });

  it("テーマ名が少し違っても同じAIテーマクラスタなら反復ミスとして拾う", () => {
    const questions = [
      {
        ...makeQuestions(1)[0],
        id: "56-10",
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "緑内障",
        theme: "緑内障視野",
      },
      {
        ...makeQuestions(1)[0],
        id: "56-11",
        displayNumber: 11,
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "緑内障",
        theme: "緑内障視野欠損",
      },
    ];
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-10", { result: "incorrect", majorCategory: "眼科疾患・神経眼科" }),
      makeEntry("56-11", { result: "incorrect", majorCategory: "眼科疾患・神経眼科" }),
    ];

    expect(pickMisconceptionQuestions(questions, entries, 10).map((q) => q.id)).toContain(
      "56-11",
    );
  });
});

function makeQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `56-${index + 1}`,
    round: 56,
    number: index + 1,
    displayNumber: index + 1,
    session: "am",
    field: index < 10 ? "視能検査・検査機器" : "眼科疾患・神経眼科",
    theme: index < 10 ? "視力検査" : "神経眼科",
    questionText: "問題文",
    choices: { "1": "A", "2": "B" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: index < 10 ? "視能検査・検査機器" : "眼科疾患・神経眼科",
    minorCategory: index < 10 ? "視力検査" : "神経眼科",
    explanation: "解説",
  }));
}

function makeEntry(
  id: string,
  overrides: Partial<AnswerHistoryEntry> = {},
): AnswerHistoryEntry {
  return {
    id,
    answeredAt: "2026-05-08T00:00:00.000Z",
    result: "correct",
    selectedAnswers: ["1"],
    round: 56,
    session: "am",
    displayNumber: Number(id.split("-")[1] ?? 1),
    majorCategory: "視能検査・検査機器",
    confidence: null,
    durationMs: null,
    ...overrides,
  };
}
