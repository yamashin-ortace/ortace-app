import { LandingQuestionPhone } from "@/components/landing/landing-question-phone";
import { HorizontalSnapRow } from "@/components/ui/horizontal-snap-row";
import {
  Bookmark,
  BarChart3,
  BookOpenCheck,
  BookOpenText,
  Brain,
  CalendarDays,
  Images,
  Inbox,
  ListFilter,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

const ITEMS = [
  {
    icon: BookOpenCheck,
    title: "過去問1,500問",
    body: "第47〜56回の10年分を収録。最新第56回までスマホで演習できます。",
  },
  {
    icon: Images,
    title: "画像問題",
    body: "眼底写真、検査結果、症例画像も問題文と一緒に確認できます。",
  },
  {
    icon: Sparkles,
    title: "AIおすすめ20問",
    body: "回答履歴・正答率・解いた感覚・解答時間から、今やる問題をMiLu先生が整理します。",
  },
  {
    icon: BookOpenText,
    title: "選択肢別解説",
    body: "選択肢ごとの理由、解くポイント、計算過程まで確認できます。",
  },
  {
    icon: RotateCcw,
    title: "復習キュー",
    body: "間違い・迷い・根拠なしを、少し時間を空けて復習できます。",
  },
  {
    icon: Target,
    title: "苦手克服",
    body: "正答率が低い分野を見つけ、優先順位を付けて解き直せます。",
  },
  {
    icon: Brain,
    title: "思い込みチェック",
    body: "自信があったのに間違えた問題を拾い、覚え違いを見直せます。",
  },
  {
    icon: Inbox,
    title: "未着手演習",
    body: "まだ解いていない問題だけを、分野を指定して進められます。",
  },
  {
    icon: SlidersHorizontal,
    title: "絞り込み演習",
    body: "回・午前午後・分野・問題数を指定して、自分用の演習を作れます。",
  },
  {
    icon: Shuffle,
    title: "ランダム出題",
    body: "全1,500問から指定した問題数をシャッフルして解けます。",
  },
  {
    icon: ListFilter,
    title: "年度別演習",
    body: "第47〜56回から年度を選び、本番のまとまりで取り組めます。",
  },
  {
    icon: Bookmark,
    title: "ブックマーク・ノート",
    body: "「わかんない」「ニガテ」「覚える」「授業メモ」とノートから再演習できます。",
  },
  {
    icon: Search,
    title: "記録検索",
    body: "保存した問題を、問題番号やキーワードからすぐ探せます。",
  },
  {
    icon: BarChart3,
    title: "分野別成績",
    body: "分野ごとの解答数と正答率を見ながら、戻る場所を決められます。",
  },
  {
    icon: CalendarDays,
    title: "75問模試",
    body: "本番形式の腕試しとスコアレポートを、12月1日に公開予定です。",
  },
] as const;

const COACH_STEPS = [
  ["1", "解答履歴を蓄積", "正誤・解いた感覚・解答時間を記録"],
  ["2", "優先度を整理", "復習・弱点・思い込み・未回答を判定"],
  ["3", "次の一歩へ", "おすすめ20問や確認テーマを提案"],
] as const;

export function LandingFeatures() {
  return (
    <div className="space-y-14 py-14 md:py-18">
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
            今日やることを決めるところから、解き直しまで。必要な流れをスマホにまとめました。
          </p>
        </div>
        <HorizontalSnapRow
          ariaLabel="ORT ACE の主要機能カード"
          itemClassName="min-w-[78%] basis-[78%] shrink-0 snap-start sm:min-w-[280px] sm:basis-[280px]"
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
      </section>

      <section className="relative overflow-hidden rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_18px_48px_rgba(44,62,93,0.08)] md:p-7">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#d8fff6]/45 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="space-y-3">
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
              AI COACH
            </p>
            <h2 className="text-[23px] font-extrabold leading-[1.42] text-[var(--text-1)] md:text-[28px]">
              解くほど、次にやることが決まる。
              <br />
              だから、計画で止まらない。
            </h2>
            <p className="text-[14px] leading-[1.9] text-[var(--text-2)]">
              国試前に足りないのは、教材ではなく、整理かもしれません。
              ORT ACEのAIコーチMiLu先生は、回答履歴・正答率・解いた感覚・解答時間をもとに、
              復習・弱点・思い込み・未回答を整理。今のあなたに必要な演習へつなげます。
            </p>
            <div className="grid gap-2 pt-2">
              {COACH_STEPS.map(([step, title, body]) => (
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
