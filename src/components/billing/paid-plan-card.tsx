"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { PLAN_DEFINITIONS, type PaidPlan } from "@/lib/billing/plans";
import type { BillingPlan } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Props = {
  plan: PaidPlan;
  currentPlan: BillingPlan;
  isLoggedIn: boolean;
};

export function PaidPlanCard({ plan, currentPlan, isLoggedIn }: Props) {
  const definition = PLAN_DEFINITIONS[plan];
  const highlighted = plan === "exam";
  const isCurrent = currentPlan === plan;

  const hasDurations = (definition.durations?.length ?? 0) > 0;
  const [selectedDurationId, setSelectedDurationId] = useState<string>(
    definition.defaultDurationId ?? definition.durations?.[0]?.id ?? "",
  );

  const selectedDuration = hasDurations
    ? definition.durations?.find((d) => d.id === selectedDurationId)
    : undefined;

  const displayPriceLabel = selectedDuration?.priceLabel ?? definition.priceLabel ?? "";
  const displayPeriodLabel = selectedDuration?.label ?? definition.periodLabel ?? "";
  const displayPerMonth = selectedDuration?.perMonthLabel;

  return (
    <article
      aria-label={definition.name}
      className={cn(
        "rounded-[14px] border bg-[var(--bg-card)] p-4 shadow-sm",
        highlighted
          ? "border-[var(--primary)] shadow-[0_4px_16px_var(--primary-shadow-soft)]"
          : "border-border",
      )}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-[17px] font-bold text-[var(--text-1)]">
            {definition.name}
          </h2>
          <p className="min-h-[42px] text-[12px] leading-relaxed text-[var(--text-3)]">
            {definition.description}
          </p>

          {hasDurations && definition.durations ? (
            <div
              role="tablist"
              aria-label="期間を選ぶ"
              className="grid grid-cols-2 gap-1 rounded-[10px] border border-border bg-[var(--bg-muted)] p-1"
            >
              {definition.durations.map((duration) => {
                const isActive = duration.id === selectedDurationId;
                return (
                  <button
                    key={duration.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedDurationId(duration.id)}
                    className={cn(
                      "rounded-[8px] px-3 py-1.5 text-[12px] font-bold transition-colors",
                      isActive
                        ? "bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm"
                        : "text-[var(--text-3)]",
                    )}
                  >
                    {duration.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div>
            <span className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
              {displayPriceLabel}
            </span>
            {displayPeriodLabel ? (
              <p className="text-[12px] font-medium text-[var(--text-3)]">
                {hasDurations ? `${displayPeriodLabel}アクセス` : displayPeriodLabel}
                {displayPerMonth ? ` ・ ${displayPerMonth}` : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <ul className="space-y-2">
            {definition.featureLabels.map((feature) => (
              <li key={feature} className="flex gap-2 text-[12px] text-[var(--text-2)]">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]"
                  strokeWidth={2.5}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {definition.featureNote ? (
            <p className="rounded-[10px] border border-border bg-[var(--bg-muted)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-3)]">
              {definition.featureNote}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 pt-2">
          {isLoggedIn ? (
            <CheckoutButton
              plan={plan}
              durationId={hasDurations ? selectedDurationId : undefined}
              disabled={isCurrent}
              className={cn(!highlighted && "bg-[var(--navy)]")}
            >
              {isCurrent ? "現在のプランです" : definition.checkoutLabel}
            </CheckoutButton>
          ) : (
            <Link
              href="/login"
              className={cn(
                "inline-flex h-12 w-full items-center justify-center rounded-[12px] px-4 text-[14px] font-bold text-white",
                highlighted ? "bg-[var(--primary)]" : "bg-[var(--navy)]",
              )}
            >
              ログインして購入
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
