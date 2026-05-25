import { describe, expect, it } from "vitest";
import { FIELDS, type Field } from "@/lib/questions";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Question } from "@/lib/questions";
import {
  calculateEstimatedScore,
  getReviewQuestions,
  getTargetFieldJudgedForScore,
  MIN_TARGET_FIELD_JUDGED_FOR_SCORE,
  TARGET_FIELD_COVERAGE_RATE_FOR_SCORE,
  type FieldStat,
  TARGET_TOTAL_JUDGED_FOR_SCORE,
} from "./status";

describe("calculateEstimatedScore", () => {
  it("全分野3問満点でも、合格判定には使わず慎重補正する", () => {
    const estimated = calculateEstimatedScore(
      FIELDS.map((field) => fieldStat(field, 3, 3)),
    );

    expect(estimated.observedScore).toBe(150);
    expect(estimated.score).toBe(86);
    expect(estimated.readiness).toBe("provisional");
    expect(estimated.canJudgePassLine).toBe(false);
    expect(estimated.coverage).toBe(100);
    expect(estimated.readinessCoverage).toBe(0);
    expect(estimated.totalJudged).toBe(27);
    expect(estimated.readyFieldCount).toBe(0);
    expect(estimated.minimumFieldRemaining).toBe(0);
    expect(estimated.readyFieldRemaining).toBe(153);
    expect(estimated.totalRemaining).toBe(973);
    expect(estimated.nextStageRemaining).toBe(973);
    expect(estimated.fieldProgress).toHaveLength(FIELDS.length);
    expect(estimated.fieldProgress[0]).toMatchObject({
      field: FIELDS[0],
      judged: 3,
      minimumTargetJudged: 3,
      minimumRemaining: 0,
      targetJudged: 20,
      remaining: 17,
      ready: false,
    });
  });

  it("1000問と全分野の網羅目標に到達すると合格基準の判定対象にする", () => {
    const estimated = calculateEstimatedScore(
      FIELDS.map((field) => fieldStat(field, 120, 96, 150)),
    );

    expect(estimated.score).toBe(120);
    expect(estimated.readiness).toBe("ready");
    expect(estimated.canJudgePassLine).toBe(true);
    expect(estimated.readinessCoverage).toBe(100);
    expect(estimated.totalJudged).toBeGreaterThanOrEqual(
      TARGET_TOTAL_JUDGED_FOR_SCORE,
    );
    expect(estimated.readyFieldCount).toBe(FIELDS.length);
    expect(estimated.readyFieldRemaining).toBe(0);
    expect(estimated.totalRemaining).toBe(0);
    expect(estimated.nextStageRemaining).toBe(0);
    expect(estimated.fieldProgress[0]).toMatchObject({
      judged: 120,
      targetJudged: 105,
      remaining: 0,
      ready: true,
    });
  });

  it("未判定の分野がある場合は網羅不足として collecting にする", () => {
    const missingField = FIELDS[0];
    const estimated = calculateEstimatedScore(
      FIELDS.map((field) =>
        field === missingField ? fieldStat(field, 0, 0) : fieldStat(field, 10, 10),
      ),
    );

    expect(estimated.readiness).toBe("collecting");
    expect(estimated.canJudgePassLine).toBe(false);
    expect(estimated.insufficientFields).toEqual([missingField]);
    expect(estimated.scoredFieldCount).toBe(FIELDS.length - 1);
    expect(estimated.readyFieldCount).toBe(0);
    expect(estimated.minimumFieldRemaining).toBe(3);
    expect(estimated.readyFieldRemaining).toBe(100);
    expect(estimated.totalRemaining).toBe(920);
    expect(estimated.nextStageRemaining).toBe(3);
    expect(estimated.fieldProgress[0]).toMatchObject({
      field: missingField,
      judged: 0,
      minimumRemaining: 3,
      targetJudged: 20,
      remaining: 20,
      ready: false,
    });
    expect(estimated.targetTotalJudged).toBe(TARGET_TOTAL_JUDGED_FOR_SCORE);
    expect(estimated.targetFieldCoverageRate).toBe(
      TARGET_FIELD_COVERAGE_RATE_FOR_SCORE * 100,
    );
    expect(estimated.minTargetFieldJudged).toBe(
      MIN_TARGET_FIELD_JUDGED_FOR_SCORE,
    );
  });

  it("分野目標は収録数の70%を基本にし、少ない分野は収録数を上限にする", () => {
    expect(getTargetFieldJudgedForScore(293)).toBe(206);
    expect(getTargetFieldJudgedForScore(82)).toBe(60);
    expect(getTargetFieldJudgedForScore(20)).toBe(20);
  });
});

