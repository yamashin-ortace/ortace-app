"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Flame,
  Gauge,
  HelpCircle,
  Info,
  Target,
} from "lucide-react";
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
        <div className="grid grid-cols-2 items-stretch gap-3 xl:grid-cols-5">
          <HomeStatCard
            icon={<Flame className="h-5 w-5" strokeWidth={2} />}
            label="連続学習"
            value={String(stats.streakThroughYesterdayDays)}
            unit="日"
            trailing={
              <InfoPopover label="連続学習の説明">
                昨日まで遡って、1問でも解いた日がどれだけ途切れず続いていたかです。当日まだ問題を解いていなくても、昨日まで続いていた記録ならそのまま表示されます。
              </InfoPopover>
            }
          />
          <HomeStatCard
            icon={<CalendarDays className="h-5 w-5" strokeWidth={2} />}
            label="累計学習日"
            value={String(stats.totalStudyDays)}
            unit="日"
            trailing={
              <InfoPopover label="累計学習日の説明">
                過去も含め、1問以上解いたことがある日を数えています。（同じ日に何問いても「1日」とみなします）
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
                  全体で解いた割合
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

          {progress.nextField ? (
            <div className="flex items-center gap-2 rounded-[14px] border border-[var(--primary)]/35 bg-[var(--primary-soft)] px-3 py-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
              <Link
                href={buildFieldStudyHref(progress.nextField.name)}
                className="group flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] font-semibold text-[var(--text-3)]">
                    次にやる目安
                  </p>
                  <p className="text-[14px] font-bold leading-snug text-[var(--text-1)]">
                    「{progress.nextField.name}」を解く
                    <span className="ml-1 text-[11px] font-medium text-[var(--text-3)]">
                      （未着手の問題から）
                    </span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
                    分野の穴を1つずつ埋める提案です
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--primary-dark)] transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
              <NextFieldReasonInfo field={progress.nextField} />
            </div>
          ) : (
            <div className="rounded-[14px] border border-border bg-[var(--bg-muted)]/35 px-3 py-3">
              <p className="text-[11px] font-semibold text-[var(--text-3)]">
                次にやる目安
              </p>
              <p className="mt-1 text-[14px] font-bold leading-6 text-[var(--text-1)]">
                {progress.nextAction}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-[var(--text-3)]">
              分野別（タップで未着手の問題を解く）
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

function NextFieldReasonInfo({
  field,
}: {
  field: NonNullable<ReturnType<typeof calculateLearningProgress>["nextField"]>;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-card)] text-[var(--primary-dark)] shadow-sm transition-[transform,colors,box-shadow]",
          "hover:bg-[var(--bg-muted)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label="次にやる目安の選び方"
      >
        <HelpCircle className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="z-50 max-w-[min(22rem,calc(100vw-1.5rem))]"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <Popover.Popup
            className={cn(
              "w-[var(--positioner-width)] min-w-[17rem] max-w-[min(22rem,calc(100vw-1.5rem))] rounded-[14px] border border-border",
              "bg-[var(--bg-card)] p-4 text-[12px] leading-relaxed text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p className="text-[13px] font-bold text-[var(--text-1)]">
              次にやる目安の理由
            </p>
            <div className="mt-2 space-y-2">
              <p>
                全体の穴を1つずつ埋めるために、次に取り組む分野を1つだけ提案しています。
                何から進めるか迷う時間を減らすための目安です。
              </p>
              <p>
                分野ごとの解いた割合と未着手数を見て、
                <strong className="font-bold text-[var(--text-1)]">
                  まだ伸ばせる分野
                </strong>
                を優先しています。
                今回は「{field.name}」が、解いた割合 {field.rate}%・未着手{" "}
                {field.remaining}問でした。
                {field.accuracy !== null
                  ? ` 直近の正答率は ${field.accuracy}% です。`
                  : " 直近の解答実績はまだ少なめです。"}
              </p>
              <p>
                まず未着手を減らすと、分野ごとの抜けが見えやすくなります。
                この分野の中から、まだ解いていない問題を優先して出題します（出題数は10／15／20問から選べます）。
              </p>
            </div>
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
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={buildFieldStudyHref(field.name)}
          className="group min-w-0 flex-1 text-left"
          aria-label={`${field.name}：タップで未着手の問題を解く`}
        >
          <span className="block text-[13px] font-bold text-[var(--text-1)]">
            {field.name}
          </span>
          <span className="mt-1 block text-[12px] leading-snug text-[var(--text-2)]">
            解いた割合{" "}
            <span className="font-semibold tabular-nums text-[var(--text-1)]">
              {field.rate}%
            </span>
            <span className="text-[var(--text-3)]">
              （{field.answered}/{field.total}問）
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 pt-0.5">
          <FieldAccuracyInfo field={field} />
        </div>
      </div>
      <div className="mt-1.5">
        <ProgressBar value={field.rate} />
      </div>
    </div>
  );
}

function FieldAccuracyInfo({
  field,
}: {
  field: ReturnType<typeof calculateLearningProgress>["fields"][number];
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={`${field.name}の正答率を表示`}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--text-3)] transition-colors",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
      >
        <Gauge className="h-4 w-4" strokeWidth={2.25} aria-hidden />
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
              "bg-[var(--bg-card)] p-3 text-[12px] leading-relaxed text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p className="text-[13px] font-bold text-[var(--text-1)]">
              正答率 {formatRate(field.accuracy)}%
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-3)]">
              解答済 {field.answered}問のうち、最新の解答が正解だった割合です。
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function buildFieldStudyHref(field: string): string {
  return `/study/field/${encodeURIComponent(field)}`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full min-w-0 shrink-0 overflow-hidden rounded-full bg-[var(--bg-muted)]">
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
    streakThroughYesterdayDays: calculateStreakThroughYesterday(entries, today),
    totalStudyDays: calculateTotalDistinctStudyDays(entries),
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
  const nextField = first
    ? {
        name: first.name,
        rate: first.rate,
        remaining: first.remaining,
        accuracy: first.accuracy,
      }
    : null;
  const nextAction = first
    ? `まずは「${first.name}」から。未着手が多い分野を埋めると、全体の抜けが見えやすくなります。`
    : "問題を解くと、未着手の分野と次に進めたい範囲がここに表示されます。";

  return {
    answeredUniqueCount: answeredUniqueIds.size,
    totalRate,
    fields,
    nextAction,
    nextField,
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
    entries.map((entry) =>
      getTokyoDateString(new Date(entry.answeredAt)),
    ),
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
