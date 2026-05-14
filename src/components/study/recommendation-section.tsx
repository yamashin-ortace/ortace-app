"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  ChevronRight,
  Inbox,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { ReviewQueueHowItWorksPopover } from "@/components/study/review-queue-how-it-works-popover";
import { TodayRecommendedHowItWorksPopover } from "@/components/study/today-recommended-how-it-works-popover";
import { UnansweredHowItWorksPopover } from "@/components/study/unanswered-how-it-works-popover";
import { WeakFieldHowItWorksPopover } from "@/components/study/weak-field-how-it-works-popover";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  getReviewTargetIds,
  getWeakFieldFromHistory,
} from "@/lib/answer-history/status";

type Props = {
  totalQuestions: number;
};

export function RecommendationSection({ totalQuestions }: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    if (!hydrated) {
      return { reviewCount: 0, untouchedCount: 0, weakLabel: "", weakStage: null as null | "confirmed" | "provisional" };
    }
    const reviewCount = getReviewTargetIds(entries).size;
    const answered = new Set(entries.map((entry) => entry.id));
    const untouchedCount = Math.max(0, totalQuestions - answered.size);
    const weak = getWeakFieldFromHistory(entries);
    return {
      reviewCount,
      untouchedCount,
      weakLabel: weak?.field ?? "",
      weakStage: weak?.stage === "confirmed" || weak?.stage === "provisional" ? weak.stage : null,
    };
  }, [entries, hydrated, totalQuestions]);

  return (
    <section className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
        AIコーチ
      </h2>
      <div className="space-y-2">
        <RecommendStudyLink
          href="/study/today"
          icon={<Sparkles className="h-6 w-6" strokeWidth={2.5} />}
          title="今日のおすすめ"
          subtitle="回答履歴・正答率・自信度・解答時間から分析"
          trailing={<TodayRecommendedHowItWorksPopover />}
        />
        <RecommendStudyLink
          href="/study/review"
          icon={<RefreshCcw className="h-6 w-6" strokeWidth={2.5} />}
          title="復習する"
          subtitle={
            hydrated
              ? stats.reviewCount > 0
                ? `今日の復習 ${stats.reviewCount}問`
                : "今日復習する問題はありません"
              : "計算中…"
          }
          trailing={<ReviewQueueHowItWorksPopover />}
        />
        <RecommendStudyLink
          href="/study/unanswered"
          icon={<Inbox className="h-6 w-6" strokeWidth={2.5} />}
          title="未着手から解く"
          subtitle={
            hydrated
              ? `未着手 ${stats.untouchedCount.toLocaleString()} / ${totalQuestions.toLocaleString()}問`
              : "計算中…"
          }
          trailing={<UnansweredHowItWorksPopover />}
        />
        <RecommendStudyLink
          href="/study/weak"
          icon={<Target className="h-6 w-6" strokeWidth={2.5} />}
          title="弱点リペア"
          subtitle={
            hydrated
              ? stats.weakLabel
                ? stats.weakStage === "provisional"
                  ? `正答率から暫定分析：${stats.weakLabel}`
                  : `正答率から分析：${stats.weakLabel}`
                : "正答率の低い分野をAIコーチが集中補強"
              : "計算中…"
          }
          trailing={<WeakFieldHowItWorksPopover />}
        />
        <RecommendStudyLink
          href="/study/misconception"
          icon={<BrainCircuit className="h-6 w-6" strokeWidth={2.5} />}
          title="思い込みチェック"
          subtitle="自信あり誤答・急ぎすぎた誤答を分析"
          trailing={null}
        />
      </div>
    </section>
  );
}

function RecommendStudyLink({
  href,
  icon,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/35 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-1)]">
            {title}
          </span>
          <span className="mt-0.5 text-[12px] text-[var(--text-2)]">
            {subtitle}
          </span>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
      </Link>
      {trailing}
    </div>
  );
}
