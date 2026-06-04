import type {
  AnswerHistoryRow,
  ProfilesRow,
} from "@/lib/supabase/database.types";
import { countLearningDaysFromAnsweredAts } from "@/lib/support-claim/learning-days";

export const SUPPORT_CLAIM_REQUIRED_LEARNING_DAYS = 20;
export const SUPPORT_CLAIM_LEARNING_WINDOW_DAYS = 90;

export type SupportClaimEligibility = {
  eligible: boolean;
  reasons: string[];
  examYear: number;
  learningDays: number;
  requiredLearningDays: number;
  deadlineLabel: string;
};

type EvaluateParams = {
  profile: ProfilesRow | null;
  learningDays: number;
  hasPendingClaim: boolean;
  now?: Date;
  deadline?: string | null;
};

export function evaluateSupportClaimEligibility({
  profile,
  learningDays,
  hasPendingClaim,
  now = new Date(),
  deadline = process.env.SUPPORT_CLAIM_DEADLINE ?? null,
}: EvaluateParams): SupportClaimEligibility {
  const reasons: string[] = [];
  const deadlineState = getSupportClaimDeadlineState(now, deadline);

  if (!profile) {
    reasons.push("プロフィールが見つかりません。");
  } else {
    if (!hasExamPlanPurchase(profile)) {
      reasons.push("国試対策パックの購入履歴が確認できません。");
    }
    if (profile.support_claim_used_at) {
      reasons.push("合格サポート保証は1人1回までです。");
    }
  }

  if (hasPendingClaim) {
    reasons.push("確認待ちの申請があります。");
  }
  if (learningDays < SUPPORT_CLAIM_REQUIRED_LEARNING_DAYS) {
    reasons.push(
      `直近3ヶ月の学習日数が${SUPPORT_CLAIM_REQUIRED_LEARNING_DAYS}日に届いていません。`,
    );
  }
  if (!deadlineState.isOpen) {
    reasons.push(deadlineState.reason);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    examYear: inferSupportClaimExamYear(profile, now),
    learningDays,
    requiredLearningDays: SUPPORT_CLAIM_REQUIRED_LEARNING_DAYS,
    deadlineLabel: deadlineState.label,
  };
}

export function hasExamPlanPurchase(profile: ProfilesRow): boolean {
  return profile.plan === "exam";
}

export function getLearningWindowStart(
  now = new Date(),
  windowDays = SUPPORT_CLAIM_LEARNING_WINDOW_DAYS,
): Date {
  const start = new Date(now.getTime());
  start.setDate(start.getDate() - windowDays);
  return start;
}

export function countLearningDays(
  rows: readonly Pick<AnswerHistoryRow, "answered_at">[],
  now = new Date(),
  windowDays = SUPPORT_CLAIM_LEARNING_WINDOW_DAYS,
): number {
  return countLearningDaysFromAnsweredAts(
    rows.map((row) => row.answered_at),
    now,
    windowDays,
  );
}

export function calculateSupportClaimExtensionEndsAt(
  now = new Date(),
): string {
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(Date.UTC(year, 2, 31, 14, 59, 59, 999)).toISOString();
}

export function inferSupportClaimExamYear(
  profile: ProfilesRow | null,
  now = new Date(),
): number {
  if (profile?.plan_expires_at) {
    const expiresAt = new Date(profile.plan_expires_at);
    if (Number.isFinite(expiresAt.getTime())) return expiresAt.getFullYear();
  }
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function getSupportClaimDeadlineState(
  now: Date,
  deadline: string | null,
): { isOpen: boolean; label: string; reason: string } {
  if (!deadline) {
    return {
      isOpen: false,
      label: "受付開始前",
      reason: "合格発表後に受付を開始します。",
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return {
      isOpen: false,
      label: "申請期限の設定が不正です",
      reason: "申請期限の設定が不正です。",
    };
  }
  const end = new Date(`${deadline}T23:59:59.999+09:00`);
  if (!Number.isFinite(end.getTime())) {
    return {
      isOpen: false,
      label: "申請期限の設定が不正です",
      reason: "申請期限の設定が不正です。",
    };
  }
  const label = `${deadline} 23:59まで`;
  const isOpen = now.getTime() <= end.getTime();
  return {
    isOpen,
    label,
    reason: isOpen ? "" : "申請期限を過ぎています。",
  };
}
