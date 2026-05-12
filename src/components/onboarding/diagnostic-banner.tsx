"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Compass, X } from "lucide-react";
import {
  DIAGNOSTIC_QUESTION_COUNT,
  isDiagnosticComplete,
} from "@/lib/onboarding/diagnostic";
import { useDiagnosticStatus } from "@/lib/onboarding/use-diagnostic-status";
import { cn } from "@/lib/utils";

/**
 * 初回診断（27問・任意）へのリマインダー。
 * 完了時のみ消え、途中離脱・スキップの場合はホームで案内し続ける。
 */
export function DiagnosticBanner() {
  const [hydrated, setHydrated] = useState(false);
  const { status, setStatus } = useDiagnosticStatus();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  if (!hydrated || isDiagnosticComplete(status)) return null;

  const isSkipped = status === "skipped";

  return (
    <section>
      <div
        className={cn(
          "flex items-start gap-3 rounded-[16px] border p-4 text-[var(--text-1)]",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-200 ease-out",
          isSkipped
            ? "border-border bg-[var(--bg-muted)]/40"
            : "border-[var(--primary)]/45 bg-[var(--primary-soft)]",
        )}
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--bg-card)]",
            isSkipped ? "text-[var(--text-2)]" : "text-[var(--primary-dark)]",
          )}
        >
          <Compass className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <p className="text-[14px] font-extrabold text-[var(--text-1)]">
              {isSkipped
                ? `初回診断（${DIAGNOSTIC_QUESTION_COUNT}問・任意）をまだ試せます`
                : `はじめに：今の自分の位置を知る診断（${DIAGNOSTIC_QUESTION_COUNT}問・任意）`}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-2)]">
              {isSkipped
                ? "苦手分野と推定スコアがすぐわかり、毎日の優先度が決めやすくなります。先に自分で進めて問題ありません。"
                : "9分野から3問ずつ。受けると苦手分野と推定スコアが一気に分かり、毎日の優先度が決まります。受けない選択もできます。"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/onboarding/diagnostic"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold",
                isSkipped
                  ? "border border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
                  : "bg-[var(--primary)] text-white",
              )}
            >
              {isSkipped ? "診断を受ける" : "受ける"}
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            {!isSkipped ? (
              <button
                type="button"
                onClick={() => setStatus("skipped")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                自分で進める
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