describe("getReviewQuestions", () => {
  it("復習対象を自信あり誤答、繰り返し誤答、通常誤答、迷いが残った正解の順に寄せる", () => {
    const questions = [
      question("56-1", 1),
      question("56-2", 2),
      question("56-3", 3),
      question("56-4", 4),
    ];
    const entries: AnswerHistoryEntry[] = [
      answerEntry("56-4", "correct", "2026-05-01T00:00:00.000Z", {
        confidence: "guess",
        nextReviewAt: "2026-05-03",
      }),
      answerEntry("56-3", "incorrect", "2026-05-02T00:00:00.000Z", {
        nextReviewAt: "2026-05-04",
      }),
      answerEntry("56-2", "incorrect", "2026-05-03T00:00:00.000Z", {
        nextReviewAt: "2026-05-04",
      }),
      answerEntry("56-2", "incorrect", "2026-04-28T00:00:00.000Z", {
        nextReviewAt: "2026-04-30",
      }),
      answerEntry("56-1", "incorrect", "2026-05-04T00:00:00.000Z", {
        confidence: "high",
        nextReviewAt: "2026-05-05",
      }),
    ];

    expect(
      getReviewQuestions(questions, entries, new Date("2026-05-06T00:00:00.000Z"))
        .map((q) => q.id),
    ).toEqual(["56-1", "56-2", "56-3", "56-4"]);
  });

  it("同じ優先度なら最新解答が新しい問題を先にする", () => {
    const questions = [
      question("56-1", 1),
      question("56-2", 2),
    ];
    const entries: AnswerHistoryEntry[] = [
      answerEntry("56-1", "incorrect", "2026-05-01T00:00:00.000Z", {
        nextReviewAt: "2026-05-03",
      }),
      answerEntry("56-2", "incorrect", "2026-05-02T00:00:00.000Z", {
        nextReviewAt: "2026-05-03",
      }),
    ];

    expect(
      getReviewQuestions(questions, entries, new Date("2026-05-03T00:00:00.000Z"))
        .map((q) => q.id),
    ).toEqual(["56-2", "56-1"]);
  });
});

function fieldStat(
  field: Field,
  judged: number,
  correct: number,
  total = 20,
): FieldStat {
  return {
    field,
    total,
    answered: judged,
    remaining: Math.max(0, total - judged),
    judged,
    correct,
    correctRate: Math.round((judged / total) * 100),
    accuracyRate: judged > 0 ? Math.round((correct / judged) * 100) : null,
  };
}

function question(id: string, displayNumber: number): Question {
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
  };
}

function answerEntry(
  id: string,
  result: AnswerHistoryEntry["result"],
  answeredAt: string,
  overrides: Partial<AnswerHistoryEntry> = {},
): AnswerHistoryEntry {
  return {
    id,
    answeredAt,
    result,
    selectedAnswers: result === "correct" ? ["1"] : ["2"],
    round: 56,
    session: "am",
    displayNumber: Number(id.split("-")[1] ?? 1),
    majorCategory: "視能検査・検査機器",
    confidence: null,
    durationMs: null,
    streak: result === "correct" ? 1 : 0,
    nextReviewAt: null,
    ...overrides,
  };
}
