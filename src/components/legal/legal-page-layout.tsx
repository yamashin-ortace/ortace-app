import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: ReactNode;
};

/**
 * 利用規約・プライバシーポリシー・特商法表記の共通レイアウト。
 * タイトル＋最終更新日＋導入文＋本文（h2/h3/p/ul 等）の縦並び。
 */
export function LegalPageLayout({ title, lastUpdated, intro, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-2 pb-12">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          トップに戻る
        </Link>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[var(--text-1)] sm:text-[30px]">
          {title}
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          最終更新日：{lastUpdated}
        </p>
        {intro ? (
          <p className="text-[13px] leading-7 text-[var(--text-2)]">{intro}</p>
        ) : null}
      </div>
      <div className="legal-body space-y-6 text-[14px] leading-[1.9] text-[var(--text-1)]">
        {children}
      </div>
    </div>
  );
}
