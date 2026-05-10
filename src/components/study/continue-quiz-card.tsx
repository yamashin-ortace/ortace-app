"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw, X } from "lucide-react";
import {
  clearLastQuizProgress,
  readLastQuizProgress,
  type LastQuizProgress,
} from "@/lib/quiz-progress";

export function ContinueQuizCard() {
  const [progress, setProgress] = useState<LastQuizProgress | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(readLastQuizProgress());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!progress) return null;

  const currentNumber = Math.min(progress.index + 1, progress.total);

  const handleClear = () => {
    clearLastQuizProgress();
    setProgress(null);
  };

  return (
    <section className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
        続きから
      </h2>
      <div className="relative rounded-[14px] border border-[var(--primary)]/35 bg-[var(--primary-soft)] p-4">
        <Link href={progress.href} className="flex items-center gap-3 pr-9">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-white">
            <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[var(--text-1)]">
              {progress.label}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--text-3)]">
              {currentNumber} / {progress.total}問目から再開
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[var(--primary-dark)]"
            strokeWidth={2.5}
          />
        </Link>
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-3 right-3 grid h-7 w-7 place-items-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-1)]"
          aria-label="続きから再開を消す"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}
