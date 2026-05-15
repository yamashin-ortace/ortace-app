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
    expect(analysis.message).toContain("条件を拾う流れ");
    expect(analysis.actionHref).toContain(
      "/study/ai-theme/glaucoma-visual-field?count=3",
    );
    expect(analysis.actionHref).toContain("exclude=56-1%2C56-2");
    expect(analysis.actionHref).toContain("focus=");
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

  it("自信あり誤答は件数を入れて説明する", () => {
    const questions = [
      question({
        id: "55-3",
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "神経眼科",
        theme: "瞳孔反応解離",
      }),
      question({
        id: "55-4",
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "神経眼科",
        theme: "瞳孔反応解離",
      }),
    ];
    const entries = [
      entry("55-3", { result: "incorrect", confidence: "high", durationMs: 40_000 }),
      entry("55-4", { result: "incorrect", confidence: "high", durationMs: 40_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "55-3": "incorrect", "55-4": "incorrect" },
      entries,
    );

    expect(analysis.message).toContain("自信あり");
    expect(analysis.message).toContain("2問");
  });

  it("自信あり誤答と急ぎすぎ誤答が両方あれば複合メッセージを出す", () => {
    const questions = [
      question({
        id: "55-10",
        majorCategory: "両眼視・斜視",
        minorCategory: "斜視・眼球運動検査",
        theme: "Hess赤緑試験",
      }),
      question({
        id: "55-11",
        majorCategory: "両眼視・斜視",
        minorCategory: "斜視・眼球運動検査",
        theme: "Hess赤緑試験",
      }),
    ];
    const entries = [
      entry("55-10", { result: "incorrect", confidence: "high", durationMs: 40_000 }),
      entry("55-11", { result: "incorrect", confidence: "guess", durationMs: 9_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "55-10": "incorrect", "55-11": "incorrect" },
      entries,
    );

    expect(analysis.message).toContain("自信あり");
    expect(analysis.message).toContain("急ぎ気味");
  });

  it("誤答3問以上+自信あり+急ぎ気味なら重症複合メッセージ", () => {
    const questions = Array.from({ length: 4 }, (_, i) =>
      question({
        id: `55-${100 + i}`,
        displayNumber: 100 + i,
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "神経眼科",
        theme: "瞳孔反応解離",
      }),
    );
    const entries = [
      entry("55-100", { result: "incorrect", confidence: "high", durationMs: 8_000 }),
      entry("55-101", { result: "incorrect", confidence: "high", durationMs: 40_000 }),
      entry("55-102", { result: "incorrect", confidence: "guess", durationMs: 10_000 }),
      entry("55-103", { result: "incorrect", confidence: "guess", durationMs: 40_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      {
        "55-100": "incorrect",
        "55-101": "incorrect",
        "55-102": "incorrect",
        "55-103": "incorrect",
      },
      entries,
    );

    expect(analysis.message).toContain("少し荒れています");
    expect(analysis.message).toContain("自信あり");
    expect(analysis.message).toContain("急ぎすぎ");
  });

  it("同じテーマで誤答が複数なら集中ミス文言を出す", () => {
    const questions = [
      question({
        id: "55-200",
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "緑内障",
        theme: "急性緑内障発作",
      }),
      question({
        id: "55-201",
        displayNumber: 201,
        majorCategory: "眼科疾患・神経眼科",
        minorCategory: "緑内障",
        theme: "急性緑内障発作",
      }),
    ];
    const entries = [
      entry("55-200", { result: "incorrect", confidence: "guess", durationMs: 40_000 }),
      entry("55-201", { result: "incorrect", confidence: "guess", durationMs: 40_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "55-200": "incorrect", "55-201": "incorrect" },
      entries,
    );

    expect(analysis.message).toContain("急性緑内障発作");
    expect(analysis.message).toContain("続けて落としています");
  });

  it("自信あり1問だけなら『1問』『軽く』のトーンで出す", () => {
    const questions = [
      question({
        id: "55-300",
        majorCategory: "両眼視・斜視",
        minorCategory: "内斜視",
        theme: "調節性内斜視",
      }),
    ];
    const entries = [
      entry("55-300", { result: "incorrect", confidence: "high", durationMs: 40_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "55-300": "incorrect" },
      entries,
    );

    expect(analysis.message).toContain("1問");
    expect(analysis.message).toContain("自信あり");
    expect(analysis.message).toContain("軽く");
  });

  it("正解だけで時間が長い問題が1問あれば『1問だけ時間』のトーン", () => {
    const questions = [
      question({
        id: "55-400",
        majorCategory: "視能検査・検査機器",
        minorCategory: "視力検査",
        theme: "視力検査",
      }),
    ];
    const entries = [
      entry("55-400", { result: "correct", durationMs: 90_000 }),
    ];

    const analysis = analyzeAiCoachSession(
      questions,
      { "55-400": "correct" },
      entries,
    );

    expect(analysis.message).toContain("1問だけ時間");
  });

  it("20問以上なら補足分析を複数出す", () => {
    const questions = Array.from({ length: 20 }, (_, index) =>
      question({
        id: `56-${index + 1}`,
        displayNumber: index + 1,
        minorCategory: index < 10 ? "緑内障" : "視力検査",
        theme: index < 10 ? "緑内障視野" : "視力検査",
      }),
    );
    const judgements = Object.fromEntries(
      questions.map((item, index) => [
        item.id,
        index % 5 === 0 ? "incorrect" : "correct",
      ]),
    );

    const analysis = analyzeAiCoachSession(questions, judgements, []);

    expect(analysis.details.length).toBeGreaterThanOrEqual(2);
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
