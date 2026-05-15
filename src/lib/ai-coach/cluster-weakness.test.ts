import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import {
  analyzeClusterWeakness,
  type QuestionClusterLookup,
} from "./cluster-weakness";

describe("analyzeClusterWeakness", () => {
  it("正答率昇順にクラスタを返す", () => {
    const lookup = buildLookup({
      "47-1": cluster("a", "視野"),
      "47-2": cluster("a", "視野"),
      "47-3": cluster("a", "視野"),
      "47-4": cluster("a", "視野"),
      "47-10": cluster("b", "緑内障"),
      "47-11": cluster("b", "緑内障"),
      "47-12": cluster("b", "緑内障"),
    });
    const entries = [
      entry("47-1", "incorrect"),
      entry("47-2", "incorrect"),
      entry("47-3", "incorrect"),
      entry("47-4", "correct"),
      entry("47-10", "correct"),
      entry("47-11", "correct"),
      entry("47-12", "incorrect"),
    ];
    const rows = analyzeClusterWeakness(entries, lookup);
    expect(rows[0].clusterId).toBe("a"); // 25%
    expect(rows[1].clusterId).toBe("b"); // 67%
  });

  it("判定数が minJudged 未満なら除外", () => {
    const lookup = buildLookup({
      "47-1": cluster("a", "視野"),
      "47-2": cluster("a", "視野"),
      "47-3": cluster("b", "緑内障"),
      "47-4": cluster("b", "緑内障"),
      "47-5": cluster("b", "緑内障"),
    });
    const entries = [
      entry("47-1", "incorrect"),
      entry("47-2", "incorrect"),
      entry("47-3", "correct"),
      entry("47-4", "incorrect"),
      entry("47-5", "incorrect"),
    ];
    const rows = analyzeClusterWeakness(entries, lookup, { minJudged: 3 });
    expect(rows.map((r) => r.clusterId)).toEqual(["b"]);
  });

  it("無回答は判定数に含めない", () => {
    const lookup = buildLookup({
      "47-1": cluster("a", "視野"),
      "47-2": cluster("a", "視野"),
      "47-3": cluster("a", "視野"),
      "47-4": cluster("a", "視野"),
    });
    const entries = [
      entry("47-1", "no_answer"),
      entry("47-2", "correct"),
      entry("47-3", "correct"),
      entry("47-4", "incorrect"),
    ];
    const rows = analyzeClusterWeakness(entries, lookup);
    expect(rows[0].judged).toBe(3);
  });
});

function cluster(id: string, label: string) {
  return { id, label };
}

function buildLookup(
  map: Record<string, { id: string; label: string }>,
): QuestionClusterLookup {
  return { byId: new Map(Object.entries(map)) };
}

function entry(
  id: string,
  result: AnswerHistoryEntry["result"],
): AnswerHistoryEntry {
  return {
    id,
    answeredAt: "2026-05-13T00:00:00.000Z",
    result,
    selectedAnswers: ["1"],
    round: 47,
    session: "am",
    displayNumber: 1,
    majorCategory: "視能検査・検査機器",
    confidence: null,
    durationMs: null,
  };
}
