"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  Brain,
  ChevronRight,
  CircleHelp,
  FileText,
  NotebookText,
  Target,
} from "lucide-react";
import { useStudyItemsLists } from "@/lib/study-items/use-study-items";
import {
  BOOKMARK_STUDY_MODES,
  type BookmarkStudyMode,
} from "@/lib/study-items/study-modes";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

const MODE_VISUAL: Record<
  BookmarkStudyMode["id"],
  { icon: LucideIcon; tone: string }
> = {
  unknown: {
    icon: CircleHelp,
    tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  weak: {
    icon: Target,
    tone: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  },
  memorize: {
    icon: Brain,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  class_note: {
    icon: NotebookText,
    tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  notes: {
    icon: FileText,
    tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
};

/**
 * 学習タブの「ブックマーク・ノートから出題」セクション。
 * 5項目（わかんない／ニガテ／覚える／授業メモ／ノート）を1枚カードにまとめ、
 * 区切り線で軽く分けた縦リストとして見せる。
 */
export function BookmarkSetSection() {
  const { bookmarks, notes } = useStudyItemsLists();

  const counts: Record<BookmarkStudyMode["id"], number> = {
    unknown: 0,
    weak: 0,
    memorize: 0,
    class_note: 0,
    notes: notes.length,
  };
  for (const b of bookmarks) {
    for (const c of b.categories) {
      if (c in counts) {
        counts[c as keyof typeof counts] += 1;
      }
    }
  }

  return (
    <section className="rounded-[14px] border border-border bg-[var(--bg-card)] px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          ブックマーク・ノートから出題
        </h2>
        <Link
          href="/records"
          className="text-[11px] font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
        >
          一覧を見る
        </Link>
      </div>
      <ul className="divide-y divide-border/70">
        {BOOKMARK_STUDY_MODES.map((mode) => {
          const visual = MODE_VISUAL[mode.id];
          const Icon = visual.icon;
          const count = counts[mode.id];
          return (
            <li key={mode.id}>
              <Link
                href={mode.href}
                className="group -mx-1 flex items-center gap-3 rounded-[10px] px-1 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-muted)]/50"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${visual.tone}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--text-1)]">
                    {mode.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">
                    {mode.summary}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-[var(--text-3)] tabular-nums">
                  <span className="text-[14px] font-extrabold text-[var(--text-1)]">
                    {count}
                  </span>
                  問
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
