"use client";

import { RotateCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** 「Try #N」の N に当たる値 */
  attemptNumber: number;
  className?: string;
};

/**
 * 解答前/解答後の問題ヘッダーに置く、軽量な「Try #N」バッジ。
 * - 初回 (#1) は新しい挑戦感、2回目以降 (#2+) は再挑戦感のアイコンに切り替える。
 */
export function AttemptCountBadge({ attemptNumber, className }: Props) {
  const isFirst = attemptNumber <= 1;
  const Icon = isFirst ? Sparkles : RotateCw;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-dark)]",
        className,
      )}
      aria-label={isFirst ? "初挑戦" : `${attemptNumber}回目の挑戦`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      Try #{attemptNumber}
    </span>
  );
}
