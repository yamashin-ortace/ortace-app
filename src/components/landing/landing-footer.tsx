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
              <span className="cursor-default text-[var(--text-4)]">
                利用規約（準備中）
              </span>
            </li>
            <li>
              <span className="cursor-default text-[var(--text-4)]">
                プライバシーポリシー（準備中）
              </span>
            </li>
            <li>
              <span className="cursor-default text-[var(--text-4)]">
                特定商取引法に基づく表記（準備中）
              </span>
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
