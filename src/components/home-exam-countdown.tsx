"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Flag, Settings2 } from "lucide-react";
import { formatExamDateLabel, getDaysUntilExam } from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { getAnswersPaceTowardGoal } from "@/lib/study-goal";
import { useLifetimeAnswerCount } from "@/lib/study-goal/use-lifetime-answer-count";
import { useStudyRoundsTarget } from "@/lib/study-goal/use-study-rounds-target";
import { cn } from "@/lib/utils";

type Props = {
  /** 収録している全問題数（周数目標の計算に使う） */
  totalQuestions: number;
};

export function HomeExamCountdown({ totalQuestions }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const { examDate, isCustom } = useExamDate();
  const { roundsTarget } = useStudyRoundsTarget();
  const { count: lifetimeAnswers } = useLifetimeAnswerCount();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const computed = useMemo(() => {
    const daysLeft = getDaysUntilExam(examDate);
    const goalTotalAnswers = Math.max(
      0,
      roundsTarget * Math.max(0, totalQuestions),
    );
    const remainingGoal = Math.max(0, goalTotalAnswers - lifetimeAnswers);
    /** 試験当日は「残り1日」のペース近似として扱う（本日分の目安まで） */
    const daysForGoalPace =
      daysLeft > 0 ? daysLeft : daysLeft === 0 ? 1 : null;
    const pace =
      isCustom && typeof daysForGoalPace === "number"
        ? getAnswersPaceTowardGoal(
            goalTotalAnswers,
            lifetimeAnswers,
            daysForGoalPace,
          )
        : null;
    return {
      daysLeft,
      pace,
      remainingGoal,
      goalTotalAnswers,
    };
  }, [examDate, isCustom, lifetimeAnswers, roundsTarget, totalQuestions]);

  const examLabel = formatExamDateLabel(examDate);

  const paceCaption = hydrated
    ? computed.daysLeft > 0
      ? `目標総解答までのこり ${computed.remainingGoal.toLocaleString()}問 ÷ ${computed.daysLeft}日・「${roundsTarget}周」`
      : computed.daysLeft === 0
        ? "本試験日当日までのひとつの目安です（過度な無理は避けましょう）"
        : null
    : null;

  return (
    <section>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        )}
      >
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
                computed.daysLeft >= 0 ? (
                  <>
                    あと{computed.daysLeft}
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
              {!isCustom ? "（仮）" : null}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/settings#study-goal"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-card)] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
              aria-label="目標周回を変更"
            >
              <Settings2 className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/settings#exam-date"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-card)] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
              aria-label="本試験日を変更"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
          {hydrated ? (
            !isCustom ? (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                受験予定日を設定すると、この下に「自分で決めた周回目標」に対する試験日までのペースが出ます（目標は設定の「試験日の下」を開いて変更できます）。
              </p>
            ) : computed.daysLeft < 0 ? (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                試験日以降はペース計算は出しません。振り返りにお使いください。
              </p>
            ) : computed.remainingGoal <= 0 ? (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                設定した総解答の目標に到達しました。別の周回へ上げても大丈夫です。
              </p>
            ) : computed.pace !== null ? (
              <>
                <p className="text-[11px] font-semibold text-[var(--text-3)]">
                  目標達成までのペース（累計解答ベース）
                </p>
                <p className="mt-0.5 text-[16px] font-extrabold text-[var(--text-1)]">
                  1日 約 {computed.pace}問
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
                  いままで {lifetimeAnswers.toLocaleString()}問 ／ 目標総解答{" "}
                  {computed.goalTotalAnswers.toLocaleString()}問
                  {paceCaption ? <>。{paceCaption}</> : null}
                  。（1日80問までで切りそろえた目安です）
                </p>
              </>
            ) : (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                試験日までのペースが計算できませんでした。
              </p>
            )
          ) : (
            <p className="text-[11px] text-[var(--text-3)]">計算中…</p>
          )}
        </div>
      </div>
    </section>
  );
}
