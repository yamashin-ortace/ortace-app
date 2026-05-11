"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Circle,
  CircleAlert,
  X,
} from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  total: number;
  question: Question;
  judgement: AnswerJudgement | undefined;
  selected: ChoiceKey[];
};

const CHOICE_KEYS: ChoiceKey[] = ["1", "2", "3", "4", "5"];
const SESSION_LABEL = { am: "午前", pm: "午後" } as const;

export function QuestionReviewItem({
  index,
  total,
  question,
  judgement,
  selected,
}: Props) {
  const [open, setOpen] = useState(false);
  const correctSet = new Set(question.correctAnswers);
  const userSelectionLabel =
    selected.length === 0
      ? "未回答"
      : selected.map((k) => `${k}`).join("・");
  const correctLabel = question.correctAnswers.join("・");

  return (
    <article className="rounded-[12px] border border-border bg-[var(--bg-card)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums",
            judgement === "correct"
              ? "bg-[#E6F5EC] text-[#1F5E3F] dark:bg-[#1F3329] dark:text-[#8FE5B4]"
              : judgement === "incorrect"
                ? "bg-[#FDECEC] text-[#9B1E1E] dark:bg-[#3A1F1F] dark:text-[#FF9999]"
                : "bg-[var(--bg-muted)] text-[var(--text-3)]",
          )}
        >
          {judgement === "correct" ? (
            <Circle className="h-4 w-4" strokeWidth={3} />
          ) : judgement === "incorrect" ? (
            <X className="h-4 w-4" strokeWidth={3} />
          ) : (
            <CircleAlert className="h-4 w-4" strokeWidth={2.5} />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[11px] font-medium text-[var(--text-3)] tabular-nums">
            {index + 1} / {total}・第{question.round}回 {SESSION_LABEL[question.session]} 問{question.displayNumber}
          </p>
          <p className="truncate text-[13px] font-bold text-[var(--text-1)]">
            {question.questionText.replace(/\n/g, " ")}
          </p>
          <p className="text-[11px] text-[var(--text-3)]">
            あなた：{userSelectionLabel} ／ 正解：{correctLabel}
          </p>
        </div>
        <span className="grid h-6 w-6 shrink-0 place-items-center text-[var(--text-3)]">
          {open ? (
            <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
          )}
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-1)]">
            {question.questionText}
          </p>

          <ul className="space-y-1.5">
            {CHOICE_KEYS.map((key) => {
              const text = question.choices[key];
              if (!text) return null;
              const isCorrect = correctSet.has(key);
              const isSelected = selected.includes(key);
              return (
                <li
                  key={key}
                  className={cn(
                    "flex items-start gap-2 rounded-[10px] border px-3 py-2 text-[13px] leading-relaxed",
                    isCorrect
                      ? "border-[#4CAF7A]/60 bg-[#E6F5EC]/70 text-[#1F5E3F] dark:bg-[#1F3329]/70 dark:text-[#8FE5B4]"
                      : isSelected
                        ? "border-[#D84848]/60 bg-[#FDECEC]/70 text-[#9B1E1E] dark:bg-[#3A1F1F]/70 dark:text-[#FF9999]"
                        : "border-border bg-[var(--bg-card)] text-[var(--text-2)]",
                  )}
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/60 text-[11px] font-bold tabular-nums text-[var(--text-1)] dark:bg-black/30">
                    {key}
                  </span>
                  <span className="flex-1">{text}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 pt-0.5 text-[10px] font-bold tabular-nums">
                    {isCorrect ? (
                      <span className="rounded-full bg-[#4CAF7A] px-1.5 py-0.5 text-white">
                        正解
                      </span>
                    ) : null}
                    {isSelected && !isCorrect ? (
                      <span className="rounded-full bg-[#D84848] px-1.5 py-0.5 text-white">
                        あなた
                      </span>
                    ) : null}
                    {isSelected && isCorrect ? (
                      <span className="rounded-full bg-[#1F5E3F]/15 px-1.5 py-0.5 text-[#1F5E3F] dark:bg-[#8FE5B4]/15 dark:text-[#8FE5B4]">
                        あなた
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>

          {question.explanation ? (
            <div className="rounded-[10px] border border-border bg-[var(--bg-muted)]/40 px-3 py-2.5">
              <p className="text-[11px] font-bold text-[var(--text-3)]">解説</p>
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--text-2)]">
                {question.explanation}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
