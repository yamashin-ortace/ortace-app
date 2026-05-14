"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, LoaderCircle, Sparkles } from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { analyzeAiCoachSession } from "@/lib/ai-coach/session-analysis";

type Props = {
  questions: readonly Question[];
  judgements: Readonly<Record<string, AnswerJudgement>>;
  selectedAnswers: Readonly<Record<string, ChoiceKey[]>>;
};

const STEPS = [
  "回答履歴を読み込み中",
  "正答率・自信度・解答時間を分析中",
  "AIテーマクラスタを確認中",
  "確認しておきたいテーマを選定中",
] as const;

export function AiCoachResultAnalysis({
  questions,
  judgements,
  selectedAnswers,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const isAnalyzing = stepIndex !== null && stepIndex < STEPS.length;
  const isDone = stepIndex !== null && stepIndex >= STEPS.length;

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

  const startAnalysis = () => {
    if (isAnalyzing) return;
    setStepIndex(0);
    for (let index = 1; index <= STEPS.length; index += 1) {
      window.setTimeout(() => setStepIndex(index), index * 520);
    }
  };

  return (
    <section className="rounded-[16px] border border-[var(--primary)]/25 bg-[var(--bg-card)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-[var(--text-1)]">
            AIコーチ分析
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-3)]">
            今回の{answeredCount}問から、確認しておきたいテーマを見つけます。
          </p>
        </div>
      </div>

      {!isDone ? (
        <div className="mt-4 space-y-3">
          {isAnalyzing ? (
            <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/50 px-3 py-3">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--text-1)]">
                <LoaderCircle
                  className="h-4 w-4 animate-spin text-[var(--primary-dark)]"
                  strokeWidth={2.5}
                />
                {STEPS[Math.min(stepIndex ?? 0, STEPS.length - 1)]}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="choice-pressable flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)] disabled:opacity-70"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            AIコーチに分析してもらう
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-[var(--primary)]/20 bg-[var(--primary-soft)]/45 px-3 py-3">
            {analysis.clusterLabel ? (
              <p className="mb-1 text-[11px] font-bold text-[var(--primary-dark)]">
                注目テーマ: {analysis.clusterLabel}
              </p>
            ) : null}
            <p className="text-[13px] leading-relaxed text-[var(--text-1)]">
              {analysis.message}
            </p>
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
      )}
    </section>
  );
}
