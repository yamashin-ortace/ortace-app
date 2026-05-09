"use client";

import type { ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  HelpCircle,
  Info,
  Target,
  XCircle,
} from "lucide-react";
import { HomeStatCard } from "@/components/home-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTokyoDateString } from "@/lib/daily-limit";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { cn } from "@/lib/utils";

const SESSION_LABEL = { am: "午前", pm: "午後" } as const;

export function HomeDashboard() {
  const { entries } = useAnswerHistoryList();
  const stats = calculateHomeStats(entries);
  const recent = entries.slice(0, 3);

  return (
    <>
      <section>
        <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-4">
          <HomeStatCard
            icon={<Flame className="h-5 w-5" strokeWidth={2} />}
            label="連続学習"
            value={String(stats.streakDays)}
            unit="日"
            trailing={
              <InfoPopover label="連続学習の説明">
                1問でも解いた日を「がんばった日」として、何日続いているかを表示します。
              </InfoPopover>
            }
          />
          <HomeStatCard
            icon={<BookOpen className="h-5 w-5" strokeWidth={2} />}
            label="今日の解答"
            value={String(stats.todayCount)}
            unit="問"
            trailing={
              <InfoPopover label="今日の解答の説明">
                今日解いた問題数です。日付が変わるまでの学習量の目安として見られます。
              </InfoPopover>
            }
          />
          <HomeStatCard
            icon={<Target className="h-5 w-5" strokeWidth={2} />}
            label="今日の正答率"
            value={formatRate(stats.todayAccuracy)}
            unit="%"
            trailing={
              <InfoPopover label="今日の正答率の説明">
                今日解いた問題のうち、正解した割合です。正答未確定の問題は集計から外します。
              </InfoPopover>
            }
          />
          <HomeStatCard
            icon={<Target className="h-5 w-5" strokeWidth={2} />}
            label="総合正答率"
            value={formatRate(stats.totalAccuracy)}
            unit="%"
            trailing={
              <InfoPopover label="総合正答率の説明">
                これまでに解いた問題全体の正答率です。正答未確定の問題は集計から外します。
              </InfoPopover>
            }
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-[18px] font-bold">
            学習ダッシュボード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-[14px] leading-7 text-[var(--text-2)]">
              問題を解くと、今日の解答数・正答率・連続学習日数がここに反映されます。
            </p>
          ) : (
            <>
              <p className="text-[12px] font-semibold text-[var(--text-3)]">
                最近の解答
              </p>
              <div className="space-y-2">
                {recent.map((entry) => (
                  <RecentAnswerRow
                    key={`${entry.id}-${entry.answeredAt}`}
                    entry={entry}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
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
              "w-[var(--positioner-width)] max-w-[min(20rem,calc(100vw-1.5rem))] rounded-[12px] border border-border",
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

function RecentAnswerRow({ entry }: { entry: AnswerHistoryEntry }) {
  const result = getAnswerResultDisplay(entry.result);
  const ResultIcon = result.icon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-[var(--bg-muted)]/35 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-[var(--text-1)]">
          第{entry.round}回 {SESSION_LABEL[entry.session]} {entry.displayNumber}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
          {formatDateTime(entry.answeredAt)}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
          result.className,
        )}
      >
        <ResultIcon className="h-3 w-3" strokeWidth={2.5} />
        {result.label}
      </span>
    </div>
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
    totalAccuracy: calculateAccuracy(entries),
    streakDays: calculateStreakDays(entries, today),
  };
}

function calculateAccuracy(entries: AnswerHistoryEntry[]): number | null {
  const judged = entries.filter((entry) => entry.result !== "no_answer");
  if (judged.length === 0) return null;
  const correct = judged.filter((entry) => entry.result === "correct").length;
  return Math.round((correct / judged.length) * 100);
}

function calculateStreakDays(entries: AnswerHistoryEntry[], today: string): number {
  const learnedDates = new Set(
    entries.map((entry) => getTokyoDateString(new Date(entry.answeredAt))),
  );
  let cursor = new Date(`${today}T00:00:00+09:00`);
  let streak = 0;

  while (learnedDates.has(getTokyoDateString(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

function formatRate(value: number | null): string {
  return value === null ? "--" : String(value);
}

function getAnswerResultDisplay(result: AnswerHistoryEntry["result"]) {
  if (result === "correct") {
    return {
      label: "正解",
      icon: CheckCircle2,
      className: "bg-green-500/10 text-[var(--success)]",
    };
  }
  if (result === "incorrect") {
    return {
      label: "不正解",
      icon: XCircle,
      className: "bg-red-500/10 text-[var(--error)]",
    };
  }
  return {
    label: "正答なし",
    icon: HelpCircle,
    className: "bg-[var(--bg-muted)] text-[var(--text-3)]",
  };
}

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
