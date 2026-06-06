import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/questions";
import {
  createAnswerHistoryStore,
  getSortedAnswerHistoryEntries,
  getUniqueSortedAnswerHistoryEntries,
  normalizeAnswerHistoryStore,
  parseAnswerHistoryStore,
  recordAnswerHistory,
  serializeAnswerHistoryStore,
  updateAnswerConfidence,
  updateAnswerFeeling,
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
      durationMs: 12_345,
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
      durationMs: 12_345,
    });
  });

  it("壊れた保存値は空ストアに戻す", () => {
    expect(parseAnswerHistoryStore("{invalid")).toEqual(
      createAnswerHistoryStore(),
    );
  });

  it("必須フィールドが欠けた履歴を正規化で落とす", () => {
    // id="bad" 等の「DB CHECK 正規ID外だが文字列としては有効」なIDは、
    // 端末間同期の取りこぼし回避のため受け入れる方針（loose）。
    // ここでは answeredAt が空など、本当に壊れたエントリだけ落ちることを確認する。
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
            id: "",
            answeredAt: "",
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

    const parsed = JSON.parse(serializeAnswerHistoryStore(store));
    expect(parsed).toMatchObject({
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
          confidence: null,
          durationMs: null,
          streak: 1,
          nextReviewAt: null,
        },
      ],
    });
  });

  it("同じ実体の履歴は表示用に1件へまとめる", () => {
    const store = normalizeAnswerHistoryStore({
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
          id: "56-101",
          answeredAt: "2026-05-08T00:00:00+00:00",
          result: "correct",
          selectedAnswers: ["1"],
          round: 56,
          session: "pm",
          displayNumber: 1,
          majorCategory: "視能検査・検査機器",
        },
      ],
    });

    expect(store.entries).toHaveLength(2);
    expect(getUniqueSortedAnswerHistoryEntries(store)).toHaveLength(1);
  });

  it("正解で連続正解数が増え、誤答で 0 にリセットされる", () => {
    let store = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });
    expect(store.entries[0].streak).toBe(1);
    expect(store.entries[0].nextReviewAt).toBeNull();

    store = recordAnswerHistory(store, {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-04T01:00:00.000Z"),
    });
    expect(store.entries[0].streak).toBe(2);
    expect(store.entries[0].nextReviewAt).toBeNull();

    store = recordAnswerHistory(store, {
      question,
      result: "incorrect",
      selectedAnswers: ["2"],
      now: new Date("2026-05-05T01:00:00.000Z"),
    });
    expect(store.entries[0].streak).toBe(0);
    expect(store.entries[0].nextReviewAt).toBe("2026-05-07");
  });

  it("正答未確定は復習対象にしない", () => {
    const store = recordAnswerHistory(createAnswerHistoryStore(), {
      question: { ...question, correctAnswer: "", correctAnswers: [] },
      result: "no_answer",
      selectedAnswers: ["1"],
      now: new Date("2026-05-05T01:00:00.000Z"),
    });

    expect(store.entries[0]).toMatchObject({
      result: "no_answer",
      streak: 0,
      nextReviewAt: null,
    });
  });

  it("自信ありで正解した問題は復習対象にしない", () => {
    const store = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });

    expect(store.entries[0].nextReviewAt).toBeNull();

    const updated = updateAnswerConfidence(store, {
      questionId: question.id,
      answeredAt: store.entries[0].answeredAt,
      confidence: "high",
    });

    expect(updated.entries[0]).toMatchObject({
      confidence: "high",
      nextReviewAt: null,
    });
  });

  it("迷った正解と勘かも正解だけ後日の軽い復習対象にする", () => {
    const store = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });
    const guessed = updateAnswerConfidence(store, {
      questionId: question.id,
      answeredAt: store.entries[0].answeredAt,
      confidence: "guess",
    });

    expect(guessed.entries[0]).toMatchObject({
      confidence: "guess",
      nextReviewAt: "2026-05-08",
    });

    const unsure = updateAnswerConfidence(guessed, {
      questionId: question.id,
      answeredAt: store.entries[0].answeredAt,
      confidence: "mid",
    });

    expect(unsure.entries[0]).toMatchObject({
      confidence: "mid",
      nextReviewAt: "2026-05-15",
    });
  });

  it("解いた感覚は旧自信度に変換しつつ復習日を調整する", () => {
    const correct = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });

    const noBasis = updateAnswerFeeling(correct, {
      questionId: question.id,
      answeredAt: correct.entries[0].answeredAt,
      answerFeeling: "no_basis",
    });

    expect(noBasis.entries[0]).toMatchObject({
      answerFeeling: "no_basis",
      confidence: "guess",
      nextReviewAt: "2026-05-08",
    });

    const incorrect = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "incorrect",
      selectedAnswers: ["2"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });

    const careless = updateAnswerFeeling(incorrect, {
      questionId: question.id,
      answeredAt: incorrect.entries[0].answeredAt,
      answerFeeling: "careless",
    });

    expect(careless.entries[0]).toMatchObject({
      answerFeeling: "careless",
      confidence: "mid",
      nextReviewAt: "2026-05-02",
    });
  });

  it("自信度を解除すると正解問題は復習対象から外れる", () => {
    const store = recordAnswerHistory(createAnswerHistoryStore(), {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-01T01:00:00.000Z"),
    });
    const guessed = updateAnswerConfidence(store, {
      questionId: question.id,
      answeredAt: store.entries[0].answeredAt,
      confidence: "guess",
    });

    const cleared = updateAnswerConfidence(guessed, {
      questionId: question.id,
      answeredAt: store.entries[0].answeredAt,
      confidence: null,
    });

    expect(cleared.entries[0]).toMatchObject({
      confidence: null,
      nextReviewAt: null,
    });
  });

  it("正解が続いても復習キューは増やさず、連続正解数だけ記録する", () => {
    let store = createAnswerHistoryStore();
    for (const now of [
      "2026-05-01T01:00:00.000Z",
      "2026-05-02T01:00:00.000Z",
      "2026-05-05T01:00:00.000Z",
    ]) {
      store = recordAnswerHistory(store, {
        question,
        result: "correct",
        selectedAnswers: ["1"],
        now: new Date(now),
      });
    }

    expect(store.entries[0].streak).toBe(3);
    expect(store.entries[0].nextReviewAt).toBeNull();

    store = recordAnswerHistory(store, {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-12T01:00:00.000Z"),
    });

    expect(store.entries[0].streak).toBe(4);
    expect(store.entries[0].nextReviewAt).toBeNull();
  });
});
