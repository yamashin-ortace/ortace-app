import { describe, expect, it } from "vitest";
import {
  LOW_PLAN_DAILY_LIMIT,
  canConsumeQuestion,
  getDailyLimitForPlan,
  getDailyLimitRemaining,
  getTokyoDateString,
  incrementDailyLimitRecord,
  isDailyLimitReached,
  normalizeDailyLimitRecord,
  parseDailyLimitRecord,
  serializeDailyLimitRecord,
} from ".";

describe("daily-limit", () => {
  it("Asia/Tokyo 基準の日付を返す", () => {
    expect(getTokyoDateString(new Date("2026-05-07T14:59:59Z"))).toBe(
      "2026-05-07",
    );
    expect(getTokyoDateString(new Date("2026-05-07T15:00:00Z"))).toBe(
      "2026-05-08",
    );
  });

  it("当日の保存値を正規化する", () => {
    expect(
      normalizeDailyLimitRecord({ date: "2026-05-08", count: 5 }, "2026-05-08"),
    ).toEqual({ date: "2026-05-08", count: 5 });
  });

  it("日付が変わった保存値は0問にリセットする", () => {
    expect(
      normalizeDailyLimitRecord({ date: "2026-05-07", count: 20 }, "2026-05-08"),
    ).toEqual({ date: "2026-05-08", count: 0 });
  });

  it("壊れた保存値や範囲外の count を安全に扱う", () => {
    expect(parseDailyLimitRecord("{invalid", "2026-05-08")).toEqual({
      date: "2026-05-08",
      count: 0,
    });
    expect(
      normalizeDailyLimitRecord({ date: "2026-05-08", count: 999 }, "2026-05-08"),
    ).toEqual({ date: "2026-05-08", count: LOW_PLAN_DAILY_LIMIT });
    expect(
      normalizeDailyLimitRecord({ date: "2026-05-08", count: -2 }, "2026-05-08"),
    ).toEqual({ date: "2026-05-08", count: 0 });
  });

  it("旧形の used も読み取れる", () => {
    expect(
      normalizeDailyLimitRecord({ date: "2026-05-08", used: 7 }, "2026-05-08"),
    ).toEqual({ date: "2026-05-08", count: 7 });
  });

  it("無料プランは1問消費しても20問を超えない", () => {
    expect(
      incrementDailyLimitRecord({ date: "2026-05-08", count: 19 }),
    ).toEqual({ date: "2026-05-08", count: 20 });
    expect(
      incrementDailyLimitRecord({ date: "2026-05-08", count: 20 }),
    ).toEqual({ date: "2026-05-08", count: 20 });
  });

  it("基礎定着パスは100問まで判定する", () => {
    expect(getDailyLimitForPlan("low")).toBe(100);
    expect(getDailyLimitRemaining({ date: "2026-05-08", count: 99 }, "low")).toBe(
      1,
    );
    expect(
      incrementDailyLimitRecord({ date: "2026-05-08", count: 99 }, "2026-05-08", "low"),
    ).toEqual({ date: "2026-05-08", count: 100 });
    expect(isDailyLimitReached({ date: "2026-05-08", count: 100 }, "low")).toBe(
      true,
    );
  });

  it("無料プラン・基礎定着パスだけ上限判定し、国試対策パックは無制限にする", () => {
    const reached = { date: "2026-05-08", count: 20 };
    expect(getDailyLimitRemaining(reached)).toBe(0);
    expect(isDailyLimitReached(reached, "free")).toBe(true);
    expect(canConsumeQuestion(reached, "free")).toBe(false);
    expect(isDailyLimitReached(reached, "low")).toBe(false);
    expect(canConsumeQuestion(reached, "exam")).toBe(true);
  });

  it("保存形式は date と count に統一する", () => {
    expect(
      serializeDailyLimitRecord({ date: "2026-05-08", count: 3 }),
    ).toBe('{"date":"2026-05-08","count":3}');
  });
});
