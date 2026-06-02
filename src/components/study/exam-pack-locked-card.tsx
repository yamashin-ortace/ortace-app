import Link from "next/link";
import { ChevronRight, LockKeyhole } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export function ExamPackLockedCard({
  title = "国試対策パックで、直前期の仕上げまで",
  description = "テーマ別3問チェック、中分類の弱点深掘り、オリジナル問題、75問模試、直近テーマ対策を利用できます。",
}: Props) {
  return (
    <Link
      href="/plans"
      className="group flex items-center gap-3 rounded-[16px] border border-[var(--primary)]/30 bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-[var(--primary)]/55 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        <LockKeyhole className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-extrabold tracking-tight">{title}</p>
          <span className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary-dark)]">
            国試対策パック
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          {description}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[var(--primary-dark)] transition-transform group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}
