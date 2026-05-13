"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ChevronRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const progress = calculateLearningProgress(entries, questionTotals);

  return (
    <>
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
            <div className="space-y-0.5">
              <p className="text-[12px] font-semibold text-[var(--text-3)]">
                分野別（タップで未着手の問題を解く）
              </p>
              <p className="text-[10px] text-[var(--text-3)]">
                ※正答率は最新解答ベース
              </p>
            </div>
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
          "-m-0.5 rounded-full p-1.5 text-[var(--text-3)] transition-colors",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label="次にやる目安の選び方"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
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
                解いた割合と未着手数から、まだ伸ばせる分野を1つ提案しています。今回は「
                <strong className="font-bold text-[var(--text-1)]">
                  {field.name}
                </strong>
                」（割合 {field.rate}%・未着手 {field.remaining}問）。
              </p>
              <p>
                タップで未着手の問題から出題。出題数は10／15／20問から選べます。
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
    <Link
      href={buildFieldStudyHref(field.name)}
      aria-label={`${field.name}：タップで未着手の問題を解く`}
      className="group block rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] font-bold text-[var(--text-1)]">
          {field.name}
        </span>
        {field.accuracy !== null ? (
          <span className="shrink-0 text-[11px] text-[var(--text-3)]">
            正答率{" "}
            <span className="text-[13px] font-bold tabular-nums text-[var(--text-1)]">
              {field.accuracy}
            </span>
            %
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-[var(--text-3)]">
            正答率 --
          </span>
        )}
      </div>
      <div className="mt-1 text-[12px] leading-snug text-[var(--text-2)]">
        解いた割合{" "}
        <span className="font-semibold tabular-nums text-[var(--text-1)]">
          {field.rate}%
        </span>
        <span className="text-[var(--text-3)]">
          （{field.answered}/{field.total}問）
        </span>
      </div>
      <div className="mt-1.5">
        <ProgressBar value={field.rate} />
      </div>
    </Link>
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

