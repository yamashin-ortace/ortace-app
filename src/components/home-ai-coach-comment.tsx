"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { buildHomeAiCoachComment } from "@/lib/ai-coach/home-comment";

/**
 * ホームの本試験カウントダウン直下に置く、AIコーチからの一言。
 * 学習データの状態によって文言と CTA を出し分ける。
 */
export function HomeAiCoachComment() {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const comment = useMemo(() => {
    if (!hydrated) return null;
    return buildHomeAiCoachComment(entries);
  }, [entries, hydrated]);

  if (!comment) {
    return (
      <section
        aria-hidden
        className="min-h-[58px] rounded-[14px] border border-dashed border-border bg-[var(--bg-card)]/30"
      />
    );
  }

  return (
    <section
      aria-label="AIコーチからの一言"
      className="relative overflow-hidden rounded-[14px] border border-[var(--primary)]/25 bg-linear-to-br from-[var(--primary-soft)]/60 via-[var(--bg-card)] to-[var(--bg-card)] px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 right-6 h-20 w-20 rounded-full bg-[var(--primary)]/12 blur-2xl"
      />
      <div className="relative flex items-start gap-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-[var(--primary-dark)]">
            AIコーチ
          </p>
          <p className="mt-0.5 text-[13px] leading-[1.7] font-medium text-[var(--text-1)]">
            {comment.message}
          </p>
          {comment.cta ? (
            <Link
              href={comment.cta.href}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-white shadow-[0_2px_6px_var(--primary-shadow-soft)] transition-transform duration-150 hover:-translate-y-px"
            >
              {comment.cta.label}
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
