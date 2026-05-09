import Link from "next/link";

/**
 * 未ログイン時のヘッダー（LP・ログイン）。設定へのショートカットは付けず /login へ誘導する。
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[var(--bg-base)]/90 px-5 backdrop-blur">
      <Link href="/" className="flex items-baseline">
        <span className="text-[20px] font-extrabold tracking-tight text-[var(--primary)]">
          ORT ACE
        </span>
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
