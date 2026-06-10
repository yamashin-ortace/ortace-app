import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Clock3, HelpCircle } from "lucide-react";
import { OrtAceLogo } from "@/components/brand/ort-ace-logo";

const HERO_PAIN_CARDS = [
  {
    icon: BookOpen,
    title: "過去問の山、どこから始める？",
    body: "授業・実習・レポートの合間でも、今日の一歩が見える。",
  },
  {
    icon: Clock3,
    title: "復習のタイミング、合ってる？",
    body: "得意・苦手・戻るべき問題を、学習履歴から整理。",
  },
  {
    icon: HelpCircle,
    title: "自信があった答えが、なぜか外れる",
    body: "思い込みや覚え違いに気づけるよう、見直しへつなげる。",
  },
] as const;

export function LandingHero() {
  return (
    <section
      className="relative -mx-5 -mt-4 overflow-hidden bg-[#f9f4f2] px-5 pb-14 pt-10 dark:bg-[var(--bg-base)] md:min-h-[680px] md:pb-18 md:pt-14"
      aria-labelledby="landing-hero-heading"
    >
      <Image
        src="/landing/hero-student-study.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 960px) 960px, 100vw"
        className="object-cover object-[68%_center] opacity-[0.84] md:opacity-[0.94] dark:opacity-[0.45]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(253,248,246,0.98)_0%,rgba(253,248,246,0.92)_32%,rgba(253,248,246,0.68)_56%,rgba(253,248,246,0.34)_78%,rgba(253,248,246,0.14)_100%)] dark:bg-[linear-gradient(105deg,rgba(10,16,24,0.96)_0%,rgba(10,16,24,0.88)_42%,rgba(10,16,24,0.50)_72%,rgba(10,16,24,0.22)_100%)] md:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_40%,rgba(253,248,246,0.92)_0%,rgba(253,248,246,0.72)_42%,rgba(253,248,246,0.32)_70%,rgba(253,248,246,0)_100%)] dark:bg-[radial-gradient(ellipse_at_22%_42%,rgba(10,16,24,0.86)_0%,rgba(10,16,24,0.58)_48%,rgba(10,16,24,0.20)_78%,rgba(10,16,24,0)_100%)] md:hidden" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(104deg,rgba(253,248,246,0.98)_0%,rgba(253,248,246,0.90)_34%,rgba(253,248,246,0.58)_58%,rgba(253,248,246,0.18)_80%,rgba(253,248,246,0)_100%)] dark:bg-[linear-gradient(104deg,rgba(17,24,39,0.96)_0%,rgba(17,24,39,0.78)_42%,rgba(17,24,39,0.22)_78%,rgba(17,24,39,0.10)_100%)] md:block" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-[var(--bg-base)] via-[var(--bg-base)]/70 to-transparent" />

      <div className="relative min-h-[560px] md:min-h-[610px]">
        <div className="max-w-[900px] pt-6 md:pt-10">
          <p className="inline-flex items-center rounded-full border border-[#16717c]/18 bg-white/72 px-3.5 py-1.5 text-[13px] font-extrabold text-[#16717c] shadow-[0_10px_26px_rgba(44,62,93,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-[#9ee8e0] md:text-[15px]">
            視能訓練士国家試験対策アプリ
          </p>
          <h1
            id="landing-hero-heading"
            className="mt-3 max-w-[560px] text-[34px] font-extrabold leading-[1.12] text-[var(--text-1)] sm:text-[48px] md:mt-4 md:text-[62px]"
          >
            何から解くべきか、
            <br />
            もう迷わない。
          </h1>
          <p className="landing-hero-readable mt-6 max-w-[620px] space-y-1.5 text-[15px] font-medium leading-[1.9] text-[var(--text-1)] md:text-[16px]">
            <span className="block">何から手をつけるか、</span>
            <span className="block">どれだけ進めるか、</span>
            <span className="block">自分の弱点はどこか。</span>
            <span className="block pt-1.5">
              あなたの学習履歴から苦手・思い込み・復習タイミングを整理し、
              <span className="whitespace-nowrap font-extrabold text-[#16717c]">
                AIコーチMiLu先生
              </span>
              が次の一歩を提案します。
            </span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="btn-pressable inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#102338] px-6 text-center text-[16px] font-bold text-white shadow-[0_16px_34px_rgba(16,35,56,0.22)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102338] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] sm:w-auto sm:min-w-[210px]"
            >
              無料ではじめる
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
            </Link>
            <p className="rounded-[10px] bg-white/58 px-3 py-2 text-center text-[12px] font-medium leading-relaxed text-[var(--text-2)] shadow-[0_8px_24px_rgba(255,255,255,0.42)] backdrop-blur-sm dark:bg-black/36 dark:text-white sm:max-w-[230px] sm:text-left">
              まずは無料で。登録3分・カード不要。10問だけ解いてみる。
            </p>
          </div>
          <div className="mt-7">
            <OrtAceLogo size="md" />
          </div>
          <div className="mt-3 grid max-w-[920px] gap-2 sm:grid-cols-3">
            {HERO_PAIN_CARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[12px] border border-white/65 bg-white/62 px-3 py-2.5 shadow-[0_10px_26px_rgba(44,62,93,0.07)] backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-1 flex items-center gap-2 text-[#16717c]">
                  <Icon className="size-4 shrink-0" strokeWidth={2.4} aria-hidden />
                  <p className="whitespace-nowrap text-[14px] font-extrabold leading-tight text-[var(--text-1)]">
                    {title}
                  </p>
                </div>
                <p className="text-[12px] font-bold leading-[1.55] text-[var(--text-3)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
