"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  ChevronRight,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { MisconceptionHowItWorksPopover } from "@/components/study/misconception-how-it-works-popover";
import { ReviewQueueHowItWorksPopover } from "@/components/study/review-queue-how-it-works-popover";
import { TodayRecommendedHowItWorksPopover } from "@/components/study/today-recommended-how-it-works-popover";
import { WeakFieldHowItWorksPopover } from "@/components/study/weak-field-how-it-works-popover";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  getReviewTargetIds,
  getWeakFieldFromHistory,
} from "@/lib/answer-history/status";
import { countMisconceptionCandidates } from "@/lib/ai-coach/recommendation";

export function RecommendationSection() {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    if (!hydrated) {
      return {
        reviewCount: 0,
        weakLabel: "",
        weakStage: null as null | "confirmed" | "provisional",
        misconceptionCount: 0,
      };
    }
    const reviewCount = getReviewTargetIds(entries).size;
    const weak = getWeakFieldFromHistory(entries);
    const misconceptionCount = countMisconceptionCandidates(entries);
    return {
      reviewCount,
      weakLabel: weak?.field ?? "",
      weakStage: weak?.stage === "confirmed" || weak?.stage === "provisional" ? weak.stage : null,
      misconceptionCount,
    };
  }, [entries, hydrated]);

  return (
    <section className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
        AIコーチMiLu先生
      </h2>
      <div className="space-y-2">
        <PrimaryRecommendStudyLink
          href="/study/today"
          icon={<Sparkles className="h-6 w-6" strokeWidth={2.5} />}
          title="今日のおすすめ"
          subtitle="迷ったらここから。復習・弱点・思い込み・未着手を20問にまとめます。"
          trailing={<TodayRecommendedHowItWorksPopover />}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <RecommendStudyLink
            href="/study/review"
            icon={<RefreshCcw className="h-5 w-5" strokeWidth={2.5} />}
            title="復習する"
            subtitle={
              hydrated
                ? stats.reviewCount > 0
                  ? `今日の復習 ${stats.reviewCount}問`
                  : "復習待ちはありません"
                : "計算中…"
            }
            trailing={<ReviewQueueHowItWorksPopover />}
          />
          <RecommendStudyLink
            href="/study/weak"
            icon={<Target className="h-5 w-5" strokeWidth={2.5} />}
            title="苦手克服"
            subtitle={
              hydrated
                ? stats.weakLabel
                  ? stats.weakStage === "provisional"
                    ? `暫定：${stats.weakLabel}`
                    : stats.weakLabel
                  : "正答率の低い分野を補強"
                : "計算中…"
            }
            trailing={<WeakFieldHowItWorksPopover />}
          />
          <RecommendStudyLink
            href="/study/misconception"
            icon={<BrainCircuit className="h-5 w-5" strokeWidth={2.5} />}
            title="思い込み"
            subtitle={
              hydrated
                ? stats.misconceptionCount > 0
                  ? `候補 ${stats.misconceptionCount}問`
                  : "自信あり誤答を確認"
                : "計算中…"
            }
            badge={
              hydrated && stats.misconceptionCount > 0
                ? stats.misconceptionCount
                : null
            }
            trailing={<MisconceptionHowItWorksPopover />}
          />
        </div>
      </div>
    </section>
  );
}

function PrimaryRecommendStudyLink({
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
    <div className="flex items-center gap-2 rounded-[16px] border border-[var(--primary)]/35 bg-[var(--primary-soft)] p-4 text-[var(--text-1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/55 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[var(--primary)] text-white">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[18px] font-extrabold tracking-tight text-[var(--text-1)]">
            {title}
          </span>
          <span className="mt-0.5 text-[12px] leading-snug text-[var(--text-2)]">
            {subtitle}
          </span>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-[var(--primary-dark)] transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </Link>
      {trailing}
    </div>
  );
}

function RecommendStudyLink({
  href,
  icon,
  title,
  subtitle,
  trailing,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
  badge?: number | null;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-[14px] border border-border bg-[var(--bg-card)] p-3 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/35 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-2.5"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="text-[14px] font-extrabold tracking-tight text-[var(--text-1)]">
              {title}
            </span>
            {badge && badge > 0 ? (
              <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-extrabold text-white tabular-nums">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
            {subtitle}
          </span>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
      </Link>
      {trailing}
    </div>
  );
}
