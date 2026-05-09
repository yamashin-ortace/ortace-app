"use client";

import Link from "next/link";
import { Trophy, RotateCw, Home } from "lucide-react";
import type { Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { PrimaryCta } from "@/components/ui/primary-cta";

type Props = {
  questions: Question[];
  judgements: Record<string, AnswerJudgement>;
  onRestart: () => void;
};

export function QuizResultScreen({ questions, judgements, onRestart }: Props) {
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

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <Trophy className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[var(--text-1)]">
          おつかれさま
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">{total}問の演習を完了</p>
      </div>

      <div className="rounded-[16px] border border-border bg-[var(--bg-card)] p-6 text-center">
        <p className="text-[12px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
          正答率
        </p>
        <p className="mt-1 text-[44px] font-extrabold tracking-tight text-[var(--text-1)] tabular-nums">
          {ratio}
          <span className="text-[20px] font-bold text-[var(--text-3)]">%</span>
        </p>
        <p className="mt-1 text-[14px] text-[var(--text-2)] tabular-nums">
          {correct} / {total}問正解
        </p>
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

      <div className="space-y-3">
        <PrimaryCta onClick={onRestart}>
          <RotateCw className="h-4 w-4" strokeWidth={2.5} />
          もう一度
        </PrimaryCta>
        <Link
          href="/study"
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-6 py-3 text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          学習タブへ戻る
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
