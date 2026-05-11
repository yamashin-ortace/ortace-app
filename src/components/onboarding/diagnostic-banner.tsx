"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Compass, X } from "lucide-react";
import {
  DIAGNOSTIC_QUESTION_COUNT,
} from "@/lib/onboarding/diagnostic";
import { useDiagnosticStatus } from "@/lib/onboarding/use-diagnostic-status";
import { cn } from "@/lib/utils";

/**
 * 初回診断（27問・任意）への導線バナー。
 * 受験・スキップで非表示にする。
 */
export function DiagnosticBanner() {
  const [hydrated, setHydrated] = useState(false);
  const { status, setStatus } = useDiagnosticStatus();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  if (!hydrated || status !== null) return null;

  return (
    <section>
      <div
        className={cn(
          "flex items-start gap-3 rounded-[16px] border border-[var(--primary)]/45 bg-[var(--primary-soft)] p-4 text-[var(--text-1)]",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-200 ease-out",
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--bg-card)] text-[var(--primary-dark)]">
          <Compass className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <p className="text-[14px] font-extrabold text-[var(--text-1)]">
              はじめに：今の自分の位置を知る診断（{DIAGNOSTIC_QUESTION_COUNT}問・任意）
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-2)]">
              9分野から3問ずつ。受けると苦手分野と推定スコアが一気に分かり、毎日の優先度が決まります。受けない選択もできます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/onboarding/diagnostic"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-[12px] font-bold text-white"
            >
              受ける
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              onClick={() => setStatus("skipped")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              自分で進める
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
