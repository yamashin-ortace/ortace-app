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
    expect(recommendation.buckets.unanswered).toHaveLength(6);
    expect(recommendation.buckets.fill).toHaveLength(14);
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

  it("データが十分なユーザーは復習・弱点・思い込み・未回答を目標配合で出す", () => {
    // review 候補(復習期限超過の誤答)を 8 問
    const reviewQs = Array.from({ length: 8 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `56-${100 + i}`,
      displayNumber: 100 + i,
      majorCategory: "眼光学・視力学・計算",
      minorCategory: "屈折検査",
    }));
    // weak 候補(majorCategoryが弱点候補)を 8 問
    const weakQs = Array.from({ length: 8 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `56-${200 + i}`,
      displayNumber: 200 + i,
      majorCategory: "視能検査・検査機器",
      minorCategory: "視力検査",
    }));
    // misconception 候補(自信あり誤答)を 5 問
    const miscQs = Array.from({ length: 5 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `56-${300 + i}`,
      displayNumber: 300 + i,
      majorCategory: "眼科疾患・神経眼科",
      minorCategory: "神経眼科",
    }));
    // unanswered 候補を 15 問
    const unansweredQs = Array.from({ length: 15 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `56-${400 + i}`,
      displayNumber: 400 + i,
      majorCategory: "両眼視・斜視",
      minorCategory: "斜視・眼球運動検査",
    }));
    const questions = [...reviewQs, ...weakQs, ...miscQs, ...unansweredQs];

    // 履歴: review は復習期限超過のため過去日付で2回連続誤答、weak は誤答1回、misc は自信あり誤答、unanswered は履歴なし
    const longAgo = "2025-12-01T00:00:00.000Z";
    const recent = "2026-05-13T00:00:00.000Z";
    const entries: AnswerHistoryEntry[] = [];
    // review: 復習対象になる条件は実装に依存するため、誤答+古い日付で代用
    for (const q of reviewQs) {
      entries.push(
        makeEntry(q.id, {
          result: "incorrect",
          majorCategory: q.majorCategory,
          answeredAt: longAgo,
        }),
      );
      entries.push(
        makeEntry(q.id, {
          result: "incorrect",
          majorCategory: q.majorCategory,
          answeredAt: recent,
        }),
      );
    }
    for (const q of weakQs) {
      entries.push(
        makeEntry(q.id, {
          result: "incorrect",
          majorCategory: q.majorCategory,
          answeredAt: recent,
        }),
      );
    }
    for (const q of miscQs) {
      entries.push(
        makeEntry(q.id, {
          result: "incorrect",
          confidence: "high",
          durationMs: 45_000,
          majorCategory: q.majorCategory,
          answeredAt: recent,
        }),
      );
    }

    const rec = pickAiCoachRecommended(questions, entries, 20);

    expect(rec.questions).toHaveLength(20);
    // 合計でユニーク20問
    expect(new Set(rec.questions.map((q) => q.id)).size).toBe(20);
    // 思い込みは最大3
    expect(rec.buckets.misconception.length).toBeLessThanOrEqual(3);
    // 未回答は最大6
    expect(rec.buckets.unanswered.length).toBeLessThanOrEqual(6);
    // 弱点は最大5
    expect(rec.buckets.weak.length).toBeLessThanOrEqual(5);
    // 復習は最大6
    expect(rec.buckets.review.length).toBeLessThanOrEqual(6);
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
