import Link from "next/link";
import { Shuffle, ChevronRight } from "lucide-react";

export function RandomModeCard() {
  return (
    <Link
      href="/study/random"
      className="group flex items-center gap-3 rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-white">
        <Shuffle className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[15px] font-bold tracking-tight text-[var(--text-1)]">
          ランダム出題
        </span>
        <span className="mt-0.5 text-[11px] text-[var(--text-3)]">
          全1,500問から指定数をシャッフル
        </span>
      </div>
      <ChevronRight
        className="h-4 w-4 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}
