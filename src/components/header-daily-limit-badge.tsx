"use client";

import Link from "next/link";
import { getDailyLimitForPlan, type PlanType } from "@/lib/daily-limit";
import { useDailyLimit } from "@/lib/daily-limit/use-daily-limit";
import { PLAN_DEFINITIONS } from "@/lib/billing/plans";

type Props = {
  plan: PlanType;
};

export function HeaderDailyLimitBadge({ plan }: Props) {
  const dailyLimit = useDailyLimit(plan);
  const limit = getDailyLimitForPlan(plan);
  const planLabel = getCompactPlanLabel(plan);

  const usageLabel =
    limit === null
      ? "無制限"
      : dailyLimit.isLoaded
        ? `あと${Math.max(0, dailyLimit.remaining)}/${limit}`
        : `${limit}問/日`;

  return (
    <Link
      href="/plans"
      className="shrink-0 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-bold leading-tight tabular-nums text-[var(--primary-dark)]"
      aria-label={`現在のプラン: ${PLAN_DEFINITIONS[plan].name}、今日の残り: ${usageLabel}`}
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span>{planLabel}</span>
        <span className="text-[var(--text-2)]">{usageLabel}</span>
      </span>
    </Link>
  );
}

function getCompactPlanLabel(plan: PlanType): string {
  if (plan === "low") return "基礎";
  if (plan === "exam") return "国試";
  return "無料";
}
