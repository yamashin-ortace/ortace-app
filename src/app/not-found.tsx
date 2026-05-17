import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col items-center justify-center gap-6 px-4 pb-16 pt-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--primary-dark)]">
          404 NOT FOUND
        </p>
        <h1 className="text-[26px] font-extrabold leading-[1.4] text-[var(--text-1)] sm:text-[30px]">
          このページは
          <br />
          見つかりませんでした
        </h1>
        <p className="mt-2 text-[14px] leading-[1.85] text-[var(--text-2)]">
          URLが古いか、削除された可能性があります。
          <br />
          トップに戻ってから、もう一度お試しください。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_var(--primary-shadow-soft)] transition-opacity hover:opacity-95"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          トップへ戻る
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          お問い合わせ
        </Link>
      </div>
    </div>
  );
}
