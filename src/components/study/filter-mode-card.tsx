import Link from "next/link";
import { ChevronRight, SlidersHorizontal } from "lucide-react";

export function FilterModeCard() {
  return (
    <Link
      href="/study/filter"
      className="group flex items-center gap-3 rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-white">
        <SlidersHorizontal className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[15px] font-bold tracking-tight text-[var(--text-1)]">
          絞り込み演習
        </span>
        <span className="mt-0.5 text-[11px] text-[var(--text-3)]">
          回・午前午後・分野・問題数を指定
        </span>
      </div>
      <ChevronRight
        className="h-4 w-4 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}
