"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { NAVIGATION_PENDING_EVENT } from "@/lib/navigation-pending";

const SHOW_DELAY_MS = 120;
const MAX_PENDING_MS = 8000;

export function NavigationPendingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setPending(false);
  }, []);

  const startPending = useCallback(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);

    showTimerRef.current = setTimeout(() => {
      setPending(true);
      showTimerRef.current = null;
    }, SHOW_DELAY_MS);
    maxTimerRef.current = setTimeout(clearPending, MAX_PENDING_MS);
  }, [clearPending]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      startPending();
    };

    const handleProgrammaticStart = () => startPending();

    document.addEventListener("click", handleClick, true);
    window.addEventListener(NAVIGATION_PENDING_EVENT, handleProgrammaticStart);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener(
        NAVIGATION_PENDING_EVENT,
        handleProgrammaticStart,
      );
      clearPending();
    };
  }, [clearPending, startPending]);

  useEffect(() => {
    const timer = setTimeout(clearPending, 0);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, clearPending]);

  if (!pending) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="処理中"
      className="fixed top-[calc(env(safe-area-inset-top,0px)+4rem)] left-1/2 z-[120] grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-border bg-[var(--bg-card)]/95 text-[var(--primary-dark)] shadow-lg backdrop-blur"
    >
      <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={2.5} />
    </div>
  );
}
