import type {
  BillingPlan,
  BillingPlanStatus,
  ProfilesRow,
} from "@/lib/supabase/database.types";

export type PaidPlan = Exclude<BillingPlan, "free">;

export const PAID_PLANS: PaidPlan[] = ["low", "exam"];

/** 同じプランの中で選べる期間バリエーション（基礎定着パスのみ複数を持つ） */
export type PlanDuration = {
  id: string;
  months: number;
  label: string;
  priceLabel: string;
  /** 月あたりの単価表示（任意） */
  perMonthLabel?: string;
  priceEnvKey?: string;
  fallbackPriceId?: string;
};

export type PlanDefinition = {
  id: BillingPlan;
  name: string;
  description: string;
  checkoutLabel: string;
  dailyLimit: number | null;
  /** 単一期間プラン（無料・国試対策パック）の表示用ラベル */
  priceLabel?: string;
  periodLabel?: string;
  /** 単一期間プランの Stripe Price ID 解決 */
  priceEnvKey?: string;
  fallbackPriceId?: string;
  /** 複数期間プラン（基礎定着パス）の期間バリエーション */
  durations?: PlanDuration[];
  defaultDurationId?: string;
  featureLabels: string[];
  featureNote?: string;
};

export const PLAN_DEFINITIONS: Record<BillingPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "無料プラン",
    priceLabel: "¥0",
    periodLabel: "",
    description: "まずはORT ACEの学習感を試せます。",
    checkoutLabel: "無料で使う",
    dailyLimit: 20,
    featureLabels: [
      "過去問1,500問にアクセス",
      "詳細解説を全問で確認",
      "AIコーチMiLu先生の今日のおすすめ20問",
      "ブックマーク・ノート無制限",
      "分野別正答率・基本成績",
      "1日20問まで演習",
    ],
  },
  low: {
    id: "low",
    name: "基礎定着パス",
    description: "受験年度を迎える前の学生向け。授業理解と日々の復習を積み上げるパスです。",
    checkoutLabel: "基礎定着パスを購入",
    dailyLimit: 50,
    durations: [
      {
        id: "3m",
        months: 3,
        label: "3ヶ月",
        priceLabel: "¥1,500",
        perMonthLabel: "¥500/月",
        priceEnvKey: "STRIPE_PRICE_LOW_3M_SUBSCRIPTION",
      },
      {
        id: "1y",
        months: 12,
        label: "1年",
        priceLabel: "¥4,800",
        perMonthLabel: "¥400/月",
        priceEnvKey: "STRIPE_PRICE_LOW_YEAR_SUBSCRIPTION",
      },
    ],
    defaultDurationId: "3m",
    featureLabels: [
      "無料プランの内容すべて",
      "1日50問まで",
      "苦手克服・思い込みチェック",
      "端末間同期",
      "初回14日無料トライアル",
      "3ヶ月・1年から選択",
    ],
  },
  exam: {
    id: "exam",
    name: "国試対策パック",
    priceLabel: "¥9,800",
    periodLabel: "受験年度3月31日まで",
    description: "今年度受験する方向け。合格点まで仕上げるための総仕上げパックです。",
    checkoutLabel: "国試対策パックを購入",
    dailyLimit: null,
    priceEnvKey: "STRIPE_PRICE_EXAM_YEAR_SUBSCRIPTION",
    featureLabels: [
      "基礎定着パスの内容すべて",
      "過去問演習が無制限",
      "オリジナル予想問題180問（順次公開）",
      "75問模試（12月1日公開）",
      "直近テーマ問題集（順次公開）",
      "AIコーチMiLu先生の弱点深掘り分析",
      "分析に沿った克服順で出題",
      "初回14日無料トライアル",
    ],
  },
};

export function isPaidPlan(value: string): value is PaidPlan {
  return value === "low" || value === "exam";
}

