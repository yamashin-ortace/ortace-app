import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "無料プランでできることは？",
    a: "過去問1,350問へのアクセス、解答と正誤の確認ができます。1日あたりの演習は20問まで、ノートは10件までという制限があります。",
  },
  {
    q: "対応している過去問の範囲は？",
    a: "第47回から第55回までの過去問をカバーしています（1,350問）。アプリ内の表示はアップデートで拡張される場合があります。",
  },
  {
    q: "スマートフォンだけで使えますか？",
    a: "はい。モバイルファーストで設計しており、外出先でも続けやすいレイアウトです。",
  },
  {
    q: "課金はどこから行いますか？",
    a: "現時点ではアカウント作成後にプラン選択・決済へ進む流れを準備しています。LPから直接お支払いすることはありません。",
  },
  {
    q: "オリジナル問題はありますか？",
    a: "開発ロードマップに沿って順次追加しています。受験生プランではオリジナル予想問題の拡充を目標としています（全体で目標180問）。",
  },
] as const;

export function LandingFaq() {
  return (
    <section className="space-y-8 py-14" aria-labelledby="landing-faq-heading">
      <div className="space-y-2 text-center md:text-left">
        <h2
          id="landing-faq-heading"
          className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-1)] md:text-[24px]"
        >
          よくある質問
        </h2>
        <p className="text-[14px] text-[var(--text-3)] md:text-[15px]">
          ひと目でわかるようにまとめました。
        </p>
      </div>
      <div className="space-y-2">
        {FAQ_ITEMS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-[14px] border border-border bg-[var(--bg-card)] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] open:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[14px] font-semibold text-[var(--text-1)] outline-none marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{q}</span>
              <ChevronDown
                className="size-5 shrink-0 text-[var(--text-3)] transition-transform duration-300 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-t border-border pb-4 pt-1">
              <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
