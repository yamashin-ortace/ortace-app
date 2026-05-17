import * as Sentry from "@sentry/nextjs";

/**
 * Sentry のクライアント側初期化。
 * NEXT_PUBLIC_SENTRY_DSN が未設定の場合は何もしない（本番環境投入後に有効化）。
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // 開発中は送信せず、本番のみ計測
    enabled: process.env.NODE_ENV === "production",
    // セッションリプレイは未使用（必要時に有効化）
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
