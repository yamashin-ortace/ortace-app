import { describe, expect, it } from "vitest";
import { calculatePlanExpiresAt, getEffectivePlan } from "./plans";

describe("billing plans", () => {
  it("期限内の有料プランだけ有効扱いにする", () => {
    expect(
      getEffectivePlan({
        plan: "low",
        status: "active",
        expiresAt: "2026-05-10T00:00:00.000Z",
        now: new Date("2026-05-09T00:00:00.000Z"),
      }),
    ).toBe("low");
    expect(
      getEffectivePlan({
        plan: "exam",
        status: "expired",
        expiresAt: "2026-05-10T00:00:00.000Z",
        now: new Date("2026-05-09T00:00:00.000Z"),
      }),
    ).toBe("free");
    expect(
      getEffectivePlan({
        plan: "exam",
        status: "active",
        expiresAt: "2026-05-08T00:00:00.000Z",
        now: new Date("2026-05-09T00:00:00.000Z"),
      }),
    ).toBe("free");
  });

  it("有効なトライアル中は基礎定着パス相当にする", () => {
    expect(
      getEffectivePlan({
        plan: "free",
        status: "active",
        expiresAt: null,
        trialEndsAt: "2026-05-23T00:00:00.000Z",
        trialUsedAt: "2026-05-09T00:00:00.000Z",
        now: new Date("2026-05-10T00:00:00.000Z"),
      }),
    ).toBe("low");
  });

  it("基礎定着パスは購入日から1年にする", () => {
    expect(calculatePlanExpiresAt("low", new Date("2026-05-09T12:00:00.000Z"))).toBe(
      "2027-05-09T12:00:00.000Z",
    );
  });

  it("国試対策パックは受験年度の3月31日までにする", () => {
    expect(calculatePlanExpiresAt("exam", new Date("2026-05-09T12:00:00.000Z"))).toBe(
      "2027-03-31T14:59:59.999Z",
    );
    expect(calculatePlanExpiresAt("exam", new Date("2027-03-01T12:00:00.000Z"))).toBe(
      "2027-03-31T14:59:59.999Z",
    );
    expect(calculatePlanExpiresAt("exam", new Date("2027-04-01T00:00:00.000Z"))).toBe(
      "2028-03-31T14:59:59.999Z",
    );
  });
});
