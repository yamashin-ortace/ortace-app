"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Home, RotateCw } from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { AiCoachResultAnalysis } from "./ai-coach-result-analysis";
import { QuestionReviewItem } from "./question-review-item";

type Props = {
  questions: Question[];
  judgements: Record<string, AnswerJudgement>;
  selectedAnswers: Record<string, ChoiceKey[]>;
  /** 未指定時は「もう一度」ボタンを表示しない */
  onRestart?: () => void;
  /** 結果画面下部の戻り先リンク。既定は学習タブ */
  backHref?: string;
  backLabel?: string;
  showAiCoachAnalysis?: boolean;
};

export function QuizResultScreen({
  questions,
  judgements,
  selectedAnswers,
  onRestart,
  backHref = "/study",
  backLabel = "学習タブへ戻る",
  showAiCoachAnalysis = true,
}: Props) {
  const [reviewOpen, setReviewOpen] = useState(true);
  const [showToast, setShowToast] = useState(true);
  const total = questions.length;
  const correct = questions.filter(
    (q) => judgements[q.id] === "correct",
  ).length;
  const incorrect = questions.filter(
    (q) => judgements[q.id] === "incorrect",
  ).length;
  const noAnswer = questions.filter(
    (q) => judgements[q.id] === "no_answer",
  ).length;
  const ratio = total === 0 ? 0 : Math.round((correct / total) * 100);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowToast(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {showToast ? (
        <div className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+72px)] left-1/2 z-40 -translate-x-1/2 animate-feedback-in rounded-full bg-[var(--text-1)] px-4 py-2 text-[13px] font-bold text-[var(--bg-card)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
          おつかれさま。{total}問完了しました
        </div>
      ) : null}

      <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
              正答率
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--text-2)] tabular-nums">
              {correct} / {total}問正解
            </p>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-1)]">
            <CheckCircle2
              className="h-5 w-5 text-[#4CAF7A]"
              strokeWidth={2.5}
              aria-hidden
            />
            <p className="text-[34px] font-extrabold tracking-tight tabular-nums">
              {ratio}
              <span className="text-[16px] font-bold text-[var(--text-3)]">%</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="正解" value={correct} colorClass="text-[#1F5E3F]" />
        <StatTile
          label="不正解"
          value={incorrect}
          colorClass="text-[#9B1E1E]"
        />
        <StatTile
          label="正答なし"
          value={noAnswer}
          colorClass="text-amber-700 dark:text-amber-400"
        />
      </div>

      {showAiCoachAnalysis ? (
        <AiCoachResultAnalysis
          questions={questions}
          judgements={judgements}
          selectedAnswers={selectedAnswers}
        />
      ) : null}

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setReviewOpen((v) => !v)}
          aria-expanded={reviewOpen}
          className="flex w-full items-center justify-between rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5 text-left"
        >
          <span className="text-[13px] font-semibold text-[var(--text-2)]">
            問題ごとに見直す（{total}問）
          </span>
          <span className="text-[var(--text-3)]">
            {reviewOpen ? (
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            )}
          </span>
        </button>
        {reviewOpen ? (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <QuestionReviewItem
                key={question.id}
                index={index}
                total={total}
                question={question}
                judgement={judgements[question.id]}
                selected={selectedAnswers[question.id] ?? []}
              />
            ))}
          </div>
        ) : null}
      </section>

      <div className="space-y-3">
        {onRestart ? (
          <PrimaryCta onClick={onRestart}>
            <RotateCw className="h-4 w-4" strokeWidth={2.5} />
            もう一度
          </PrimaryCta>
        ) : null}
        <Link
          href={backHref}
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-6 py-3 text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] py-3 text-center">
      <p className="text-[10px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
        {label}
      </p>
      <p className={`mt-0.5 text-[22px] font-extrabold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
