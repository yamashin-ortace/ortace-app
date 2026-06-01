import { describe, expect, it } from "vitest";
import {
  createWeakPracticeState,
  getCoolingQuestionIds,
  recordWeakPracticeSession,
} from "./practice-state";

describe("weak practice state", () => {
  it("3問以上で正答率80%以上なら経過観察にする", () => {
    const state = recordWeakPracticeSession(createWeakPracticeState(), {
      categoryKey: "field\u0000theme",
      questionIds: ["q1", "q2", "q3", "q4", "q5"],
      correctCount: 4,
      now: new Date("2026-05-10T00:00:00.000Z"),
    });

    expect(state.lastPracticedCategoryKey).toBe("field\u0000theme");
    expect(state.themes["field\u0000theme"].observing).toBe(true);
  });

  it("直前に解いた問題は3日間クールダウンする", () => {
    const state = recordWeakPracticeSession(createWeakPracticeState(), {
      categoryKey: "field\u0000theme",
      questionIds: ["q1", "q2"],
      correctCount: 0,
      now: new Date("2026-05-10T00:00:00.000Z"),
    });

    expect(
      [...getCoolingQuestionIds(
        state,
        "field\u0000theme",
        new Date("2026-05-12T23:59:59.999Z"),
      )],
    ).toEqual(["q1", "q2"]);
    expect(
      getCoolingQuestionIds(
        state,
        "field\u0000theme",
        new Date("2026-05-13T00:00:00.000Z"),
      ).size,
    ).toBe(0);
  });
});
