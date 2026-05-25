import { describe, expect, it } from "vitest";
import { FIELDS, type Field } from "@/lib/questions";
import {
  calculateEstimatedScore,
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
