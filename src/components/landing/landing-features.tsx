import {
  BarChart3,
  Bookmark,
  BookOpenCheck,
  Flame,
  StickyNote,
} from "lucide-react";

const ITEMS = [
  {
    icon: BookOpenCheck,
    title: "過去問をじっくり演習",
    body: "厚労省公開の過去問ベース。設問に集中できる読みやすい画面です。",
  },
  {
    icon: StickyNote,
    title: "ノートで自分の言葉に",
    body: "ひとことメモを残して復習の足がかりに（無料プランは保存件数に上限があります）。",
  },
  {
    icon: Bookmark,
    title: "ブックマーク",
    body: "あとで見返したい問題をすばやく保管。試験直前の棚卸しに便利です。",
  },
  {
    icon: Flame,
    title: "連続学習ストリーク",
    body: "学び続けた日々が続くように、軽やかな記録で応援します。",
  },
  {
    icon: BarChart3,
    title: "分野別の統計",
    body: "どこが得意・どこをもう一段かためたいかを俯瞰できます。",
  },
] as const;

export function LandingFeatures() {
  return (
    <div className="space-y-8 py-14">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-1)] md:text-[24px]">
          学習の流れを、アプリがそっと支える
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          さくさく進める操作感と、試験対策に必要な機能をバランスよく。
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex gap-4 rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-dark)] dark:bg-[var(--bg-muted)] dark:text-[var(--primary)]">
              <Icon className="size-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-[15px] font-semibold text-[var(--text-1)]">
                {title}
              </h3>
              <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
