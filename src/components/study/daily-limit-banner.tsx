"use client";

import { Crown, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  DAILY_LIMIT_WARNING_REMAINING,
  getDailyLimitForPlan,
  type PlanType,
} from "@/lib/daily-limit";
import { useDailyLimit } from "@/lib/daily-limit/use-daily-limit";

type Props = {
  /** 当日の使用数。省略時は LocalStorage の実値を読む */
  used?: number;
  /** プランタイプ（フェーズ4でStripe連携時に実値） */
  plan?: PlanType;
};

/**
 * 学習タブ上部のプラン進捗バナー
 *
 * 表示ルール：
 * - 国試対策パック：常に非表示
 * - 無料/基礎定着パス：残り4問以下になったら警告として表示
 * - 上限到達：課金CTAを目立たせる
 */
export function DailyLimitBanner({ used, plan = "free" }: Props) {
  const dailyLimit = useDailyLimit(plan);
  const limit = getDailyLimitForPlan(plan);
  const actualUsed = used ?? dailyLimit.used;

  if (limit === null) return null;
  if (used === undefined && !dailyLimit.isLoaded) return null;
  if (actualUsed < limit - DAILY_LIMIT_WARNING_REMAINING) return null;

  const remaining = Math.max(0, limit - actualUsed);
  const planLabel = plan === "low" ? "基礎定着パス" : "無料分";
  const upgradeCopy =
    plan === "low"
      ? "国試対策パックなら、今日も制限なく続けられます"
      : "基礎定着パスは1日50問、国試対策パックは無制限です";

  // 上限到達：CTAバナー
  if (remaining === 0) {
    return (
      <Link
        href="/plans"
        className="flex items-center gap-3 rounded-[12px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 py-3 transition-colors hover:bg-[var(--primary-soft)]/70"
      >
        <Crown className="h-4 w-4 shrink-0 text-[var(--primary-dark)]" strokeWidth={2.5} />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[var(--text-1)]">
            今日の{planLabel}（{limit}問）を使い切りました
          </p>
          <p className="text-[11px] text-[var(--text-2)]">
            {upgradeCopy}
          </p>
        </div>
      </Link>
    );
  }

  // 残り少ない：警告
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-card)] px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0 text-[var(--text-3)]" strokeWidth={2.5} />
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-[var(--text-1)]">
          あと{remaining}問で今日の{planLabel}が終わります
        </p>
        <Link
          href="/plans"
          className="text-[11px] text-[var(--primary-dark)] underline-offset-2 hover:underline"
        >
          上限を増やす
        </Link>
      </div>
    </div>
  );
}
