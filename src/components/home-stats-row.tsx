"use client";

import type { ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import {
  BookOpen,
  CalendarDays,
  Flame,
  Info,
  ListChecks,
  Target,
} from "lucide-react";
import { HomeStatCard } from "@/components/home-stat-card";
import { HorizontalSnapRow } from "@/components/ui/horizontal-snap-row";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getTokyoDateString } from "@/lib/daily-limit";
import { useLifetimeAnswerCount } from "@/lib/study-goal/use-lifetime-answer-count";
import { cn } from "@/lib/utils";

/**
 * ホーム「現在地」グループの指標5枚を横スワイプで表示する。
 * - スマホでは2枚弱が見えて、左右にスナップしながらめくる。
 * - PC でもそのまま横スナップ。横幅が広ければ全部見えるが、それでも一行で揃える。
 */
export function HomeStatsRow() {
  const { entries } = useAnswerHistoryList();
  const { count: lifetimeAnswers } = useLifetimeAnswerCount();
  const stats = calculateHomeStats(entries);

  const items: ReactNode[] = [
    <HomeStatCard
      key="streak"
      icon={<Flame className="h-4 w-4" strokeWidth={2} />}
      label="連続学習"
      value={String(stats.streakThroughYesterdayDays)}
      unit="日"
      trailing={
        <InfoPopover label="連続学習の説明">
          1問でも解いた日が連続している日数です。当日まだ0問でも、昨日まで続いていれば途切れません。
        </InfoPopover>
      }
    />,
    <HomeStatCard
      key="total-days"
      icon={<CalendarDays className="h-4 w-4" strokeWidth={2} />}
      label="累計学習日"
      value={String(stats.totalStudyDays)}
      unit="日"
      trailing={
        <InfoPopover label="累計学習日の説明">
          1問でも解いたことがある日の合計です（同じ日に何問解いても1日）。
        </InfoPopover>
      }
    />,
    <HomeStatCard
      key="today-count"
      icon={<BookOpen className="h-4 w-4" strokeWidth={2} />}
      label="今日の解答"
      value={String(stats.todayCount)}
      unit="問"
    />,
    <HomeStatCard
      key="today-accuracy"
      icon={<Target className="h-4 w-4" strokeWidth={2} />}
      label="今日の正答率"
      value={formatRate(stats.todayAccuracy)}
      unit="%"
    />,
    <HomeStatCard
      key="lifetime-answers"
      icon={<ListChecks className="h-4 w-4" strokeWidth={2} />}
      label="累計問題数"
      value={lifetimeAnswers.toLocaleString()}
      unit="問"
      trailing={
        <InfoPopover label="累計問題数の説明">
          これまで解答した問題の総数です。同じ問題を複数回解いた場合もそれぞれ1問として数えます。
        </InfoPopover>
      }
    />,
  ];

  return (
    <section aria-label="学習指標">
      <HorizontalSnapRow items={items} ariaLabel="学習指標カード" />
    </section>
  );
}

function InfoPopover({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          "-m-0.5 rounded-full p-1.5 text-[var(--text-3)] transition-colors",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label={label}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="z-50 max-w-[min(20rem,calc(100vw-1.5rem))]"
          side="top"
          align="end"
          sideOffset={6}
        >
          <Popover.Popup
            className={cn(
              "w-[var(--positioner-width)] min-w-[15rem] max-w-[min(20rem,calc(100vw-1.5rem))] rounded-[12px] border border-border",
              "bg-[var(--bg-card)] p-3 text-[13px] leading-relaxed text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p>{children}</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function calculateHomeStats(entries: AnswerHistoryEntry[]) {
  const today = getTokyoDateString();
  const todayEntries = entries.filter(
    (entry) => getTokyoDateString(new Date(entry.answeredAt)) === today,
  );

  return {
    todayCount: todayEntries.length,
    todayAccuracy: calculateAccuracy(todayEntries),
    streakThroughYesterdayDays: calculateStreakThroughYesterday(entries, today),
    totalStudyDays: calculateTotalDistinctStudyDays(entries),
  };
}

function calculateAccuracy(entries: AnswerHistoryEntry[]): number | null {
  const judged = entries.filter((entry) => entry.result !== "no_answer");
  if (judged.length === 0) return null;
  const correct = judged.filter((entry) => entry.result === "correct").length;
  return Math.round((correct / judged.length) * 100);
}

function calculateStreakThroughYesterday(
  entries: AnswerHistoryEntry[],
  todayTokyo: string,
): number {
  const learnedDates = new Set(
    entries.map((entry) => getTokyoDateString(new Date(entry.answeredAt))),
  );
  const todayNoonTokyo = new Date(`${todayTokyo}T12:00:00+09:00`);
  let cursor = new Date(todayNoonTokyo.getTime() - 24 * 60 * 60 * 1000);
  let streak = 0;

  while (learnedDates.has(getTokyoDateString(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

function calculateTotalDistinctStudyDays(entries: AnswerHistoryEntry[]): number {
  const dates = new Set(
    entries.map((entry) => getTokyoDateString(new Date(entry.answeredAt))),
  );
  return dates.size;
}

function formatRate(value: number | null): string {
  return value === null ? "--" : String(value);
}
