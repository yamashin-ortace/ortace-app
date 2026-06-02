"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Play } from "lucide-react";
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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleStart}
        className="choice-pressable inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-6 text-[15px] font-extrabold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
      >
        <Play className="h-4 w-4" strokeWidth={2.5} />
        診断をはじめる
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={handleSkip}
        className="inline-flex px-2 py-1 text-[12px] font-bold text-[var(--text-3)] underline underline-offset-2"
      >
        あとで受ける
      </button>
    </div>
  );
}
