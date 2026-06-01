import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import {
  analyzeMidCategoryWeakness,
  createMidCategoryKey,
  pickRotatedWeaknessRow,
} from "./mid-category-analysis";
import { createWeakPracticeState } from "./practice-state";

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

  it("直近の異なる5問を使い、明確な苦手と要注意を分ける", () => {
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
    expect(analysis.rows).toHaveLength(1);
    expect(analysis.rows[0]).toMatchObject({
      categoryKey: createMidCategoryKey(glaucoma[0]),
      minorCategory: "緑内障",
      judged: 5,
      correct: 2,
      incorrect: 3,
      accuracy: 40,
      highConfidenceMisses: 1,
      slowAnswers: 1,
      slowMisses: 1,
      repeatedMisses: 2,
    });
    expect(analysis.rows.map((row) => row.minorCategory)).toEqual(["緑内障"]);
    expect(analysis.watchRows.map((row) => row.minorCategory)).toEqual([
      "視力・視角計算",
    ]);
  });

  it("正答率80%以上の安定テーマは苦手にせず、要注意テーマだけを分離する", () => {
    const weak = makeQuestions(5, "眼科疾患・神経眼科", "緑内障");
    const watch = makeQuestions(5, "両眼視・斜視", "外斜視", 10);
    const stable = makeQuestions(5, "視能検査・検査機器", "視力検査", 20);
    const filler = makeQuestions(15, "基礎医学・解剖学", "眼球・眼窩の解剖", 30);
    const questions = [...weak, ...watch, ...stable, ...filler];
    const entries = [
      ...weak.map((question, index) =>
        entry(question, index, { result: index < 2 ? "correct" : "incorrect" }),
      ),
      ...watch.map((question, index) =>
        entry(question, 10 + index, {
          result: index === 1 || index === 3 ? "incorrect" : "correct",
        }),
      ),
      ...stable.map((question, index) =>
        entry(question, 20 + index, { result: "correct" }),
      ),
      ...filler.map((question, index) =>
        entry(question, 30 + index, { result: "correct" }),
      ),
    ];

    const analysis = analyzeMidCategoryWeakness(questions, entries);

    expect(analysis.rows.map((row) => row.minorCategory)).toEqual(["緑内障"]);
    expect(analysis.watchRows.map((row) => row.minorCategory)).toEqual(["外斜視"]);
  });

  it("改善したテーマは経過観察へ移し、新しい3連続誤答があれば苦手に戻す", () => {
    const target = makeQuestions(8, "眼科疾患・神経眼科", "神経眼科");
    const filler = makeQuestions(27, "基礎医学・解剖学", "眼球・眼窩の解剖", 20);
    const questions = [...target, ...filler];
    const initialEntries = [
      ...target.slice(0, 5).map((question, index) =>
        entry(question, index, {
          result: index < 2 ? "correct" : "incorrect",
        }),
      ),
      ...filler.map((question, index) =>
        entry(question, 30 + index, { result: "correct" }),
      ),
    ];
    const practiceState = {
      ...createWeakPracticeState(),
      themes: {
        [createMidCategoryKey(target[0])]: {
          categoryKey: createMidCategoryKey(target[0]),
          practicedAt: "2026-05-10T00:00:00.000Z",
          questionIds: target.slice(0, 5).map((question) => question.id),
          observing: true,
        },
      },
    };

    const observing = analyzeMidCategoryWeakness(questions, initialEntries, {
      practiceState,
    });
    expect(observing.rows).toEqual([]);
    expect(observing.watchRows.map((row) => row.minorCategory)).toContain("神経眼科");

    const reentered = analyzeMidCategoryWeakness(
      questions,
      [
        ...initialEntries,
        ...target.slice(5).map((question, index) =>
          entry(question, 15 + index, { result: "incorrect" }),
        ),
      ],
      { practiceState },
    );
    expect(reentered.rows.map((row) => row.minorCategory)).toContain("神経眼科");
  });

  it("直前に扱ったテーマ以外を優先してローテーションする", () => {
    const first = weaknessRow("眼科疾患・神経眼科", "神経眼科");
    const second = weaknessRow("視野・電気生理・色覚", "視野検査・機器");

    expect(
      pickRotatedWeaknessRow([first, second], first.categoryKey)?.categoryKey,
    ).toBe(second.categoryKey);
  });
});

function weaknessRow(majorCategory: string, minorCategory: string) {
  return {
    categoryKey: `${majorCategory}\u0000${minorCategory}`,
    majorCategory,
    minorCategory,
    status: "weak" as const,
    judged: 5,
    correct: 2,
    incorrect: 3,
    accuracy: 40,
    highConfidenceMisses: 0,
    slowAnswers: 0,
    slowMisses: 0,
    repeatedMisses: 0,
    latestHighConfidenceMissQuestionIds: [],
  };
}

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
