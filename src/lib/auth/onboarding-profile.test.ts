import { describe, expect, it } from "vitest";
import {
  getExamTimingLabel,
  hasCompletedOnboarding,
  isExamTiming,
  isSelectableExamTiming,
} from "./onboarding-profile";

describe("onboarding profile", () => {
  it("新規利用者はニックネームと受験予定で完了になる", () => {
    expect(
      hasCompletedOnboarding({
        nickname: "ORT",
        exam_timing: "next_exam",
        grade: null,
        goal: null,
      }),
    ).toBe(true);
  });

  it("旧オンボーディング完了者はそのまま利用できる", () => {
    expect(
      hasCompletedOnboarding({
        nickname: "ORT",
        exam_timing: null,
        grade: "受験生",
        goal: "本番対策",
      }),
    ).toBe(true);
  });

  it("ニックネームだけでは完了にしない", () => {
    expect(
      hasCompletedOnboarding({
        nickname: "ORT",
        exam_timing: null,
        grade: null,
        goal: null,
      }),
    ).toBe(false);
  });

  it("受験予定の値と表示名を扱う", () => {
    expect(isExamTiming("later")).toBe(true);
    expect(isExamTiming("invalid")).toBe(false);
    expect(isSelectableExamTiming("next_exam")).toBe(true);
    expect(isSelectableExamTiming("undecided")).toBe(false);
    expect(getExamTimingLabel("undecided")).toBe("未定");
  });
});
