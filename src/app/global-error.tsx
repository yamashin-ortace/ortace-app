"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * グローバルエラーバウンダリ。
 * Sentry のドキュメント通り、React レンダリングエラーを補足するために必須。
 * `<html>` と `<body>` を含む完全な HTML を返す必要がある。
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
            color: "#1a1a1a",
            background: "#fdf8f6",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
            予期しないエラーが発生しました
          </h1>
          <p style={{ fontSize: "14px", color: "#5d4d54", margin: 0, lineHeight: 1.85 }}>
            時間を置いて、もう一度開いてみてください。
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "11px",
                color: "#b0b0b0",
              }}
            >
              参照ID: {error.digest}
            </p>
          ) : null}
          {/* グローバルエラー時は Next.js のクライアントルーターが動かない可能性があるため <a> でフルリロード */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              marginTop: "8px",
              padding: "12px 24px",
              borderRadius: "12px",
              background: "#e8a5b8",
              color: "white",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            トップへ戻る
          </a>
        </div>
      </body>
    </html>
  );
}
