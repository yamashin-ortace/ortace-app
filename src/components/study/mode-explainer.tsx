"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  /** デフォルトで開いた状態にするか */
  defaultOpen?: boolean;
  children: ReactNode;
};

export function ModeExplainer({
  title = "出題の仕組み",
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-2)]">
          <Info className="h-3.5 w-3.5 text-[var(--text-3)]" strokeWidth={2.5} />
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--text-3)] transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
          strokeWidth={2.5}
        />
      </button>
      {open ? (
        <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
          {children}
        </div>
      ) : null}
    </section>
  );
}
