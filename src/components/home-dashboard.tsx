"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import type { Field } from "@/lib/questions";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-[18px] font-bold">
          過去問の進み具合
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-3)]">
                解いた問題
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
          <Link
            href={buildUnansweredHref([progress.nextField.name])}
            className="choice-pressable flex items-center gap-3 rounded-[14px] border border-[var(--primary)]/35 bg-[var(--primary-soft)] px-3 py-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold text-[var(--text-3)]">
                次に埋めたい未着手
              </p>
              <p className="text-[14px] font-bold leading-snug text-[var(--text-1)]">
                「{progress.nextField.name}」から解く
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
                未着手 {progress.nextField.remaining}問。タップすると分野が選ばれた状態で開きます。
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--primary-dark)]"
              strokeWidth={2.5}
            />
          </Link>
        ) : (
          <div className="rounded-[14px] border border-border bg-[var(--bg-muted)]/35 px-3 py-3">
            <p className="text-[11px] font-semibold text-[var(--text-3)]">
              次に埋めたい未着手
            </p>
            <p className="mt-1 text-[14px] font-bold leading-6 text-[var(--text-1)]">
              {progress.nextAction}
            </p>
          </div>
        )}

        <Link
          href="/study/unanswered"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-border bg-[var(--bg-card)] px-4 py-2.5 text-[13px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
        >
          未着手モードで分野を選ぶ
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </CardContent>
    </Card>
  );
}

function buildUnansweredHref(fields: readonly string[]): string {
  const params = new URLSearchParams();
  params.set("fields", fields.join("|"));
  return `/study/unanswered?${params.toString()}`;
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

  const fields = Object.entries(questionTotals.fields).map(([name, total]) => {
    const fieldEntries = entries.filter((entry) => entry.majorCategory === name);
    const answered = new Set(fieldEntries.map((entry) => entry.id)).size;
    const rate = total === 0 ? 0 : Math.round((answered / total) * 100);
    return {
      name,
      total,
      answered,
      remaining: Math.max(0, total - answered),
      rate,
    };
  });

  const priorityFields = [...fields].sort((a, b) => {
    if (a.rate !== b.rate) return a.rate - b.rate;
    return b.remaining - a.remaining;
  });

  const first = priorityFields.find((field) => field.remaining > 0);
  const nextField = first
    ? {
        name: first.name,
        rate: first.rate,
        remaining: first.remaining,
      }
    : null;
  const nextAction = first
    ? `まずは「${first.name}」から。未着手が多い分野を埋めると、全体の抜けが見えやすくなります。`
    : "未着手の問題はありません。必要に応じて復習や苦手克服に進みましょう。";

  return {
    answeredUniqueCount: answeredUniqueIds.size,
    totalRate,
    nextAction,
    nextField,
  };
}
