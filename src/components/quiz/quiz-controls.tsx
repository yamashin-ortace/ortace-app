"use client";

import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
};

const BTN_BASE =
  "choice-pressable flex h-14 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-40";

/**
 * 下部ナビゲーション：戻る／次へ（または結果を見る）
 *
 * - 等幅で横並び・タップ領域 h-14（56px）
 * - 解答してなくても次へで進める
 * - 解答済みは右ボタンを強調（プライマリ色）
 */
export function QuizControls({
  canPrev,
  canNext,
  isLast,
  onPrev,
  onNext,
  onFinish,
}: Props) {
  return (
    <div className="flex items-stretch gap-3 pt-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className={cn(
          BTN_BASE,
          "border border-border bg-[var(--bg-card)] text-[var(--text-1)]",
        )}
        aria-label="前の問題へ"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        <span>戻る</span>
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onFinish}
          className={cn(
            BTN_BASE,
            "bg-[var(--primary)] text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]",
          )}
        >
          <Flag className="h-4 w-4" strokeWidth={2.5} />
          <span>結果を見る</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={cn(
            BTN_BASE,
            "border border-border bg-[var(--bg-card)] text-[var(--text-1)]",
          )}
          aria-label="次の問題へ"
        >
          <span>次へ</span>
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
