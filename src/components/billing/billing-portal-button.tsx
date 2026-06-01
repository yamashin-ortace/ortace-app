"use client";

import { useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";

export function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "プラン管理画面を開けませんでした");
      }

      window.location.href = data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "プラン管理画面を開けませんでした");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="btn-pressable inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 text-[13px] font-bold text-[var(--primary-dark)] disabled:opacity-60"
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} />
        ) : (
          <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
        )}
        キャンセル・支払い方法を管理
      </button>
      {error ? (
        <p className="text-[12px] leading-relaxed text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
