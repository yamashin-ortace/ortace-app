import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * DESIGN.md 準拠のメインCTAボタン
 * - 角丸12px / パディング14px 24px
 * - プライマリ色＋影
 * - 押下感アニメ（btn-pressable + btn-primary-shadow）
 *
 * 用途：「出題開始」「ログイン」など各画面の最重要アクション。
 */
export function PrimaryCta({ className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        "btn-pressable btn-primary-shadow",
        "inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-6 py-3.5",
        "text-[16px] font-bold text-white",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
