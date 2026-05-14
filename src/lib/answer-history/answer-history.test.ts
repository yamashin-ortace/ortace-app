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

    // 間隔反復で nextReviewAt は実行時タイムゾーンに依存するため、構造のみ検証する。
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
          streak: 1,
        },
      ],
    });
    expect(parsed.entries[0].nextReviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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

    store = recordAnswerHistory(store, {
      question,
      result: "correct",
      selectedAnswers: ["1"],
      now: new Date("2026-05-04T01:00:00.000Z"),
    });
    expect(store.entries[0].streak).toBe(2);

    store = recordAnswerHistory(store, {
      question,
      result: "incorrect",
      selectedAnswers: ["2"],
      now: new Date("2026-05-05T01:00:00.000Z"),
    });
    expect(store.entries[0].streak).toBe(0);
  });

  it("3連続正解では卒業せず、4連続正解で復習対象から外れる", () => {
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
    expect(store.entries[0].nextReviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

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
