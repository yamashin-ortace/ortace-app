"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PLAN_DEFINITIONS,
  type PlanDefinition,
} from "@/lib/billing/plans";
import type { BillingPlan } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const PLAN_CARD_ORDER: readonly BillingPlan[] = ["free", "low", "exam"];

export function LandingPricing() {
  return (
    <div className="space-y-8 py-14">
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
          PRICING
        </p>
        <h2 className="text-[20px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[30px]">
          あなたのフェーズで選ぶ料金プラン
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          まずは無料で。続けたくなったら、学習フェーズに合わせてアップグレード。
        </p>
      </div>

      <p className="rounded-[14px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] px-4 py-3 text-[13px] font-bold leading-relaxed text-[var(--text-2)] shadow-[0_12px_28px_rgba(44,62,93,0.06)]">
        第47〜56回・10年分の過去問1,500問を、演習・記録・復習までスマホ1台に。
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_CARD_ORDER.map((planId) => (
          <PlanCard key={planId} plan={PLAN_DEFINITIONS[planId]} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanDefinition }) {
  const hasDurations = (plan.durations?.length ?? 0) > 0;
  const [selectedDurationId, setSelectedDurationId] = useState<string>(
    plan.defaultDurationId ?? plan.durations?.[plan.durations.length - 1]?.id ?? "",
  );

  const activeDuration = hasDurations
    ? plan.durations?.find((d) => d.id === selectedDurationId)
    : undefined;

  const displayPrice = activeDuration?.priceLabel ?? plan.priceLabel ?? "";
  const displayPeriod = getLandingPeriodLabel(plan, activeDuration?.label);
  const displayPerMonth = activeDuration?.perMonthLabel;
  const isHighlighted = plan.id === "exam";

  return (
    <Card
      className={
        isHighlighted
          ? "h-full border-[var(--primary)] shadow-[0_4px_16px_var(--primary-shadow-soft)] ring-1 ring-[var(--primary)]/25"
          : "h-full"
      }
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-[17px] font-bold text-[var(--text-1)]">
          {plan.name}
        </CardTitle>
        <p className="min-h-[60px] text-[13px] leading-relaxed text-[var(--text-3)]">
          {plan.description}
        </p>

        <div className="mt-3 min-h-[84px] rounded-[12px] border border-border bg-[var(--bg-muted)] px-3 py-2.5">
          <div className="flex min-h-7 items-center gap-1.5">
            {hasDurations && plan.durations ? (
              <div
                role="tablist"
                aria-label="期間を選ぶ"
                className="inline-flex items-center gap-1.5"
              >
                {plan.durations.map((duration) => {
                  const isActive = duration.id === selectedDurationId;
                  return (
                    <button
                      key={duration.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedDurationId(duration.id)}
                      className={cn(
                        "inline-flex h-7 items-center rounded-[999px] px-2.5 text-[11px] font-bold transition-colors",
                        isActive
                          ? "bg-[var(--navy)] text-white shadow-sm"
                          : "bg-[var(--bg-card)] text-[var(--text-3)] hover:bg-[var(--bg-base)]",
                      )}
                    >
                      {duration.label}
                    </button>
                  );
                })}
              </div>
            ) : displayPeriod ? (
              <span className="inline-flex h-7 items-center rounded-[999px] bg-[var(--bg-card)] px-2.5 text-[11px] font-bold text-[var(--text-3)]">
                {displayPeriod.replace(/^\//, "")}
              </span>
            ) : (
              <span className="inline-flex h-7 items-center rounded-[999px] bg-[var(--bg-card)] px-2.5 text-[11px] font-bold text-[var(--text-3)]">
                カード不要
              </span>
            )}
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[26px] font-extrabold tracking-tight text-[var(--text-1)]">
              {displayPrice}
            </span>
            {displayPerMonth ? (
              <span className="mb-1 inline-flex h-6 items-center rounded-[999px] bg-[var(--bg-card)] px-2 text-[11px] font-bold text-[var(--text-3)]">
                {displayPerMonth}
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <ul className="space-y-2.5">
          {plan.featureLabels.map((line) => (
            <li key={line} className="flex gap-2 text-[13px] text-[var(--text-2)]">
              <Check
                className="mt-0.5 size-4 shrink-0 text-[var(--success)]"
                strokeWidth={2.5}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-2 border-t bg-transparent pt-4">
        <Link
          href="/login"
          className={
            isHighlighted
              ? "btn-pressable btn-primary-shadow inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--primary)] py-3 text-center text-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              : "inline-flex w-full items-center justify-center rounded-[12px] border border-border bg-[var(--bg-muted)] py-3 text-center text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          }
        >
          {getLandingCtaLabel(plan)}
        </Link>
        {plan.featureNote ? (
          <p className="text-[11px] leading-relaxed text-[var(--text-4)]">
            {plan.featureNote}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function getLandingPeriodLabel(
  plan: PlanDefinition,
  durationLabel?: string,
): string {
  if (durationLabel) return `/${durationLabel}`;
  return plan.periodLabel ? `/${plan.periodLabel}` : "";
}

function getLandingCtaLabel(plan: PlanDefinition): string {
  if (plan.id === "free") return "無料ではじめる";
  return `${plan.name}を見る`;
}
