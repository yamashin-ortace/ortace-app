"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HeaderUserMenu({ nickname }: { nickname: string }) {
  const [salutation, setSalutation] = React.useState<string>("");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 端末時刻に依存するためマウント後に確定する必要がある
    setSalutation(getSalutation(new Date()));
  }, []);

  return (
    <Link
      href="/me"
      aria-label={`${nickname}さんのマイページへ`}
      className="group inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[12px] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
    >
      <span suppressHydrationWarning>
        <span className="hidden sm:inline">
          {salutation ? `${salutation}、` : ""}
        </span>
        {nickname}さん
      </span>
      <ChevronRight className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function getSalutation(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return "おはよう";
  if (hour >= 11 && hour < 18) return "こんにちは";
  return "こんばんは";
}
