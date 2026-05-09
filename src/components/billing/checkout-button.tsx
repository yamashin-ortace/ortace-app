"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { PaidPlan } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type Props = {
  plan: PaidPlan;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function CheckoutButton({ plan, children, className, disabled }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "決済画面を開けませんでした");
      }

      window.location.href = data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "決済画面を開けませんでした");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "btn-pressable inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-white shadow-sm transition-colors disabled:opacity-60",
          className,
        )}
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} />
        ) : null}
        {children}
      </button>
      {error ? (
        <p className="text-[12px] leading-relaxed text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
