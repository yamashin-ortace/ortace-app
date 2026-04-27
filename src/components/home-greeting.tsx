"use client";

import * as React from "react";
import { APP_VISITED_KEY, getHomeGreetingLines } from "@/lib/home-greeting";

/**
 * 挨拶はクライアントの時刻・localStorage に依存。SSR との差分を避けるため、確定前はプレースホルダ。
 */
export function HomeGreeting() {
  const [lines, setLines] = React.useState<{ eyebrow: string; headline: string } | null>(null);

  // localStorage ・端末時刻の参照は初回クライアント描画直後の一度だけ
  React.useEffect(() => {
    let hasVisitedBefore = true;
    try {
      hasVisitedBefore = window.localStorage.getItem(APP_VISITED_KEY) === "1";
    } catch {
      hasVisitedBefore = true;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部（localStorage）を読み挨拶を確定する必要がある
    setLines(getHomeGreetingLines(new Date(), hasVisitedBefore));

    if (!hasVisitedBefore) {
      try {
        window.localStorage.setItem(APP_VISITED_KEY, "1");
      } catch {
        // プライベートブラウズ等
      }
    }
  }, []);

  return (
    <section aria-live="polite" aria-busy={!lines}>
      <p className="min-h-[1.25rem] text-sm text-[var(--text-3)]" suppressHydrationWarning>
        {lines?.eyebrow ?? " "}
      </p>
      <h1
        className="mt-1 min-h-[2.1rem] text-[20px] font-bold leading-snug tracking-tight text-[var(--text-1)] sm:min-h-[2.5rem] sm:text-[24px]"
        suppressHydrationWarning
      >
        {lines?.headline ?? " "}
      </h1>
    </section>
  );
}
