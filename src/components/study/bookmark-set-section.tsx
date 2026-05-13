"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useStudyItemsLists } from "@/lib/study-items/use-study-items";
import {
  BOOKMARK_STUDY_MODES,
  type BookmarkStudyMode,
} from "@/lib/study-items/study-modes";

/**
 * 学習タブ最下部の「ブックマーク・ノートから出題」セクション。
 * 既存の演習モードよりも控えめな視覚階層（グレートーン・小さい文字）で表示する。
 *
 * 各モードの該当数（ブックマーク件数・ノート件数）を併記し、まだ蓄積がないモードは
 * 数字を非表示にして「蓄積されたら使ってね」感を残す。
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
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
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
      <ul className="space-y-1.5">
        {BOOKMARK_STUDY_MODES.map((mode) => {
          const count = counts[mode.id];
          return (
            <li key={mode.id}>
              <Link
                href={mode.href}
                className="group flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-card)]/60 px-3 py-2.5 transition-colors hover:bg-[var(--bg-muted)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--text-2)] group-hover:text-[var(--text-1)]">
                    {mode.label}
                    {count > 0 ? (
                      <span className="ml-1.5 text-[11px] font-medium text-[var(--text-3)] tabular-nums">
                        {count}問
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">
                    {mode.summary}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
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
