"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Flag, Settings2 } from "lucide-react";
import { formatExamDateLabel, getDaysUntilExam } from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { summarizeStudyGoal } from "@/lib/study-goal";
import { useLifetimeAnswerCount } from "@/lib/study-goal/use-lifetime-answer-count";
import { useStudyGoalConfig } from "@/lib/study-goal/use-study-goal-config";

type Props = {
  /** 過去問の総問題数（プリセットの目標総解答数を組み立てる母数） */
  totalQuestions: number;
};

export function HomeExamCountdown({ totalQuestions }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const { examDate } = useExamDate();
  const { config } = useStudyGoalConfig();
  const { count: lifetimeAnswers } = useLifetimeAnswerCount();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const daysLeft = useMemo(() => getDaysUntilExam(examDate), [examDate]);

  const goalSummary = useMemo(
    () =>
      summarizeStudyGoal({
        config,
        examDateISO: examDate,
        pastQuestionsTotal: totalQuestions,
        lifetimeAnswers,
      }),
    [config, examDate, totalQuestions, lifetimeAnswers],
  );

  const examLabel = formatExamDateLabel(examDate);

  return (
    <section>
      <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <Flag className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-[var(--text-3)]">
              本試験まで
            </span>
            <span className="mt-0.5 text-[24px] font-extrabold leading-none tracking-tight text-[var(--text-1)]">
              {hydrated ? (
                daysLeft >= 0 ? (
                  <>
                    あと{daysLeft}
                    <span className="ml-1 text-[14px] font-bold text-[var(--text-3)]">
                      日
                    </span>
                  </>
                ) : (
                  <span className="text-[18px] text-[var(--text-3)]">
                    試験日を過ぎています
                  </span>
                )
              ) : (
                <span className="text-[14px] text-[var(--text-3)]">計算中…</span>
              )}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--text-3)]">
              <CalendarDays className="h-3 w-3" strokeWidth={2.5} />
              {examLabel}
              <span className="ml-0.5 text-[var(--text-3)]">（仮）</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/settings#study-goal"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-card)] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
              aria-label="学習プリセットを変更"
            >
              <Settings2 className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {!hydrated ? (
          <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
            <p className="text-[11px] text-[var(--text-3)]">計算中…</p>
          </div>
        ) : goalSummary === null ? (
          <Link
            href="/settings#study-goal"
            className="group flex items-center gap-2 rounded-[12px] border border-dashed border-[var(--primary)]/55 bg-[var(--primary-soft)]/50 px-3 py-2.5 transition-colors hover:bg-[var(--primary-soft)]"
          >
            <p className="flex-1 text-[12px] font-bold leading-snug text-[var(--primary-dark)]">
              学習プリセットを設定
              <span className="ml-1 text-[11px] font-medium text-[var(--text-2)]">
                目標期限までのペースを表示します
              </span>
            </p>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--primary-dark)] transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
        ) : goalSummary.daysUntilDeadline < 0 ? (
          <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              目標期限（{formatShortDeadline(goalSummary.deadlineISO)}）を
              過ぎました。残りは復習・模試にあてましょう。
            </p>
          </div>
        ) : goalSummary.remainingAnswers <= 0 ? (
          <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              設定した目標（{goalSummary.scopeLabel}・
              {goalSummary.config.rounds}周）に到達しました。
              プリセットを上げる、または復習に切り替えてもOKです。
            </p>
          </div>
        ) : goalSummary.paceAnswersPerDay !== null ? (
          <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-[var(--text-3)]">
              目標達成までのペース（{goalSummary.scopeLabel}・
              {goalSummary.config.rounds}周）
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <MetricCell
                label="1日"
                value={String(goalSummary.paceAnswersPerDay)}
                unit="問以上"
              />
              <MetricCell
                label="残り"
                value={goalSummary.remainingAnswers.toLocaleString()}
                unit="問"
              />
              <MetricCell
                label={`${formatShortDeadline(goalSummary.deadlineISO)}まで`}
                value={String(goalSummary.daysUntilDeadline)}
                unit="日"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              ペースが計算できませんでした。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="min-w-0 rounded-[10px] bg-[var(--bg-card)] px-2 py-1.5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="truncate text-[10px] font-semibold text-[var(--text-3)]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[16px] font-extrabold leading-none text-[var(--text-1)] tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] font-bold text-[var(--text-3)]">
          {unit}
        </span>
      </p>
    </div>
  );
}

/** "5/20" 形式の短い日付ラベル */
function formatShortDeadline(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, , m, d] = match;
  return `${Number(m)}/${Number(d)}`;
}
