"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Home,
  RotateCw,
  XCircle,
} from "lucide-react";
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
    const timer = window.setTimeout(() => setShowToast(false), 4400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {showToast ? (
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-40 grid w-[min(calc(100vw-48px),360px)] animate-result-toast place-items-center overflow-hidden rounded-[22px] border border-white/35 bg-linear-to-br from-[#2F7D6F] via-[#4B9D88] to-[#7EC9B2] px-6 py-4 text-center text-white shadow-[0_22px_52px_rgba(47,125,111,0.32)] backdrop-blur-md dark:border-white/15">
          <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/80 to-transparent" />
          <span className="pointer-events-none absolute -top-12 right-8 h-24 w-24 rounded-full bg-white/22 blur-2xl" />
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="relative mt-2 text-[16px] font-extrabold tracking-tight">
            おつかれさま
          </span>
          <span className="relative mt-0.5 text-[12px] font-bold text-white/90">
            {total}問の演習が完了しました
          </span>
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
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <StatTile
            label="正解"
            value={correct}
            icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-[#1F5E3F]"
            bgClass="bg-[#EAF7EF]"
          />
          <StatTile
            label="不正解"
            value={incorrect}
            icon={<XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-[#9B1E1E]"
            bgClass="bg-[#FDECEC]"
          />
          <StatTile
            label="正答なし"
            value={noAnswer}
            icon={<CircleSlash className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-amber-700 dark:text-amber-400"
            bgClass="bg-amber-50 dark:bg-amber-950/30"
          />
        </div>
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
  icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={`rounded-[12px] px-2.5 py-2.5 text-center ${bgClass}`}>
      <p
        className={`mx-auto grid h-6 w-6 place-items-center rounded-full bg-white/75 ${colorClass} dark:bg-white/10`}
      >
        {icon}
      </p>
      <p className="mt-1 text-[10px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
        {label}
      </p>
      <p className={`mt-0.5 text-[22px] font-extrabold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
