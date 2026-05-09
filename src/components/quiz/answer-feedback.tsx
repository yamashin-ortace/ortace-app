"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type Props = {
  question: Question;
  judgement: AnswerJudgement;
  variant?: "banner" | "explanation";
};

/**
 * 解答結果（バナー）または解説の表示
 *
 * - variant="banner"：選択肢の上に置く中央寄せピル型バナー
 * - variant="explanation"：選択肢の下に置く解説カード
 */
export function AnswerFeedback({
  question,
  judgement,
  variant = "banner",
}: Props) {
  if (variant === "banner") {
    return <FeedbackBanner question={question} judgement={judgement} />;
  }
  return <Explanation explanation={question.explanation} />;
}

function FeedbackBanner({
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
          "flex items-center justify-center gap-2 rounded-full px-6 py-3 text-center",
          "bg-[#4CAF7A] text-white shadow-[0_4px_14px_rgba(76,175,122,0.35)]",
        )}
      >
        <CheckCircle2 className="h-6 w-6 shrink-0" strokeWidth={2.5} />
        <span className="text-[16px] font-extrabold tracking-wide">正解</span>
      </div>
    );
  }

  if (judgement === "incorrect") {
    return (
      <div
        className={cn(
          "animate-feedback-in",
          "flex items-center justify-center gap-3 rounded-full px-6 py-3 text-center",
          "bg-[#D84848] text-white shadow-[0_4px_14px_rgba(216,72,72,0.35)]",
        )}
      >
        <XCircle className="h-6 w-6 shrink-0" strokeWidth={2.5} />
        <span className="text-[16px] font-extrabold tracking-wide">不正解</span>
        <span className="text-[12px] font-bold opacity-95">
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
        "flex items-start gap-2 rounded-[12px] border-2 border-amber-500 bg-amber-50 px-4 py-3",
        "dark:bg-amber-950/40",
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        strokeWidth={2.5}
      />
      <div className="space-y-0.5">
        <p className="text-[14px] font-bold text-amber-900 dark:text-amber-200">
          正答未確定
        </p>
        <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-300">
          試験委員会により出題ミス認定された問題です。正答が定まっていません。
        </p>
      </div>
    </div>
  );
}

function Explanation({ explanation }: { explanation: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] p-4">
      <h3 className="mb-2 text-[12px] font-bold tracking-wider text-[var(--text-3)] uppercase">
        解説
      </h3>
      <p className="text-[14px] leading-7 whitespace-pre-wrap text-[var(--text-1)]">
        {explanation}
      </p>
    </div>
  );
}
