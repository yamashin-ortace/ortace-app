"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";

/**
 * App Router の汎用エラーバウンダリ。
 * Next.js のドキュメント通り「use client」必須、reset() で再試行を提供する。
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry が設定されていれば後で自動的に拾われる。
    // ここではコンソールに残しておく程度に。
    if (process.env.NODE_ENV !== "production") {
      console.error("[error.tsx]", error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col items-center justify-center gap-6 px-4 pb-16 pt-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <TriangleAlert className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--primary-dark)]">
          ERROR
        </p>
        <h1 className="text-[24px] font-extrabold leading-[1.4] text-[var(--text-1)] sm:text-[28px]">
          ご不便をおかけしています
        </h1>
        <p className="mt-2 text-[14px] leading-[1.85] text-[var(--text-2)]">
          画面の表示中に問題が発生しました。
          <br />
          時間を置いて、もう一度お試しください。
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-[11px] text-[var(--text-4)]">
            参照ID: {error.digest}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_var(--primary-shadow-soft)] transition-opacity hover:opacity-95"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          もう一度試す
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
        >
          <Home className="h-3.5 w-3.5" strokeWidth={2.5} />
          トップへ戻る
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-3 py-1 text-[11px] text-[var(--text-3)] underline underline-offset-2 hover:text-[var(--text-1)]"
        >
          症状が続く場合はお問い合わせ
        </Link>
      </div>
    </div>
  );
}
