import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * LP最下部の最終CTA。FAQ後・Footer前に配置。
 * 「ここまで読んだ人、今すぐはじめてみない？」の背中押し役。
 */
export function LandingFinalCta() {
  return (
    <section
      className="relative -mx-5 overflow-hidden px-5 py-16 md:py-20"
      aria-labelledby="landing-final-cta-heading"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-br from-[var(--primary-soft)] via-[var(--bg-base)] to-[#e8f7f5]"
      />
      <div
        aria-hidden
        className="absolute -left-24 top-10 size-56 rounded-full bg-[var(--primary)]/22 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-20 bottom-0 size-64 rounded-full bg-[#9ee8e0]/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-[820px] space-y-5 text-center">
        <p className="inline-flex items-center gap-2 text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
          <Sparkles className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          START FREE
        </p>
        <h2
          id="landing-final-cta-heading"
          className="text-[28px] font-extrabold leading-[1.32] text-[var(--text-1)] md:text-[36px]"
        >
          まずは無料で、今日の10問から。
          <br className="sm:hidden" />
          国試までの道を、一緒に。
        </h2>
        <p className="mx-auto max-w-[560px] text-[14px] leading-[1.9] text-[var(--text-2)] md:text-[15px]">
          10問だけ解いて終えても大丈夫。無料プランでも、AIコーチMiLu先生が今日のおすすめ20問を用意します。
          登録3分・カード不要。続けるかどうかは、解いてみてから決めてください。
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="btn-pressable inline-flex min-h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-[12px] bg-[#102338] px-6 text-center text-[16px] font-bold text-white shadow-[0_16px_34px_rgba(16,35,56,0.22)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102338] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] sm:w-auto sm:min-w-[240px]"
          >
            無料ではじめる
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
        <p className="text-[11px] text-[var(--text-3)]">
          7日返金保証つき・合格サポート保証つき・国試対策パックは買い切り型
        </p>
      </div>
    </section>
  );
}
