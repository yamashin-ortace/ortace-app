import Image from "next/image";
import { LandingQuestionPhone } from "@/components/landing/landing-question-phone";
import { HorizontalSnapRow } from "@/components/ui/horizontal-snap-row";
import {
  Bookmark,
  BookOpen,
  BookOpenCheck,
  Brain,
  Flame,
  Home,
  LineChart,
  NotebookText,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";

const AI_FLOW = [
  {
    icon: RotateCcw,
    title: "復習",
    body: "忘れかけのタイミングで戻すと定着しやすい、という学習科学の考え方で、復習対象を拾いやすくします。",
  },
  {
    icon: Target,
    title: "弱点",
    body: "得意・苦手を分野ごとに見える化し、どこに戻ればいいかを決めやすくします。",
  },
  {
    icon: Brain,
    title: "思い込み",
    body: "自信があったのに間違えた問題・じっくり考えずに落とした問題を拾い、本番で危ない覚え違いを洗い出します。",
  },
] as const;

const ITEMS = [
  {
    icon: BookOpenCheck,
    title: "最新第56回までの過去問1,500問",
    body: "第47〜56回の10年分。最新の第56回も含めて、正誤と解説を振り返れます。",
  },
  {
    icon: Sparkles,
    title: "解答後AI分析",
    body: "解いたあとに、次へつながる確認テーマをAIコーチMiLu先生が整理します。",
  },
  {
    icon: Bookmark,
    title: "ブックマーク",
    body: "直前に見返したい問題を保管。苦手だけを拾い直す準備ができます。",
  },
  {
    icon: NotebookText,
    title: "ノート",
    body: "解説だけで終わらせず、自分の言葉で残して復習の足がかりに。",
  },
  {
    icon: Flame,
    title: "連続学習",
    body: "毎日の積み上げを軽く見える化。国試までの習慣づくりを支えます。",
  },
  {
    icon: LineChart,
    title: "分野別の統計",
    body: "得意と苦手を俯瞰し、次の演習に活かせる形で確認できます。",
  },
] as const;

const APP_FLOW = [
  {
    icon: Home,
    title: "ホーム",
    body: "今日やること、続きから解く問題、AIコーチMiLu先生からの提案を最初に確認できます。",
  },
  {
    icon: BookOpen,
    title: "学習",
    body: "第47〜56回・10年分の過去問をスマホで演習。最新第56回まで解くほど、弱点と復習材料がたまります。",
  },
  {
    icon: LineChart,
    title: "記録",
    body: "解答履歴・ノート・ブックマークがすべて残るので、いつでも見返して復習できます。",
  },
] as const;

export function LandingFeatures() {
  return (
    <div className="space-y-14 py-14 md:py-18">
      <section className="-mx-5 bg-[var(--navy)] px-5 py-12 text-white dark:bg-[var(--bg-card)]">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="space-y-3">
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-white/60">
              WHY ORT ACE
            </p>
            <h2 className="text-[22px] font-extrabold leading-[1.4] text-white md:text-[32px]">
              解くほど、次にやることが決まる。
              <br />
              だから計画で止まらない。
            </h2>
            <p className="text-[14px] leading-[1.9] text-white/76 md:text-[15px]">
              国試前に足りないのは、教材ではなく、整理かもしれません。
              ORT ACEは、解いた履歴をもとに復習・弱点・思い込み・未回答を整理。
              一度に詰め込むより、少し時間を空けて戻る復習も大切にしながら、次の演習へつなげます。
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[20px] border border-white/16 bg-white/[0.08] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur md:p-6">
            <div className="absolute -right-12 -top-14 size-44 rounded-full bg-[#8fe8d2]/16 blur-3xl" />
            <div className="relative space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-extrabold tracking-[0.14em] text-white/55">
                    LEARNING LOOP
                  </p>
                  <h3 className="mt-2 text-[20px] font-extrabold leading-[1.35] text-white md:text-[24px]">
                    解いた履歴が、
                    <br />
                    次の復習につながる。
                  </h3>
                </div>
                <span className="hidden rounded-full border border-white/18 px-3 py-1 text-[11px] font-bold text-white/70 sm:inline-flex">
                  AIコーチMiLu先生の整理
                </span>
              </div>

              <div className="space-y-1">
                {AI_FLOW.map(({ icon: Icon, title, body }, index) => (
                  <div key={title} className="relative flex gap-3 py-3">
                    <div className="flex w-11 shrink-0 flex-col items-center">
                      <span className="grid size-10 place-items-center rounded-[12px] bg-white text-[var(--navy)] shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
                        <Icon className="size-5" strokeWidth={2.5} aria-hidden />
                      </span>
                      {index < AI_FLOW.length - 1 ? (
                        <span className="mt-2 h-8 w-px bg-white/18" aria-hidden />
                      ) : null}
                    </div>
                    <div className="min-w-0 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-[#9ee8e0]">
                          0{index + 1}
                        </span>
                        <h4 className="text-[16px] font-extrabold text-white">
                          {title}
                        </h4>
                      </div>
                      <p className="mt-1 text-[13px] leading-[1.75] text-white/70">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative -mx-5 overflow-hidden px-5 py-14"
        aria-labelledby="landing-app-flow-heading"
      >
        <Image
          src="/landing/hero-classroom.jpg"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[var(--bg-base)] from-[0%] via-[var(--bg-base)]/92 via-[48%] to-[var(--bg-base)]/48" />
        <div className="relative grid gap-7 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div className="space-y-3">
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
              APP FLOW
            </p>
            <h2
              id="landing-app-flow-heading"
              className="text-[20px] font-extrabold leading-[1.42] text-[var(--text-1)] md:text-[30px]"
            >
              実習も、レポートもある。
              <br />
              だから国試対策は、迷わない仕組みで。
            </h2>
            <p className="max-w-[560px] text-[14px] leading-[1.9] text-[var(--text-3)] md:text-[15px]">
              忙しい日でも、ホームで今日の課題を確認、学習で過去問を解いて、記録で振り返り。
              ORT ACEは、国試対策の流れをスマホの中にまとめます。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {APP_FLOW.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="landing-lift rounded-[14px] border border-white/70 bg-white/72 p-3.5 shadow-[0_16px_40px_rgba(44,62,93,0.1)] backdrop-blur"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#e8f7f5] text-[#16717c]">
                    <Icon className="size-4.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <h3 className="text-[16px] font-extrabold text-[var(--text-1)]">
                    {title}
                  </h3>
                </div>
                <p className="mt-2 text-[12px] font-bold leading-relaxed text-[var(--text-3)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="landing-features-heading">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
            FEATURES
          </p>
          <h2
            id="landing-features-heading"
            className="text-[24px] font-extrabold text-[var(--text-1)] md:text-[30px]"
          >
            解く、残す、見返す。
            <br className="sm:hidden" />
            国試対策の流れをひとつに。
          </h2>
          <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
            見た目は軽く、中身は国試対策に必要なすべて。
          </p>
        </div>
        <HorizontalSnapRow
          ariaLabel="ORT ACE の主要機能カード"
          itemClassName="min-w-[78%] basis-[78%] shrink-0 snap-start sm:min-w-[260px] sm:basis-[260px]"
          items={ITEMS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="landing-lift h-full rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_12px_32px_rgba(44,62,93,0.06)]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary-dark)] dark:bg-[var(--bg-muted)] dark:text-[var(--primary)]">
                  <Icon className="size-4.5" strokeWidth={2.3} aria-hidden />
                </span>
                <h3 className="text-[15px] font-extrabold text-[var(--text-1)]">
                  {title}
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-3)]">
                {body}
              </p>
            </article>
          ))}
        />
        <p className="text-center text-[11px] text-[var(--text-3)] md:text-left">
          左右にスワイプして、機能カードを順に見られます
        </p>
      </section>

      <section className="relative overflow-hidden rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_18px_48px_rgba(44,62,93,0.08)] md:p-7">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#d8fff6]/45 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="space-y-3">
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
              AI COACH
            </p>
            <h2 className="text-[23px] font-extrabold leading-[1.42] text-[var(--text-1)] md:text-[28px]">
              問題を解く。
              <br />
              次の一歩が、見えてくる。
            </h2>
            <p className="text-[14px] leading-[1.9] text-[var(--text-2)]">
              ORT ACEのAIコーチMiLu先生は、回答履歴・正答率・自信度・解答時間をもとに、
              苦手・復習・思い込みを整理し、今のあなたに必要な演習を提案します。
            </p>
            <div className="grid gap-2 pt-2">
              {[
                ["1", "解答履歴を蓄積", "正誤・自信度・解答時間を記録"],
                ["2", "AIコーチMiLu先生が優先度を整理", "復習・弱点・思い込みを判定"],
                ["3", "次の演習へつなげる", "今のあなたに必要な問題を提案"],
              ].map(([step, title, body]) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-base)] px-4 py-3 shadow-[0_10px_24px_rgba(44,62,93,0.06)]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#102338] text-[12px] font-extrabold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold text-[var(--text-1)]">
                      {title}
                    </p>
                    <p className="text-[11px] font-bold text-[var(--text-3)]">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <LandingQuestionPhone />
          </div>
        </div>
      </section>
    </div>
  );
}
