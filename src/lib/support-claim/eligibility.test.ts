import { describe, expect, it } from "vitest";
import type { AnswerHistoryRow, ProfilesRow } from "@/lib/supabase/database.types";
import {
  calculateSupportClaimExtensionEndsAt,
  countLearningDays,
  evaluateSupportClaimEligibility,
} from "./eligibility";

describe("support-claim eligibility", () => {
  it("直近3ヶ月の学習日をAsia/Tokyo基準で重複なしに数える", () => {
    const now = new Date("2026-05-25T12:00:00+09:00");
    const rows = [
      answer("2026-05-01T00:30:00+09:00"),
      answer("2026-05-01T22:00:00+09:00"),
      answer("2026-05-02T08:00:00+09:00"),
      answer("2026-01-01T08:00:00+09:00"),
    ];

    expect(countLearningDays(rows, now)).toBe(2);
  });

  it("条件を満たす国試対策パック購入者を対象にする", () => {
    const eligibility = evaluateSupportClaimEligibility({
      profile: profile(),
      learningDays: 20,
      hasPendingClaim: false,
      now: new Date("2026-05-25T12:00:00+09:00"),
      deadline: "2026-05-31",
    });

    expect(eligibility.eligible).toBe(true);
    expect(eligibility.reasons).toEqual([]);
  });

  it("購入履歴、学習日数、期限、利用済みを対象外理由にする", () => {
    const eligibility = evaluateSupportClaimEligibility({
      profile: profile({ plan: "low", support_claim_used_at: "2026-04-01T00:00:00.000Z" }),
      learningDays: 10,
      hasPendingClaim: true,
      now: new Date("2026-06-01T12:00:00+09:00"),
      deadline: "2026-05-31",
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons).toEqual([
      "国試対策パックの購入履歴が確認できません。",
      "合格サポート保証は1人1回までです。",
      "確認待ちの申請があります。",
      "直近3ヶ月の学習日数が20日に届いていません。",
      "申請期限を過ぎています。",
    ]);
  });

  it("申請期限が未設定なら受付開始前にする", () => {
    const eligibility = evaluateSupportClaimEligibility({
      profile: profile(),
      learningDays: 20,
      hasPendingClaim: false,
      now: new Date("2026-03-01T12:00:00+09:00"),
      deadline: null,
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.deadlineLabel).toBe("受付開始前");
    expect(eligibility.reasons).toEqual([
      "合格発表後に受付を開始します。",
    ]);
  });

  it("承認時の延長期限は翌年3月31日末にする", () => {
    expect(
      calculateSupportClaimExtensionEndsAt(
        new Date("2026-05-25T12:00:00+09:00"),
      ),
    ).toBe("2027-03-31T14:59:59.999Z");
  });
});

function profile(overrides: Partial<ProfilesRow> = {}): ProfilesRow {
  return {
    id: "user-1",
    nickname: "やましん",
    grade: "受験生",
    goal: "本番対策",
    exam_timing: null,
    plan: "exam",
    plan_status: "active",
    plan_expires_at: "2026-03-31T14:59:59.999Z",
    stripe_customer_id: "cus_test",
    stripe_checkout_session_id: "cs_test",
    stripe_payment_intent_id: "pi_test",
    stripe_subscription_id: null,
    stripe_subscription_status: null,
    stripe_subscription_cancel_at: null,
    stripe_first_invoice_paid_at: null,
    plan_updated_at: "2026-01-01T00:00:00.000Z",
    trial_started_at: null,
    trial_ends_at: null,
    trial_used_at: null,
    trial_plan: null,
    support_claim_used_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function answer(answeredAt: string): Pick<AnswerHistoryRow, "answered_at"> {
  return { answered_at: new Date(answeredAt).toISOString() };
}
