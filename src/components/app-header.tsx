"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[var(--bg-base)]/90 px-5 backdrop-blur">
      <Link href="/" className="flex items-baseline gap-1">
        <span className="text-[20px] font-extrabold tracking-tight text-[var(--navy)]">
          ORT
        </span>
        <span className="text-[20px] font-extrabold tracking-tight text-[var(--primary)]">
          ACE
        </span>
      </Link>
      <Link
        href="/settings"
        aria-label="設定"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)]"
      >
        <Settings className="h-[22px] w-[22px]" strokeWidth={2} />
      </Link>
    </header>
  );
}
