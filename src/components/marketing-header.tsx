import Link from "next/link";
import { OrtAceLogo } from "@/components/brand/ort-ace-logo";

/**
 * 未ログイン時のヘッダー（LP・ログイン）。設定へのショートカットは付けず /login へ誘導する。
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[var(--bg-base)]/90 px-5 backdrop-blur">
      <Link href="/" className="flex items-center">
        <OrtAceLogo size="sm" />
      </Link>
      <Link
        href="/login"
        className="rounded-[10px] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--bg-muted)]"
      >
        ログイン
      </Link>
    </header>
  );
}
