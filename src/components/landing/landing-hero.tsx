import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section
      className="relative -mx-5 overflow-hidden px-5 pb-12 pt-6 md:pt-10"
      aria-labelledby="landing-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,var(--primary-soft),transparent)] opacity-90 dark:opacity-40"
        aria-hidden
      />
      <div className="relative grid gap-10 md:grid-cols-2 md:items-center md:gap-8">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--bg-card)] px-3 py-1 text-[12px] font-medium text-[var(--text-3)] shadow-sm">
            <Sparkles
              className="size-3.5 shrink-0 text-[var(--primary-dark)]"
              strokeWidth={2}
              aria-hidden
            />
            視能訓練士国家試験対策アプリ
          </p>
          <h1
            id="landing-hero-heading"
            className="text-[28px] font-extrabold leading-[1.25] tracking-[-0.03em] text-[var(--text-1)] sm:text-[32px]"
          >
            合格の、一歩上へ。
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--text-2)] md:text-[16px]">
            過去問で設計を固め、解説と記録で続ける。ORT
            ACEは、あなたのペースに合わせた学習パートナーです。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="btn-pressable btn-primary-shadow inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--primary)] px-6 py-3.5 text-center text-[16px] font-bold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] sm:w-auto sm:min-w-[200px]"
            >
              無料ではじめる
            </Link>
            <p className="text-center text-[12px] leading-snug text-[var(--text-3)] sm:text-left">
              アカウント作成後、無料プランですぐに演習を開始できます。
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[340px] md:max-w-none">
          <div
            className="rounded-[16px] border border-border bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
            role="presentation"
          >
            <ul className="space-y-4 text-[14px] leading-relaxed text-[var(--text-2)]">
              <li className="flex gap-3 border-b border-border pb-4">
                <span className="font-semibold tabular-nums text-[var(--primary-dark)]">
                  1,350
                </span>
                <span>問の過去問をラインアップ（第47〜55回）</span>
              </li>
              <li className="flex gap-3 border-b border-border pb-4">
                <span className="font-semibold text-[var(--success)]">正誤</span>
                <span>解答後すぐ確認。解説で理解を深める</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--navy)]">記録</span>
                <span>ノート・ブックマーク・連続学習・分野別の見える化</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
