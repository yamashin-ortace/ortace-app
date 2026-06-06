import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { FIELDS, type Question } from "@/lib/questions";
import {
  classifyAnswerDuration,
  countMisconceptionCandidates,
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

  it("履歴がない開始直後は未着手だけを20問出す", () => {
    const questions = makeQuestions(25);

    const recommendation = pickAiCoachRecommended(questions, [], 20);

    expect(recommendation.dataReadiness).toBe("collecting");
    expect(recommendation.questions).toHaveLength(20);
    expect(recommendation.buckets.unanswered).toHaveLength(20);
    expect(recommendation.buckets.fill).toHaveLength(0);
    expect(recommendation.buckets.review).toHaveLength(0);
    expect(recommendation.buckets.weak).toHaveLength(0);
    expect(recommendation.buckets.misconception).toHaveLength(0);
    expect(new Set(recommendation.questions.map((q) => q.id)).size).toBe(20);
  });

  it("未着手枠は大分類に偏りすぎないように配る", () => {
    const questions = FIELDS.flatMap((field, fieldIndex) =>
      Array.from({ length: 3 }, (_, index) =>
        makeQuestion(`${fieldIndex + 1}-${index + 1}`, {
          round: 56,
          displayNumber: fieldIndex * 10 + index + 1,
          majorCategory: field,
          minorCategory: `${field}-中分類${index + 1}`,
          theme: `${field}-テーマ${index + 1}`,
        }),
      ),
    );

    const recommendation = pickAiCoachRecommended(questions, [], 20);
    const counts = countByField(recommendation.buckets.unanswered);

    expect(recommendation.buckets.unanswered).toHaveLength(20);
    for (const field of FIELDS) {
      expect(counts.get(field)).toBeGreaterThanOrEqual(2);
    }
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

  it("countMisconceptionCandidates は自信あり誤答と急ぎ誤答の合算件数を返す", () => {
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-1", { result: "incorrect", confidence: "high", durationMs: 45_000 }),
      makeEntry("56-2", { result: "incorrect", confidence: "guess", durationMs: 8_000 }),
      makeEntry("56-3", { result: "correct", confidence: "high", durationMs: 5_000 }),
      makeEntry("56-4", { result: "incorrect", confidence: "mid", durationMs: 40_000 }),
    ];
    // 56-1（自信あり誤答）と 56-2（急ぎ誤答）の2件
    expect(countMisconceptionCandidates(entries)).toBe(2);
  });

  it("countMisconceptionCandidates は同じ問題は最新エントリだけで判定", () => {
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-5", {
        result: "incorrect",
        confidence: "high",
        durationMs: 40_000,
        answeredAt: "2026-04-01T00:00:00.000Z",
      }),
      makeEntry("56-5", {
        result: "correct",
        confidence: "mid",
        durationMs: 30_000,
        answeredAt: "2026-05-01T00:00:00.000Z",
      }),
    ];
    expect(countMisconceptionCandidates(entries)).toBe(0);
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

  it("300〜499問のユーザーは未着手中心で復習・弱点は最大2問に抑える", () => {
    const questions = makeQuestions(340);
    const entries = questions.slice(0, 300).map((question, index) =>
      makeEntry(question.id, {
        result: index < 6 ? "incorrect" : "correct",
        confidence: index < 3 ? "high" : null,
        answeredAt: "2026-04-01T00:00:00.000Z",
        majorCategory: question.majorCategory,
      }),
    );

    const rec = pickAiCoachRecommended(questions, entries, 20, {
      now: new Date("2026-05-15T12:00:00+09:00"),
    });

    expect(rec.questions).toHaveLength(20);
    expect(rec.buckets.unanswered).toHaveLength(18);
    expect(rec.buckets.review.length + rec.buckets.weak.length).toBeLessThanOrEqual(2);
    expect(rec.buckets.misconception).toHaveLength(0);
    expect(rec.buckets.focus).toHaveLength(0);
  });

  it("500〜999問のユーザーは未着手を多めにしつつ復習系を最大20%混ぜる", () => {
    const questions = makeQuestions(620);
    const entries = questions.slice(0, 540).map((question, index) =>
      makeEntry(question.id, {
        result: index < 20 ? "incorrect" : "correct",
        confidence: index < 6 ? "high" : null,
        answeredAt: index < 20 ? "2026-04-01T00:00:00.000Z" : "2026-05-01T00:00:00.000Z",
        majorCategory: question.majorCategory,
      }),
    );

    const rec = pickAiCoachRecommended(questions, entries, 20, {
      now: new Date("2026-05-15T12:00:00+09:00"),
    });

    expect(rec.questions).toHaveLength(20);
    expect(rec.buckets.unanswered).toHaveLength(16);
    expect(
      rec.buckets.review.length +
        rec.buckets.weak.length +
        rec.buckets.misconception.length,
    ).toBeLessThanOrEqual(4);
    expect(rec.buckets.focus).toHaveLength(0);
  });

  it("1000問以上のユーザーは復習・弱点・思い込み・未回答を目標配合で出す", () => {
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
    // 成熟度判定用の既解答問題を 1000 問以上にする
    const answeredFillQs = Array.from({ length: 1000 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `50-${i + 1}`,
      round: 50,
      displayNumber: i + 1,
      majorCategory: i % 2 === 0 ? "基礎医学・解剖学" : "法規・制度・医療倫理",
      minorCategory: "成熟度判定",
    }));
    // unanswered 候補を 30 問
    const unansweredQs = Array.from({ length: 30 }, (_, i) => ({
      ...makeQuestions(1)[0],
      id: `56-${400 + i}`,
      displayNumber: 400 + i,
      majorCategory: "両眼視・斜視",
      minorCategory: "斜視・眼球運動検査",
    }));
    const questions = [
      ...answeredFillQs,
      ...reviewQs,
      ...weakQs,
      ...miscQs,
      ...unansweredQs,
    ];

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
    for (const q of answeredFillQs) {
      entries.push(
        makeEntry(q.id, {
          result: "correct",
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
    // 未回答は基本枠で最大5、残りはfillで補う
    expect(rec.buckets.unanswered.length).toBeLessThanOrEqual(5);
    // 弱点は最大5
    expect(rec.buckets.weak.length).toBeLessThanOrEqual(5);
    // 復習は最大5
    expect(rec.buckets.review.length).toBeLessThanOrEqual(5);
  });

  it("ホームで注目されるテーマを今日のおすすめに最大3問入れる", () => {
    const questions = makeQuestions(1040);
    const now = new Date("2026-05-15T12:00:00+09:00");
    const entries: AnswerHistoryEntry[] = [
      makeEntry("56-1", {
        result: "incorrect",
        confidence: "high",
        answeredAt: "2026-05-14T00:00:00.000Z",
      }),
      makeEntry("56-2", {
        result: "incorrect",
        confidence: "high",
        answeredAt: "2026-05-14T01:00:00.000Z",
      }),
      makeEntry("56-3", {
        result: "incorrect",
        confidence: "mid",
        answeredAt: "2026-05-14T02:00:00.000Z",
      }),
      makeEntry("56-4", {
        result: "incorrect",
        confidence: "guess",
        answeredAt: "2026-05-14T03:00:00.000Z",
      }),
    ];
    for (const question of questions.slice(4, 1004)) {
      entries.push(
        makeEntry(question.id, {
          result: "correct",
          answeredAt: "2026-05-01T00:00:00.000Z",
          majorCategory: question.majorCategory,
        }),
      );
    }

    const rec = pickAiCoachRecommended(questions, entries, 20, { now });

    expect(rec.buckets.focus).toHaveLength(3);
    expect(rec.buckets.focus.map((q) => q.id)).toEqual(["56-2", "56-1", "56-4"]);
    expect(rec.questions).toHaveLength(20);
    expect(new Set(rec.questions.map((q) => q.id)).size).toBe(20);
    expect(rec.buckets.unanswered.length).toBeLessThanOrEqual(5);
    expect(rec.buckets.review.length).toBeLessThanOrEqual(5);
  });

  it("今日すでに解いた問題はおすすめから外す", () => {
    const questions = makeQuestions(1040);
    const now = new Date("2026-05-15T12:00:00+09:00");
    const entries = questions.slice(0, 1000).map((question, index) =>
      makeEntry(question.id, {
        result: index === 0 ? "incorrect" : "correct",
        confidence: index === 0 ? "high" : null,
        answeredAt:
          index === 0
            ? "2026-05-15T01:00:00.000Z"
            : "2026-05-01T00:00:00.000Z",
        majorCategory: question.majorCategory,
      }),
    );

    const rec = pickAiCoachRecommended(questions, entries, 20, { now });

    expect(rec.questions.map((question) => question.id)).not.toContain("56-1");
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
  return Array.from({ length: count }, (_, index) => makeQuestion(`56-${index + 1}`, {
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

function makeQuestion(
  id: string,
  overrides: Partial<Question> = {},
): Question {
  const displayNumber = overrides.displayNumber ?? Number(id.split("-")[1] ?? 1);
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
    ...overrides,
  };
}

function countByField(questions: readonly Question[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.majorCategory, (counts.get(question.majorCategory) ?? 0) + 1);
  }
  return counts;
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
