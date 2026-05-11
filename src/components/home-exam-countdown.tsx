"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Flag } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  formatExamDateLabel,
  getDaysUntilExam,
  getRecommendedDailyPace,
} from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { cn } from "@/lib/utils";

type Props = {
  /** 全問題数（推奨ペース計算の母数） */
  totalQuestions: number;
};

export function HomeExamCountdown({ totalQuestions }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const { entries } = useAnswerHistoryList();
  const { examDate, isCustom } = useExamDate();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const computed = useMemo(() => {
    if (!hydrated) {
      return { daysLeft: 0, pace: null as number | null, untouched: 0 };
    }
    const daysLeft = getDaysUntilExam(examDate);
    const answered = new Set(entries.map((entry) => entry.id));
    const untouched = Math.max(0, totalQuestions - answered.size);
    const pace = getRecommendedDailyPace(untouched, daysLeft);
    return { daysLeft, pace, untouched };
  }, [hydrated, examDate, entries, totalQuestions]);

  const examLabel = formatExamDateLabel(examDate);

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
          <Link
            href="/settings#exam-date"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-card)] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
            aria-label="本試験日を変更"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5">
          {hydrated ? (
            computed.pace !== null ? (
              <>
                <p className="text-[11px] font-semibold text-[var(--text-3)]">
                  推奨ペース（未着手を試験日までに埋める目安）
                </p>
                <p className="mt-0.5 text-[16px] font-extrabold text-[var(--text-1)]">
                  1日 {computed.pace}問
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
                  未着手 {computed.untouched.toLocaleString()}問 ÷ 残り{" "}
                  {computed.daysLeft}日（1日20問まで）
                </p>
              </>
            ) : !isCustom ? (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                受験予定日を設定すると、毎日のペースが出ます。
              </p>
            ) : (
              <p className="text-[11px] leading-snug text-[var(--text-2)]">
                未着手の問題はもうありません。お疲れさまです！
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
