import { describe, expect, it } from "vitest";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { buildHomeAiCoachComment } from "./home-comment";

const NOW = new Date("2026-05-15T12:00:00+09:00");

describe("buildHomeAiCoachComment", () => {
  it("履歴がなければオンボーディング文言", () => {
    const result = buildHomeAiCoachComment([], NOW);
    expect(result.kind).toBe("onboarding");
    expect(result.message).toContain("AIコーチ");
  });

  it("30問未満は『あと◯問』のデータ収集中", () => {
    const entries = Array.from({ length: 12 }, (_, i) =>
      entry({ id: `47-${i + 1}`, answeredAt: daysAgo(NOW, 1) }),
    );
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("collecting");
    expect(result.message).toContain("18問");
  });

  it("直近1週間で自信あり誤答が3問以上なら思い込みチェック導線", () => {
    const entries = [
      ...thirtyAnsweredAt(NOW, 10),
      entry({ id: "55-1", result: "incorrect", confidence: "high", answeredAt: daysAgo(NOW, 2) }),
      entry({ id: "55-2", result: "incorrect", confidence: "high", answeredAt: daysAgo(NOW, 3) }),
      entry({ id: "55-3", result: "incorrect", confidence: "high", answeredAt: daysAgo(NOW, 4) }),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("high_confidence_miss");
    expect(result.cta?.href).toBe("/study/misconception");
    expect(result.message).toContain("3問");
  });

  it("直近1週間で急ぎ誤答が3問以上なら fast_miss", () => {
    const entries = [
      ...thirtyAnsweredAt(NOW, 10),
      entry({
        id: "55-10",
        result: "incorrect",
        confidence: "guess",
        durationMs: 8_000,
        answeredAt: daysAgo(NOW, 1),
      }),
      entry({
        id: "55-11",
        result: "incorrect",
        confidence: "guess",
        durationMs: 9_000,
        answeredAt: daysAgo(NOW, 2),
      }),
      entry({
        id: "55-12",
        result: "incorrect",
        confidence: "guess",
        durationMs: 11_000,
        answeredAt: daysAgo(NOW, 3),
      }),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("fast_miss");
    expect(result.message).toContain("急ぎ気味");
  });

  it("直近正答率が前週より上がっていれば accuracy_up", () => {
    const entries = [
      // 先週（7-14日前）正答率 50%
      ...accuracyBatch(NOW, 10, 0.5, 10),
      // 直近（0-7日前）正答率 80%
      ...accuracyBatch(NOW, 3, 0.8, 20),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("accuracy_up");
  });

  it("直近正答率が前週より下がっていれば accuracy_down と弱点リペア導線", () => {
    const entries = [
      ...accuracyBatch(NOW, 10, 0.85, 10),
      ...accuracyBatch(NOW, 3, 0.5, 20),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("accuracy_down");
    expect(result.cta?.href).toBe("/study/weak");
  });

  it("弱点クラスタが渡されると cluster_focus で具体テーマ名を入れる", () => {
    const lookup = {
      byId: new Map(
        Array.from({ length: 30 }, (_, i) => [
          `47-${i + 1}`,
          { id: "neuro-ophthalmology", label: "神経眼科" },
        ]),
      ),
    };
    const entries = Array.from({ length: 30 }, (_, i) =>
      entry({
        id: `47-${i + 1}`,
        answeredAt: daysAgo(NOW, 5 + (i % 5)),
        result: i < 18 ? "incorrect" : "correct",
      }),
    );

    const result = buildHomeAiCoachComment(entries, NOW, {
      clusterLookup: lookup,
    });
    expect(result.kind).toBe("cluster_focus");
    expect(result.message).toContain("神経眼科");
    expect(result.message).toContain("%");
  });

  it("4象限で『時間をかけたのに誤答』が3問以上なら quadrant_focus", () => {
    // 直近・前週とも 80% 正答率にして accuracy_up/down を回避し、じっくり誤答3問を直近に置く
    // 直近・前週とも 正解多めの構成にする
    const recent = Array.from({ length: 20 }, (_, i) =>
      entry({
        id: `55-r${i}`,
        result: "correct",
        durationMs: 30_000,
        answeredAt: daysAgo(NOW, (i % 7) + 1),
      }),
    );
    const previous = Array.from({ length: 20 }, (_, i) =>
      entry({
        id: `55-p${i}`,
        result: i < 17 ? "correct" : "incorrect",
        durationMs: 30_000,
        answeredAt: daysAgo(NOW, 7 + (i % 7) + 1),
      }),
    );
    const entries = [
      ...previous,
      ...recent,
      entry({
        id: "55-d1",
        result: "incorrect",
        durationMs: 80_000,
        answeredAt: daysAgo(NOW, 1),
      }),
      entry({
        id: "55-d2",
        result: "incorrect",
        durationMs: 90_000,
        answeredAt: daysAgo(NOW, 2),
      }),
      entry({
        id: "55-d3",
        result: "incorrect",
        durationMs: 75_000,
        answeredAt: daysAgo(NOW, 3),
      }),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("quadrant_focus");
    expect(result.message).toContain("時間をかけた");
  });

  it("3日連続学習なら streak_steady", () => {
    const entries = [
      ...thirtyAnsweredAt(NOW, 5),
      entry({ id: "55-30", answeredAt: daysAgo(NOW, 0) }),
      entry({ id: "55-31", answeredAt: daysAgo(NOW, 1) }),
      entry({ id: "55-32", answeredAt: daysAgo(NOW, 2) }),
      entry({ id: "55-33", answeredAt: daysAgo(NOW, 3) }),
    ];
    const result = buildHomeAiCoachComment(entries, NOW);
    expect(result.kind).toBe("streak_steady");
    expect(result.message).toContain("4日連続");
  });
});

function thirtyAnsweredAt(now: Date, daysBack: number): AnswerHistoryEntry[] {
  return Array.from({ length: 30 }, (_, i) =>
    entry({ id: `47-${i + 1}`, answeredAt: daysAgo(now, daysBack + (i % 5)) }),
  );
}

function accuracyBatch(
  now: Date,
  daysAgoOffset: number,
  correctRatio: number,
  total: number,
): AnswerHistoryEntry[] {
  return Array.from({ length: total }, (_, i) =>
    entry({
      id: `r${daysAgoOffset}-${i}`,
      answeredAt: daysAgo(now, daysAgoOffset),
      result: i / total < correctRatio ? "correct" : "incorrect",
    }),
  );
}

function daysAgo(now: Date, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function entry(overrides: Partial<AnswerHistoryEntry> & { id: string }): AnswerHistoryEntry {
  return {
    id: overrides.id,
    answeredAt: overrides.answeredAt ?? new Date().toISOString(),
    result: overrides.result ?? "correct",
    selectedAnswers: ["1"],
    round: 55,
    session: "am",
    displayNumber: 1,
    majorCategory: "視能検査・検査機器",
    confidence: overrides.confidence ?? null,
    durationMs: overrides.durationMs ?? null,
  };
}
