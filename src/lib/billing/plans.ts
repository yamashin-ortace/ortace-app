import type { BillingPlan, BillingPlanStatus } from "@/lib/supabase/database.types";

export type PaidPlan = Exclude<BillingPlan, "free">;

export const PAID_PLANS: PaidPlan[] = ["low", "exam"];

export type PlanDefinition = {
  id: BillingPlan;
  name: string;
  priceLabel: string;
  periodLabel: string;
  description: string;
  checkoutLabel: string;
  dailyLimit: number | null;
  priceEnvKey?: string;
  fallbackPriceId?: string;
  featureLabels: string[];
  featureNote?: string;
};

export const PLAN_DEFINITIONS: Record<BillingPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "無料",
    priceLabel: "¥0",
    periodLabel: "",
    description: "まずは試して、ORT ACEの学習感を確認できます。",
    checkoutLabel: "無料で使う",
    dailyLimit: 20,
    featureLabels: ["1日20問まで", "解答・解説表示", "基本成績"],
  },
  low: {
    id: "low",
    name: "低学年プラン",
    priceLabel: "¥5,400",
    periodLabel: "1年アクセス",
    description: "授業・日々の復習を続けるための学習パスです。",
    checkoutLabel: "低学年プランを購入",
    dailyLimit: 100,
    priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_LOW_YEAR_PASS",
    fallbackPriceId: "price_1TUwkLFUkpvTvQkQyHTN8ha5",
    featureLabels: [
      "1日100問まで",
      "ブックマーク・ノート",
      "基本成績",
      "端末間同期",
    ],
  },
  exam: {
    id: "exam",
    name: "国試対策パック",
    priceLabel: "¥9,800",
    periodLabel: "受験年度アクセス",
    description: "合格点まで仕上げるための受験生向けパックです。",
    checkoutLabel: "国試対策パックを購入",
    dailyLimit: null,
    priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_EXAM_YEAR_PASS",
    fallbackPriceId: "price_1TUwmrFUkpvTvQkQy8InMoBp",
    featureLabels: [
      "過去問演習が無制限",
      "ブックマーク・ノート",
      "成績・履歴",
      "端末間同期",
    ],
    featureNote:
      "模試モード、苦手復習、分野別弱点診断、直前チェックは順次追加予定です。",
  },
};

export function isPaidPlan(value: string): value is PaidPlan {
  return value === "low" || value === "exam";
}

export function getStripePriceId(plan: PaidPlan): string {
  const definition = PLAN_DEFINITIONS[plan];
  const configured =
    definition.priceEnvKey ? process.env[definition.priceEnvKey] : undefined;
  return configured || definition.fallbackPriceId || "";
}

export function getEffectivePlan({
  plan,
  status,
  expiresAt,
  now = new Date(),
}: {
  plan: BillingPlan;
  status: BillingPlanStatus;
  expiresAt: string | null;
  now?: Date;
}): BillingPlan {
  if (plan === "free") return "free";
  if (status !== "active") return "free";
  if (!expiresAt) return "free";
  if (new Date(expiresAt).getTime() <= now.getTime()) return "free";
  return plan;
}

export function calculatePlanExpiresAt(plan: PaidPlan, now = new Date()): string {
  if (plan === "low") {
    const expiresAt = new Date(now);
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
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
