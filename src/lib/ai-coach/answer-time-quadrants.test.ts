import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { analyzeAnswerTimeQuadrants } from "./answer-time-quadrants";

describe("analyzeAnswerTimeQuadrants", () => {
  it("正誤×解答時間の組み合わせをそれぞれ集計する", () => {
    const entries: AnswerHistoryEntry[] = [
      entry({ id: "1", result: "correct", durationMs: 8_000 }),
      entry({ id: "2", result: "correct", durationMs: 90_000 }),
      entry({ id: "3", result: "incorrect", durationMs: 9_000 }),
      entry({ id: "4", result: "incorrect", durationMs: 75_000 }),
    ];
    const result = analyzeAnswerTimeQuadrants(entries);
    const map = new Map(result.quadrants.map((q) => [q.id, q.count]));
    expect(map.get("correct-fast")).toBe(1);
    expect(map.get("correct-deliberate")).toBe(1);
    expect(map.get("incorrect-fast")).toBe(1);
    expect(map.get("incorrect-deliberate")).toBe(1);
  });

  it("標準時間は standardCount に、無回答は noAnswerCount に分ける", () => {
    const entries: AnswerHistoryEntry[] = [
      entry({ id: "1", result: "correct", durationMs: 30_000 }),
      entry({ id: "2", result: "incorrect", durationMs: 30_000 }),
      entry({ id: "3", result: "no_answer", durationMs: 5_000 }),
    ];
    const result = analyzeAnswerTimeQuadrants(entries);
    expect(result.standardCount).toBe(2);
    expect(result.noAnswerCount).toBe(1);
    expect(result.quadrants.every((q) => q.count === 0)).toBe(true);
  });

  it("解答時間が未記録なら unknownCount に入れる", () => {
    const entries: AnswerHistoryEntry[] = [
      entry({ id: "1", result: "correct", durationMs: null }),
      entry({ id: "2", result: "incorrect" }),
    ];
    const result = analyzeAnswerTimeQuadrants(entries);
    expect(result.unknownCount).toBe(2);
  });
});

function entry(overrides: Partial<AnswerHistoryEntry> & { id: string }): AnswerHistoryEntry {
  return {
    id: overrides.id,
    answeredAt: "2026-05-13T00:00:00.000Z",
    result: overrides.result ?? "correct",
    selectedAnswers: ["1"],
    round: 55,
    session: "am",
    displayNumber: 1,
    majorCategory: "視能検査・検査機器",
    confidence: null,
    durationMs: overrides.durationMs ?? null,
  };
}
