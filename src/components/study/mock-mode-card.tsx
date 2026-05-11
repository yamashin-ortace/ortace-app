import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";

export function MockModeCard() {
  return (
    <Link
      href="/study/mock"
      prefetch={false}
      aria-label="模試モードについて（準備中・説明のみ）"
      className="flex items-center gap-3 rounded-[16px] border border-dashed border-[var(--text-4)]/55 bg-[var(--bg-muted)]/50 p-4 text-[var(--text-1)] opacity-[0.92] shadow-none transition-colors duration-200 hover:border-[var(--text-4)] hover:bg-[var(--bg-muted)]/65 hover:opacity-100"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-[var(--text-4)]/25 bg-[var(--bg-card)] text-[var(--text-4)]">
        <Lock className="h-6 w-6" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-bold tracking-tight text-[var(--text-3)]">
            模試にチャレンジ
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--text-4)]/40 bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-4)]">
            準備中
          </span>
        </div>
        <span className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--text-4)]">
          12月中旬実装予定。いまは受験できません（仕様は説明ページで確認できます）
        </span>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[var(--text-4)]"
        strokeWidth={2.25}
      />
    </Link>
  );
}
