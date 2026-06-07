import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Service worker のグローバルスコープ型拡張
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const OFFLINE_CACHE_NAME = "ortace-offline-v1";
const OFFLINE_FALLBACK_URL = "/~offline";

/**
 * ORT ACE の Service Worker。
 * - 静的アセット・主要ルートをプリキャッシュ
 * - オフライン時のフォールバックページ /~offline を提供
 * - 認証後の動的ページはキャッシュしない
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [],
});

// Serwist の fallbacks は precache 済み URL 前提なので、HTML のオフラインページは明示的に保持する。
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE_NAME)
      .then((cache) =>
        cache.add(new Request(OFFLINE_FALLBACK_URL, { cache: "reload" })),
      )
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("ortace-offline-") && key !== OFFLINE_CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate" && request.destination !== "document") return;

  event.respondWith(
    (async () => {
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) return preloadResponse;
        return await fetch(request);
      } catch {
        const cached = await caches.match(OFFLINE_FALLBACK_URL);
        if (cached) return cached;
        return new Response("オフラインです。通信が回復してから再度お試しください。", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          status: 503,
        });
      }
    })(),
  );
});

serwist.addEventListeners();
