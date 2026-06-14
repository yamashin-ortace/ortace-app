import { describe, expect, it } from "vitest";
import { getSupportClaimEligibilityLearningDays } from "./submit";

describe("getSupportClaimEligibilityLearningDays", () => {
  it("uses only database learning days for enforceable eligibility", () => {
    expect(
      getSupportClaimEligibilityLearningDays({
        databaseLearningDays: 3,
        clientLearningDays: 20,
      }),
    ).toBe(3);
  });
});
