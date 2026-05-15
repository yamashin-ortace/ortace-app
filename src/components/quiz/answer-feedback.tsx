"use client";

import { CheckCircle2, XCircle, AlertTriangle, BookOpen } from "lucide-react";
import type { Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type Props = {
  question: Question;
  judgement: AnswerJudgement;
  variant?: "toast" | "explanation";
};

/**
 * 解答結果（バナー）または解説の表示
 *
 * - variant="toast"：レイアウトを伸ばさない固定表示
 * - variant="explanation"：選択肢の下に置く解説カード
 */
export function AnswerFeedback({
  question,
  judgement,
  variant = "toast",
}: Props) {
  if (variant === "toast") {
    return <FeedbackToast question={question} judgement={judgement} />;
  }
  return <Explanation explanation={question.explanation} />;
}

function FeedbackToast({
  question,
  judgement,
}: {
  question: Question;
  judgement: AnswerJudgement;
}) {
  const correctText = question.correctAnswers.join("・");

  if (judgement === "correct") {
    return (
      <div
        className={cn(
          "animate-feedback-in",
          "pointer-events-none fixed top-[calc(env(safe-area-inset-top)+72px)] left-1/2 z-40 -translate-x-1/2",
          "flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-center",
          "bg-[var(--success)] text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--success)_42%,transparent)]",
        )}
      >
        <CheckCircle2 className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
        <span className="text-[13px] font-extrabold tracking-wide">正解</span>
      </div>
    );
  }

  if (judgement === "incorrect") {
    return (
      <div
        className={cn(
          "animate-feedback-in",
          "pointer-events-none fixed top-[calc(env(safe-area-inset-top)+72px)] left-1/2 z-40 -translate-x-1/2",
          "flex items-center justify-center gap-2 rounded-full px-4 py-2 text-center",
          "bg-[var(--error)] text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--error)_42%,transparent)]",
        )}
      >
        <XCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
        <span className="text-[13px] font-extrabold tracking-wide">不正解</span>
        <span className="text-[11px] font-bold opacity-95">
          正答 {correctText}
        </span>
      </div>
    );
  }

  // no_answer
  return (
    <div
      className={cn(
        "animate-feedback-in",
        "pointer-events-none fixed top-[calc(env(safe-area-inset-top)+72px)] left-1/2 z-40 -translate-x-1/2",
        "flex items-center gap-2 rounded-full border border-amber-500 bg-amber-50 px-4 py-2 shadow-[0_4px_14px_rgba(180,83,9,0.18)]",
        "dark:bg-amber-950",
      )}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        strokeWidth={2.5}
      />
      <p className="text-[12px] font-bold text-amber-900 dark:text-amber-200">
        正答なし
      </p>
    </div>
  );
}

function Explanation({ explanation }: { explanation: string }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border-2 border-[var(--primary)]/30 bg-[var(--bg-card)] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--primary)]"
      />
      <div className="mb-2.5 flex items-center gap-1.5 pl-2">
        <BookOpen
          className="h-4 w-4 text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
        <h3 className="text-[14px] font-extrabold tracking-tight text-[var(--primary-dark)]">
          解説
        </h3>
      </div>
      <p className="pl-2 text-[15px] leading-[1.85] font-medium whitespace-pre-wrap text-[var(--text-1)]">
        {explanation}
      </p>
    </div>
  );
}
