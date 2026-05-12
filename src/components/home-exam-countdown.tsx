"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Flag, Settings2 } from "lucide-react";
import { formatExamDateLabel, getDaysUntilExam } from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import {
  formatGoalDeadlineLabel,
  summarizeStudyGoal,
} from "@/lib/study-goal";
import { useLifetimeAnswerCount } from "@/lib/study-goal/use-lifetime-answer-count";
import { useStudyGoalPreset } from "@/lib/study-goal/use-study-goal-preset";

type Props = {
  /** 過去問の総問題数（プリセットの目標総解答数を組み立てる母数） */
  totalQuestions: number;
};

export function HomeExamCountdown({ totalQuestions }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const { examDate } = useExamDate();
  const { preset } = useStudyGoalPreset();
  const { count: lifetimeAnswers } = useLifetimeAnswerCount();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const daysLeft = useMemo(() => getDaysUntilExam(examDate), [examDate]);

  const goalSummary = useMemo(
    () =>
      summarizeStudyGoal({
        preset,
        examDateISO: examDate,
        pastQuestionsTotal: totalQuestions,
        lifetimeAnswers,
      }),
    [preset, examDate, totalQuestions, lifetimeAnswers],
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

        <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
          {!hydrated ? (
            <p className="text-[11px] text-[var(--text-3)]">計算中…</p>
          ) : goalSummary === null ? (
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              学習プリセットを選ぶと、目標期限までのペースがここに出ます。
              <Link
                href="/settings#study-goal"
                className="ml-1 font-semibold text-[var(--primary-dark)] underline-offset-2 hover:underline"
              >
                設定を開く
              </Link>
            </p>
          ) : goalSummary.daysUntilDeadline < 0 ? (
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              目標期限（{formatGoalDeadlineLabel(goalSummary.deadlineISO)}）を
              過ぎました。残りは復習・模試にあてましょう。
            </p>
          ) : goalSummary.remainingAnswers <= 0 ? (
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              「{goalSummary.preset.label}」の目標総解答に到達しました。
              プリセットを上げる、または復習に切り替えてもOKです。
            </p>
          ) : goalSummary.paceAnswersPerDay !== null ? (
            <>
              <p className="text-[11px] font-semibold text-[var(--text-3)]">
                目標達成までのペース（{goalSummary.preset.label}）
              </p>
              <p className="mt-0.5 text-[16px] font-extrabold text-[var(--text-1)]">
                1日 約 {goalSummary.paceAnswersPerDay}問
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)] tabular-nums">
                目標期限：{formatGoalDeadlineLabel(goalSummary.deadlineISO)}
                （あと {goalSummary.daysUntilDeadline}日）／
                残り {goalSummary.remainingAnswers.toLocaleString()}問
                <span className="text-[var(--text-3)]">
                  （累計 {lifetimeAnswers.toLocaleString()} ／ 目標{" "}
                  {goalSummary.targetAnswers.toLocaleString()}問）
                </span>
              </p>
            </>
          ) : (
            <p className="text-[11px] leading-snug text-[var(--text-2)]">
              ペースが計算できませんでした。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
