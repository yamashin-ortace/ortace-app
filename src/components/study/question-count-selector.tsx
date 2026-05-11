"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export const ALLOWED_COUNTS = [10, 15, 20] as const;
export type AllowedCount = (typeof ALLOWED_COUNTS)[number];

const DEFAULT_COUNT: AllowedCount = 20;

export function isAllowedCount(value: number): value is AllowedCount {
  return (ALLOWED_COUNTS as readonly number[]).includes(value);
}

export function parseCountFromSearchParams(
  raw: string | null | undefined,
  fallback: AllowedCount = DEFAULT_COUNT,
): AllowedCount {
  if (!raw) return fallback;
  const n = Number(raw);
  if (Number.isFinite(n) && isAllowedCount(n)) return n;
  return fallback;
}

type Props = {
  /** 既定値（URL に count が無いときに有効になる値） */
  defaultCount?: AllowedCount;
  className?: string;
};

/**
 * 出題数を 10 / 15 / 20 から選ぶチップ群。
 * URL の `?count=N` を真実の値とし、選択するとそのページに `count` 付きで遷移する。
 * 出題数を変えるとそのモードのセッションが選び直されるため、本UIは player の前に置く。
 */
export function QuestionCountSelector({
  defaultCount = DEFAULT_COUNT,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = parseCountFromSearchParams(searchParams.get("count"), defaultCount);

  const hrefForCount = useMemo(
    () => (count: AllowedCount) => {
      const params = new URLSearchParams(searchParams.toString());
      if (count === defaultCount) {
        params.delete("count");
      } else {
        params.set("count", String(count));
      }
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [defaultCount, pathname, searchParams],
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[14px] border border-border bg-[var(--bg-card)] px-3 py-2 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <span className="text-[12px] font-semibold text-[var(--text-3)]">
        出題数
      </span>
      <div
        role="group"
        aria-label="出題数を変更"
        className="flex items-center gap-1"
      >
        {ALLOWED_COUNTS.map((count) => {
          const isActive = count === current;
          return (
            <button
              key={count}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (isActive) return;
                router.replace(hrefForCount(count), { scroll: false });
              }}
              className={cn(
                "min-w-[3.25rem] rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-[var(--bg-muted)] text-[var(--text-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-dark)]",
              )}
            >
              {count}問
            </button>
          );
        })}
      </div>
      <span className="ml-auto text-[10px] text-[var(--text-3)]">
        変えると出題し直し
      </span>
    </div>
  );
}
