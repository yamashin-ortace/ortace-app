import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import { analyzeAiCoachSession } from "./session-analysis";

describe("AI coach session analysis", () => {
  it("急ぎすぎた誤答のテーマへ3問確認CTAを出す", () => {
    const questions = [
      question({
        id: "56-1",
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "緑内障",
        theme: "緑内障視野",
      }),
      question({ id: "56-2", minorCategory: "視力検査", theme: "視力検査" }),
    ];
    const entries = [
      entry("56-1", { result: "incorrect", durationMs: 10_000 }),
      entry("56-2", { result: "correct", durationMs: 20_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "56-1": "incorrect", "56-2": "correct" },
      entries,
    );

    expect(analysis.status).toBe("ready");
    expect(analysis.clusterLabel).toBe("緑内障と視野変化");
    expect(analysis.message).toContain("少し急いだミス");
    expect(analysis.actionHref).toBe("/study/ai-theme/glaucoma-visual-field?count=3");
    expect(analysis.actionLabel).toBe("このテーマを3問だけ確認");
  });

  it("正答未確定だけなら未回答3問の案内にする", () => {
    const analysis = analyzeAiCoachSession(
      [question({ id: "56-99", correctAnswer: "", correctAnswers: [] })],
      { "56-99": "no_answer" },
      [entry("56-99", { result: "no_answer" })],
    );

    expect(analysis.status).toBe("collecting");
    expect(analysis.actionHref).toBe("/study/unanswered?count=3");
  });
});

function question(overrides: Partial<Question>): Question {
  return {
    id: "56-1",
    round: 56,
    number: 1,
    displayNumber: 1,
    session: "am",
    field: "眼科疾患・神経眼科",
    theme: "緑内障",
    questionText: "問題文",
    choices: { "1": "A", "2": "B" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: "眼科疾患・神経眼科",
    minorCategory: "緑内障",
    explanation: "解説",
    ...overrides,
  };
}

function entry(
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
    majorCategory: "眼科疾患・神経眼科",
    confidence: null,
    durationMs: null,
    ...overrides,
  };
}
