import Link from "next/link";

export function LandingFooter() {
  return (
    <footer
      className="border-t border-border pb-6 pt-10 text-[12px] text-[var(--text-3)]"
      aria-label="サイトフッター"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-[15px] font-bold text-[var(--primary)]">ORT ACE</p>
          <p className="text-[var(--text-4)]">https://ortace.jp</p>
          <p className="max-w-md pt-2 leading-relaxed text-[var(--text-3)]">
            視能訓練士国家試験対策のためのWebアプリ。温かく、でも芯のある学習体験を目指しています。
          </p>
        </div>
        <nav aria-label="フッターリンク">
          <ul className="flex flex-col gap-2 md:text-right">
            <li>
              <Link
                href="/legal/terms"
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                利用規約
              </Link>
            </li>
            <li>
              <Link
                href="/legal/privacy"
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link
                href="/legal/tokushoho"
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                特定商取引法に基づく表記
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                お問い合わせ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mt-8 text-center text-[11px] text-[var(--text-4)] md:text-left">
        © {new Date().getFullYear()} ORT ACE
      </p>
    </footer>
  );
}
