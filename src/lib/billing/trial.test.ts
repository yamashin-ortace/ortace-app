import { describe, expect, it } from "vitest";
import {
  calculateTrialEndsAt,
  getTrialAuthProvider,
  getTrialRemainingDays,
  getTrialState,
  isTrialEligibleAuthProvider,
} from "./trial";

const freeProfile = {
  plan: "free",
  plan_status: "active",
  plan_expires_at: null,
  trial_started_at: null,
  trial_ends_at: null,
  trial_used_at: null,
} as const;

describe("billing trial", () => {
  it("14日後をトライアル終了日時にする", () => {
    expect(calculateTrialEndsAt(new Date("2026-05-09T00:00:00.000Z"))).toBe(
      "2026-05-23T00:00:00.000Z",
    );
  });

  it("残日数は切り上げで返す", () => {
    expect(
      getTrialRemainingDays(
        "2026-05-23T00:00:00.000Z",
        new Date("2026-05-22T12:00:00.000Z"),
      ),
    ).toBe(1);
  });

  it("未使用の無料ユーザーはトライアル開始可能にする", () => {
    const state = getTrialState(freeProfile, new Date("2026-05-09T00:00:00.000Z"));
    expect(state.canStartBase).toBe(true);
    expect(state.canStart).toBe(true);
  });

  it("使用済みユーザーは再開始できない", () => {
    const state = getTrialState(
      {
        ...freeProfile,
        trial_started_at: "2026-05-01T00:00:00.000Z",
        trial_ends_at: "2026-05-15T00:00:00.000Z",
        trial_used_at: "2026-05-01T00:00:00.000Z",
      },
      new Date("2026-05-16T00:00:00.000Z"),
    );

    expect(state.hasEnded).toBe(true);
    expect(state.canStart).toBe(false);
  });

  it("GoogleとLINEだけをトライアル対象認証にする", () => {
    expect(isTrialEligibleAuthProvider("google")).toBe(true);
    expect(isTrialEligibleAuthProvider("line")).toBe(true);
    expect(isTrialEligibleAuthProvider("email")).toBe(false);
  });

  it("Supabaseのユーザー情報から認証プロバイダーを読む", () => {
    expect(
      getTrialAuthProvider({
        app_metadata: { provider: "email", providers: ["email", "google"] },
        identities: [],
      }),
    ).toBe("google");
    expect(
      getTrialAuthProvider({
        app_metadata: { provider: "custom:line" },
        identities: [],
      }),
    ).toBe("line");
  });
});
