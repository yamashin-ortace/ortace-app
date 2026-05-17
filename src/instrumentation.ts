import * as Sentry from "@sentry/nextjs";

/**
 * Next.js 16 の instrumentation hook。
 * ランタイム別に Sentry の初期化ファイルを読み込む。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