/** PaidPlan の duration ID を解決する。指定なしならプランの既定値を返す */
export function resolveDurationId(plan: PaidPlan, durationId?: string): string | undefined {
  const definition = PLAN_DEFINITIONS[plan];
  if (!definition.durations || definition.durations.length === 0) return undefined;
  if (durationId && definition.durations.some((d) => d.id === durationId)) {
    return durationId;
  }
  return definition.defaultDurationId ?? definition.durations[0]?.id;
}

export function getStripePriceId(plan: PaidPlan, durationId?: string): string {
  const definition = PLAN_DEFINITIONS[plan];

  if (definition.durations && definition.durations.length > 0) {
    const resolvedId = resolveDurationId(plan, durationId);
    const duration = definition.durations.find((d) => d.id === resolvedId);
    if (!duration) return "";
    const configured = duration.priceEnvKey ? process.env[duration.priceEnvKey] : undefined;
    return configured || duration.fallbackPriceId || "";
  }

  const configured =
    definition.priceEnvKey ? process.env[definition.priceEnvKey] : undefined;
  return configured || definition.fallbackPriceId || "";
}

export function getEffectivePlan({
  plan,
  status,
  expiresAt,
  trialEndsAt,
  trialUsedAt,
  trialPlan,
  now = new Date(),
}: {
  plan: BillingPlan;
  status: BillingPlanStatus;
  expiresAt: string | null;
  trialEndsAt?: string | null;
  trialUsedAt?: string | null;
  trialPlan?: BillingPlan | null;
  now?: Date;
}): BillingPlan {
  if (plan !== "free" && status === "active" && expiresAt) {
    if (new Date(expiresAt).getTime() > now.getTime()) return plan;
  }

  if (isTrialActiveForPlan(trialEndsAt, trialUsedAt, now)) {
    return trialPlan && isPaidPlan(trialPlan) ? trialPlan : "low";
  }
  return "free";
}

export function getEffectivePlanForProfile(
  profile: Pick<
    ProfilesRow,
    | "plan"
    | "plan_status"
    | "plan_expires_at"
    | "trial_ends_at"
    | "trial_used_at"
    | "trial_plan"
  >,
  now = new Date(),
): BillingPlan {
  return getEffectivePlan({
    plan: profile.plan,
    status: profile.plan_status,
    expiresAt: profile.plan_expires_at,
    trialEndsAt: profile.trial_ends_at,
    trialUsedAt: profile.trial_used_at,
    trialPlan: profile.trial_plan,
    now,
  });
}

export function calculatePlanExpiresAt(
  plan: PaidPlan,
  now = new Date(),
  durationId?: string,
): string {
  if (plan === "low") {
    const definition = PLAN_DEFINITIONS.low;
    const resolvedId = resolveDurationId(plan, durationId);
    const duration = definition.durations?.find((d) => d.id === resolvedId);
    const months = duration?.months ?? 12;
    const expiresAt = new Date(now);
    expiresAt.setUTCMonth(expiresAt.getUTCMonth() + months);
    return expiresAt.toISOString();
  }

  return getExamYearExpiresAt(now).toISOString();
}

function getExamYearExpiresAt(now: Date): Date {
  const year = getTokyoYear(now);
  const month = getTokyoMonth(now);
  const fiscalYear = month >= 4 ? year : year - 1;

  // JST 3/31 23:59:59.999 = UTC 3/31 14:59:59.999
  return new Date(Date.UTC(fiscalYear + 1, 2, 31, 14, 59, 59, 999));
}

function getTokyoYear(date: Date): number {
  const parts = getTokyoDateParts(date);
  return Number(parts.year);
}

function getTokyoMonth(date: Date): number {
  const parts = getTokyoDateParts(date);
  return Number(parts.month);
}

function getTokyoDateParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function isTrialActiveForPlan(
  trialEndsAt: string | null | undefined,
  trialUsedAt: string | null | undefined,
  now: Date,
): boolean {
  if (!trialEndsAt || !trialUsedAt) return false;
  return new Date(trialEndsAt).getTime() > now.getTime();
}
