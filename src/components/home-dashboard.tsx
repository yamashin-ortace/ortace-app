"use client";

import type { ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { BookOpen, Flame, Info, Target } from "lucide-react";
import { HomeStatCard } from "@/components/home-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTokyoDateString } from "@/lib/daily-limit";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Field } from "@/lib/questions";
import { cn } from "@/lib/utils";

type QuestionTotals = {
  total: number;
  fields: Record<Field, number>;
};

type Props = {
  questionTotals: QuestionTotals;
};

export function HomeDashboard({ questionTotals }: Props) {
  const { entries } = useAnswerHistoryList();
  const stats = calculateHomeStats(entries);
  const progress = calculateLearningProgress(entries, questionTotals);

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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-3)]">
                  過去問の到達度
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--text-2)]">
                  {progress.answeredUniqueCount} / {questionTotals.total}問
                </p>
              </div>
              <p className="text-[22px] font-extrabold text-[var(--text-1)]">
                {progress.totalRate}%
              </p>
            </div>
            <ProgressBar value={progress.totalRate} />
          </div>

          <div className="rounded-[14px] border border-border bg-[var(--bg-muted)]/35 px-3 py-3">
            <p className="text-[11px] font-semibold text-[var(--text-3)]">
              次にやる目安
            </p>
            <p className="mt-1 text-[14px] font-bold leading-6 text-[var(--text-1)]">
              {progress.nextAction}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-[var(--text-3)]">
              分野別の進捗（過去問）
            </p>
            <div className="space-y-2">
              {progress.fields.map((field) => (
                <FieldProgressRow key={field.name} field={field} />
              ))}
            </div>
          </div>
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

function FieldProgressRow({
  field,
}: {
  field: ReturnType<typeof calculateLearningProgress>["fields"][number];
}) {
  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-bold text-[var(--text-1)]">
          {field.name}
        </p>
        <p className="shrink-0 text-[11px] font-medium text-[var(--text-3)]">
          {field.answered} / {field.total}問
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar value={field.rate} />
        <span className="w-10 text-right text-[11px] font-bold text-[var(--text-2)]">
          {field.rate}%
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-3)]">
        正答率 {formatRate(field.accuracy)}%
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
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

function calculateLearningProgress(
  entries: AnswerHistoryEntry[],
  questionTotals: QuestionTotals,
) {
  const answeredUniqueIds = new Set(entries.map((entry) => entry.id));
  const totalRate =
    questionTotals.total === 0
      ? 0
      : Math.round((answeredUniqueIds.size / questionTotals.total) * 100);

  const fields = Object.entries(questionTotals.fields)
    .map(([name, total]) => {
      const fieldEntries = entries.filter((entry) => entry.majorCategory === name);
      const answered = new Set(fieldEntries.map((entry) => entry.id)).size;
      const rate = total === 0 ? 0 : Math.round((answered / total) * 100);
      return {
        name,
        total,
        answered,
        remaining: Math.max(0, total - answered),
        rate,
        accuracy: calculateAccuracy(fieldEntries),
      };
    });
  const priorityFields = [...fields]
    .sort((a, b) => {
      if (a.rate !== b.rate) return a.rate - b.rate;
      return b.remaining - a.remaining;
    });

  const first = priorityFields[0];
  const nextAction = first
    ? `まずは「${first.name}」を20問。未着手が多い分野から埋めると、全体の抜けが見えやすくなります。`
    : "問題を解くと、未着手の分野と次に進めたい範囲がここに表示されます。";

  return {
    answeredUniqueCount: answeredUniqueIds.size,
    totalRate,
    fields,
    nextAction,
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
