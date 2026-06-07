"use client";

import { useEffect } from "react";
import { ACCOUNT_STORAGE_USER_ID_KEY } from "@/lib/auth/account-storage";

type Props = {
  userId: string | null;
};

const SYNC_EVENTS = [
  "ortace:answer-history-updated",
  "ortace:daily-limit-updated",
  "ortace:lifetime-answer-updated",
  "ortace.diagnostic.changed",
] as const;

declare global {
  interface Window {
    __ORTACE_ACCOUNT_USER_ID__?: string | null;
  }
}

export function AccountStorageBridge({ userId }: Props) {
  useEffect(() => {
    const previous = window.__ORTACE_ACCOUNT_USER_ID__ ?? null;
    if (previous === userId) return;

    window.__ORTACE_ACCOUNT_USER_ID__ = userId;
    try {
      if (userId) {
        window.localStorage.setItem(ACCOUNT_STORAGE_USER_ID_KEY, userId);
      } else {
        window.localStorage.removeItem(ACCOUNT_STORAGE_USER_ID_KEY);
      }
    } catch {
      // localStorage が使えない環境では、同一ページ内のグローバルだけ更新する。
    }

    for (const eventName of SYNC_EVENTS) {
      window.dispatchEvent(new Event(eventName));
    }
  }, [userId]);

  return null;
}
