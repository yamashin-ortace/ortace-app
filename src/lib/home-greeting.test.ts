import { describe, expect, it } from "vitest";
import { GREETING_POOLS, getTimeSlotFromHour } from "./home-greeting-messages";
import {
  getDateKeyForTests,
  getHomeGreetingLines,
  hashSeedToUint32,
  pickFirstVisitGreeting,
  pickPooledGreeting,
} from "./home-greeting";

describe("getTimeSlotFromHour", () => {
  it("wee_hours は 0–4", () => {
    for (const h of [0, 1, 2, 3, 4]) {
      expect(getTimeSlotFromHour(h)).toBe("wee_hours");
    }
  });
  it("morning は 5–10", () => {
    for (const h of [5, 6, 7, 8, 9, 10]) {
      expect(getTimeSlotFromHour(h)).toBe("morning");
    }
  });
  it("day は 11–15", () => {
    for (const h of [11, 12, 13, 14, 15]) {
      expect(getTimeSlotFromHour(h)).toBe("day");
    }
  });
  it("twilight は 16–18", () => {
    for (const h of [16, 17, 18]) {
      expect(getTimeSlotFromHour(h)).toBe("twilight");
    }
  });
  it("evening は 19–21", () => {
    for (const h of [19, 20, 21]) {
      expect(getTimeSlotFromHour(h)).toBe("evening");
    }
  });
  it("night は 22–23", () => {
    for (const h of [22, 23]) {
      expect(getTimeSlotFromHour(h)).toBe("night");
    }
  });
});

describe("hashSeedToUint32", () => {
  it("同じシードは同じ値", () => {
    const a = hashSeedToUint32("2026-04-25|day");
    const b = hashSeedToUint32("2026-04-25|day");
    expect(a).toBe(b);
  });
  it("異なるシードは衝突しにくい（この例では異なる）", () => {
    const a = hashSeedToUint32("2026-04-25|day");
    const b = hashSeedToUint32("2026-04-25|morning");
    expect(a).not.toBe(b);
  });
});

describe("pickPooledGreeting", () => {
  it("同じ日・同じスロットでは同一メッセージ", () => {
    const t1 = new Date(2026, 3, 25, 14, 0, 0);
    const t2 = new Date(2026, 3, 25, 15, 30, 0);
    const a = pickPooledGreeting(t1, "day");
    const b = pickPooledGreeting(t2, "day");
    expect(a.eyebrow).toBe(b.eyebrow);
    expect(a.headline).toBe(b.headline);
  });
  it("各スロットのプールは空でない", () => {
    for (const slot of ["wee_hours", "morning", "day", "twilight", "evening", "night"] as const) {
      expect(GREETING_POOLS[slot].length).toBeGreaterThan(0);
    }
  });
});

describe("getHomeGreetingLines", () => {
  it("再訪者: 同日内で時刻帯に応じたプール", () => {
    const t = new Date(2026, 5, 1, 10, 0, 0);
    const g = getHomeGreetingLines(t, true);
    const expected = pickPooledGreeting(t, "morning");
    expect(g.eyebrow).toBe(expected.eyebrow);
    expect(g.headline).toBe(expected.headline);
  });
  it("初回: first プール", () => {
    const t = new Date(2026, 5, 1, 10, 0, 0);
    const g = getHomeGreetingLines(t, false);
    const f = pickFirstVisitGreeting(t);
    expect(g.eyebrow).toBe(f.eyebrow);
    expect(g.headline).toBe(f.headline);
  });
});

describe("getDateKeyForTests", () => {
  it("ローカル日付 YYYY-MM-DD", () => {
    const d = new Date(2026, 0, 5, 23, 0, 0);
    expect(getDateKeyForTests(d)).toBe("2026-01-05");
  });
});
