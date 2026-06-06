import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { FIELDS } from "@/lib/questions";
import {
  hasDiagnosticBaseline,
  shouldBypassInitialDiagnosticDailyLimit,
} from "./diagnostic";

function entry(field: string, index: number): AnswerHistoryEntry {
  return {
    id: `${field}-${index}`,
    answeredAt: `2026-05-08T00:${String(index).padStart(2, "0")}:00.000Z`,
    result: "correct",
    selectedAnswers: ["1"],
    round: 56,
    session: "pm",
    displayNumber: index,
    majorCategory: field,
  };
}

describe("diagnostic", () => {
  it("9分野それぞれ3問以上の判定済み履歴があれば診断相当とみなす", () => {
    const entries = FIELDS.flatMap((field) => [0, 1, 2].map((i) => entry(field, i)));
    expect(hasDiagnosticBaseline(entries)).toBe(true);
  });

  it("1分野でも3問未満なら診断相当とはみなさない", () => {
    const entries = FIELDS.flatMap((field, fieldIndex) =>
      [0, 1, 2]
        .slice(fieldIndex === 0 ? 1 : 0)
        .map((i) => entry(field, i)),
    );
    expect(hasDiagnosticBaseline(entries)).toBe(false);
  });

  it("初回診断中 started 状態でも完了までは日次制限をバイパスする", () => {
    expect(shouldBypassInitialDiagnosticDailyLimit("started", [])).toBe(true);
    expect(shouldBypassInitialDiagnosticDailyLimit("skipped", [])).toBe(true);
    expect(shouldBypassInitialDiagnosticDailyLimit(null, [])).toBe(true);
  });

  it("診断完了後または診断相当の履歴がある場合は日次制限をバイパスしない", () => {
    const baselineEntries = FIELDS.flatMap((field) =>
      [0, 1, 2].map((i) => entry(field, i)),
    );

    expect(shouldBypassInitialDiagnosticDailyLimit("completed", [])).toBe(false);
    expect(
      shouldBypassInitialDiagnosticDailyLimit("started", baselineEntries),
    ).toBe(false);
  });
});
