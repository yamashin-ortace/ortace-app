"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Play, X } from "lucide-react";
import { useDiagnosticStatus } from "@/lib/onboarding/use-diagnostic-status";
import { startNavigationPending } from "@/lib/navigation-pending";

export function DiagnosticIntroActions() {
  const router = useRouter();
  const { setStatus } = useDiagnosticStatus();

  const handleStart = () => {
    startNavigationPending();
    router.push("/onboarding/diagnostic/play");
  };

  const handleSkip = () => {
    setStatus("skipped");
    router.push("/");
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
      <button
        type="button"
        onClick={handleStart}
        className="choice-pressable flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-4 text-[15px] font-extrabold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
      >
        <Play className="h-4 w-4" strokeWidth={2.5} />
        診断をはじめる
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={handleSkip}
        className="choice-pressable inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 text-[13px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
        スキップして自分で進める
      </button>
    </div>
  );
}
