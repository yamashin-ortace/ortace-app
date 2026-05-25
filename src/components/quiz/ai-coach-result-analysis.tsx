"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { analyzeAiCoachSession } from "@/lib/ai-coach/session-analysis";

type Props = {
  questions: readonly Question[];
  judgements: Readonly<Record<string, AnswerJudgement>>;
  selectedAnswers: Readonly<Record<string, ChoiceKey[]>>;
};

export function AiCoachResultAnalysis({
  questions,
  judgements,
  selectedAnswers,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const answeredCount = useMemo(
    () =>
      questions.filter((question) => {
        const judgement = judgements[question.id];
        return judgement && selectedAnswers[question.id]?.length;
      }).length,
    [judgements, questions, selectedAnswers],
  );

  const analysis = useMemo(
    () => analyzeAiCoachSession(questions, judgements, entries),
    [entries, judgements, questions],
  );

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-[var(--primary)]/25 bg-[var(--bg-card)] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[var(--primary)]/55 to-transparent" />
      <div className="pointer-events-none absolute -top-20 right-6 h-28 w-28 rounded-full bg-[var(--primary)]/10 blur-2xl" />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-linear-to-br from-[var(--primary-soft)] to-white text-[var(--primary-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_5px_14px_rgba(0,0,0,0.08)] dark:to-[var(--bg-card)]">
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-[var(--text-1)]">
            MiLu先生のひとこと分析
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-3)]">
            今回の{answeredCount}問から、次に確認したいテーマを整理しました。
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-[12px] border border-[var(--primary)]/20 bg-[var(--primary-soft)]/45 px-3 py-3">
          {analysis.clusterLabel ? (
            <p className="mb-1 text-[11px] font-bold text-[var(--primary-dark)]">
              注目テーマ候補: {analysis.clusterLabel}
            </p>
          ) : null}
          <p className="text-[13px] leading-relaxed text-[var(--text-1)]">
            {analysis.message}
          </p>
          {analysis.details.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {analysis.details.map((detail) => (
                <p
                  key={detail}
                  className="rounded-[10px] bg-[var(--bg-card)]/75 px-2.5 py-2 text-[12px] leading-relaxed text-[var(--text-2)]"
                >
                  {detail}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        {analysis.actionHref && analysis.actionLabel ? (
          <Link
            href={analysis.actionHref}
            className="choice-pressable flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
          >
            {analysis.actionLabel}
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
