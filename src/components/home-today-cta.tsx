"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCcw, Sparkles } from "lucide-react";
import { ReviewQueueHowItWorksPopover } from "@/components/study/review-queue-how-it-works-popover";
import { TodayRecommendedHowItWorksPopover } from "@/components/study/today-recommended-how-it-works-popover";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { getReviewTargetIds } from "@/lib/answer-history/status";

type Props = {
  totalQuestions: number;
};

export function HomeTodayCta({ totalQuestions }: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const summary = useMemo(() => {
    if (!hydrated) {
      return { reviewCount: 0, untouchedCount: totalQuestions };
    }
    const reviewCount = getReviewTargetIds(entries).size;
    const answered = new Set(entries.map((entry) => entry.id));
    const untouchedCount = Math.max(0, totalQuestions - answered.size);
    return { reviewCount, untouchedCount };
  }, [entries, hydrated, totalQuestions]);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/35 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
        <Link
          href="/study/today"
          className="group flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <Sparkles className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-1)]">
              AIコーチ 今日のおすすめ
            </span>
            <span className="mt-0.5 text-[12px] text-[var(--text-2)]">
              回答履歴・正答率・自信度を分析して今日の20問を提案
            </span>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
            strokeWidth={2.5}
          />
        </Link>
        <TodayRecommendedHowItWorksPopover />
      </div>

      {hydrated && summary.reviewCount > 0 ? (
        <div className="flex items-center gap-2 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/35 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
          <Link
            href="/study/review"
            className="group flex min-w-0 flex-1 items-center gap-3"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              <RefreshCcw className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-1)]">
              今日の復習 {summary.reviewCount}問
            </span>
            <span className="mt-0.5 text-[12px] text-[var(--text-2)]">
              間隔反復で復習日が到来した問題を解きます
            </span>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
              strokeWidth={2.5}
            />
          </Link>
          <ReviewQueueHowItWorksPopover />
        </div>
      ) : null}
    </section>
  );
}
