import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";

export function MockModeCard() {
  return (
    <Link
      href="/study/mock"
      prefetch={false}
      aria-label="模試モードについて（12月1日公開）"
      className="flex items-center gap-3 rounded-[16px] border border-[var(--primary)]/35 bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/55 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        <CalendarDays className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-extrabold tracking-tight text-[var(--text-1)]">
            模試にチャレンジ
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--primary)]/35 bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary-dark)]">
            12月1日公開
          </span>
        </div>
        <span className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--text-2)]">
          本番形式の75問模試を国試対策パックで解禁。出題内容とスコアレポートを確認できます
        </span>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[var(--primary-dark)]"
        strokeWidth={2.5}
      />
    </Link>
  );
}
