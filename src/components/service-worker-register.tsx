"use client";

import { useEffect } from "react";

/**
 * Service Worker をクライアント側で登録する。
 * - 本番（NODE_ENV=production）でのみ有効
 * - 開発中は登録しない（HMR と相性悪のため Serwist 側でも disable 設定）
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        // 登録失敗してもユーザー体験には影響しないため、ログのみ
        console.warn("[sw] register failed", error);
      }
    };
    register();
  }, []);

  return null;
}
