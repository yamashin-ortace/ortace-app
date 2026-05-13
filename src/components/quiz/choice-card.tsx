"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChoiceKey } from "@/lib/questions";

/**
 * 選択肢カードの状態
 *
 * - default：未選択・解答前
 * - selected：ユーザーが選択中（解答前）
 * - correct：解答後・選んだ選択肢が正解
 * - incorrect：解答後・選んだ選択肢が不正解（震えアニメ対象）
 * - revealed：解答後・選ばなかったが正解として表示
 * - dimmed：解答後・選ばなかった不正解選択肢
 */
export type ChoiceState =
  | "default"
  | "selected"
  | "correct"
  | "incorrect"
  | "revealed"
  | "dimmed";

type Props = {
  choiceKey: ChoiceKey;
  text: string;
  state: ChoiceState;
  onClick?: () => void;
  disabled?: boolean;
};

const STATE_STYLES: Record<ChoiceState, string> = {
  default:
    "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-3)]",
  selected:
    "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text-1)]",
  correct:
    "border-[#4CAF7A] bg-[#E6F5EC] text-[#1F5E3F] dark:bg-[#1F3329] dark:text-[#8FE5B4]",
  incorrect:
    "border-[#D84848] bg-[#FDECEC] text-[#9B1E1E] animate-shake dark:bg-[#3A1F1F] dark:text-[#FF9999]",
  revealed:
    "border-[#4CAF7A] bg-[#E6F5EC]/60 text-[#1F5E3F] dark:bg-[#1F3329]/60 dark:text-[#8FE5B4]",
  dimmed:
    "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-3)] opacity-60",
};

export function ChoiceCard({
  choiceKey,
  text,
  state,
  onClick,
  disabled,
}: Props) {
  const isInteractive = !disabled && state !== "correct" && state !== "incorrect";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !isInteractive}
      aria-pressed={state === "selected"}
      className={cn(
        "choice-pressable",
        "flex w-full items-center gap-3 rounded-[12px] border-2 px-[18px] py-4 text-left",
        "min-h-[56px]",
        "disabled:cursor-default",
        STATE_STYLES[state],
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px] font-bold tabular-nums",
          state === "selected" && "bg-[var(--primary)] text-white",
          state === "correct" && "bg-[#4CAF7A] text-white",
          state === "incorrect" && "bg-[#D84848] text-white",
          state === "revealed" &&
            "bg-[#4CAF7A]/40 text-[#1F5E3F] dark:bg-[#4CAF7A]/55 dark:text-white",
          (state === "default" || state === "dimmed") &&
            "bg-[var(--bg-muted)] text-[var(--text-2)]",
        )}
      >
        {choiceKey}
      </span>
      <span className="flex-1 text-[14px] leading-relaxed font-medium">
        {text}
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center">
        {state === "correct" || state === "revealed" ? (
          <CircleMark />
        ) : state === "incorrect" ? (
          <X
            className="h-6 w-6 stroke-[#D84848]"
            strokeWidth={3}
            aria-label="不正解"
          />
        ) : null}
      </span>
    </button>
  );
}

/** 日本式の○マーク（チェックではなく丸） */
function CircleMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-label="正解"
      role="img"
    >
      <circle cx="11" cy="11" r="8" stroke="#4CAF7A" strokeWidth="3" />
    </svg>
  );
}
