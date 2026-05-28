"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { PLAN_DEFINITIONS, type PaidPlan } from "@/lib/billing/plans";
import type { TrialState } from "@/lib/billing/trial";
import type { BillingPlan } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Props = {
  plan: PaidPlan;
  currentPlan: BillingPlan;
  isLoggedIn: boolean;
  trial?: TrialState | null;
};

export function PaidPlanCard({ plan, currentPlan, isLoggedIn, trial }: Props) {
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
        "h-full rounded-[14px] border bg-[var(--bg-card)] p-4 shadow-sm",
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
          <p className="min-h-[60px] text-[12px] leading-relaxed text-[var(--text-3)]">
            {definition.description}
          </p>

          <div className="min-h-[84px] rounded-[12px] border border-border bg-[var(--bg-muted)] px-3 py-2.5">
            <div className="flex min-h-7 items-center gap-1.5">
              {hasDurations && definition.durations ? (
                <div
                  role="tablist"
                  aria-label="期間を選ぶ"
                  className="inline-flex items-center gap-1.5"
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
              ) : displayPeriodLabel ? (
                <span className="inline-flex h-7 items-center rounded-[999px] bg-[var(--bg-card)] px-2.5 text-[11px] font-bold text-[var(--text-3)]">
                  {displayPeriodLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
                {displayPriceLabel}
              </span>
              {displayPerMonth ? (
                <span className="mb-1 inline-flex h-6 items-center rounded-[999px] bg-[var(--bg-card)] px-2 text-[11px] font-bold text-[var(--text-3)]">
                  {displayPerMonth}
                </span>
              ) : null}
            </div>
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
          {plan === "low" ? (
            <TrialStartArea isLoggedIn={isLoggedIn} trial={trial} />
          ) : null}

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

function TrialStartArea({
  isLoggedIn,
  trial,
}: {
  isLoggedIn: boolean;
  trial?: TrialState | null;
}) {
  if (trial?.isActive) {
    return (
      <p className="rounded-[10px] border border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-2 text-[11px] font-semibold leading-relaxed text-[var(--text-1)]">
        14日無料トライアル中です。あと{trial.remainingDays}日使えます。
      </p>
    );
  }

  if (trial?.hasUsed) {
    return (
      <p className="rounded-[10px] border border-border bg-[var(--bg-muted)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-3)]">
        14日無料トライアルは利用済みです。必要な期間を選んで購入できます。
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 text-[13px] font-bold text-[var(--primary-dark)]"
      >
        ログインして14日無料で試す
      </Link>
    );
  }

  if (trial?.canStart) {
    return <TrialStartButton />;
  }

  if (trial?.canStartBase && !trial.authProviderAllowed) {
    return (
      <p className="rounded-[10px] border border-border bg-[var(--bg-muted)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-3)]">
        14日無料トライアルはGoogleまたはLINEログインのアカウント限定です。
      </p>
    );
  }

  return null;
}

function TrialStartButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trial/start", { method: "POST" });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "トライアルを開始できませんでした");
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "トライアルを開始できませんでした");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="btn-pressable inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 text-[13px] font-bold text-[var(--primary-dark)] transition-colors disabled:opacity-60"
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} />
        ) : null}
        14日無料で試す
      </button>
      {error ? (
        <p className="text-[12px] leading-relaxed text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
