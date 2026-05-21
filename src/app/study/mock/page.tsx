import { Clock, FileText, Hourglass, ImageOff, Sparkles, Trophy } from "lucide-react";
import { BackLink } from "@/components/study/back-link";

export default function MockStartPage() {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          模試にチャレンジ
        </h1>
        <p className="text-[12px] text-[var(--text-4)]">
          準備中（12月中旬ごろ公開予定）
        </p>
      </div>

      <section className="relative overflow-hidden rounded-[18px] border border-border bg-[var(--bg-muted)]/40 p-5">
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--text-4)]/45 bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-bold text-[var(--text-3)]">
            <Sparkles className="h-3 w-3 text-[var(--text-4)]" strokeWidth={2.5} />
            準備中
          </div>
          <h2 className="text-[20px] font-extrabold leading-tight tracking-tight text-[var(--text-1)]">
            模試モードは12月中旬ごろ実装予定です。
          </h2>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            国試直前の3ヶ月、もっとも欲しくなる
            <strong className="font-bold text-[var(--text-1)]">「本番形式の腕試し」</strong>
            を準備中。実際の国家試験は午前75問・午後75問で、それぞれ120分、合計240分です。
            ORT ACEの模試モードでは、その半分にあたる
            <strong className="font-bold text-[var(--text-1)]">75問・120分を1回分</strong>
            として提供する予定です。
          </p>
          <div className="flex items-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5 text-[12px] text-[var(--text-2)]">
            <Hourglass className="h-4 w-4 shrink-0 text-[var(--text-3)]" strokeWidth={2.5} />
            <span>
              いまは過去問演習で土台を固めるとき。模試解禁時には、今まで積み上げてきた解答履歴を踏まえた
              <strong className="font-bold text-[var(--text-1)]">スコアレポート</strong>
              が見られます。
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-5">
        <p className="text-[13px] font-semibold text-[var(--text-3)]">公開時に解禁される仕様</p>
        <div className="space-y-2.5 text-[14px] text-[var(--text-1)]">
          <Row icon={<FileText className="h-4 w-4" strokeWidth={2.5} />}>
            <strong className="font-bold">オリジナル問題75問</strong> を、過去の出題形式に沿って出題
          </Row>
          <Row icon={<ImageOff className="h-4 w-4" strokeWidth={2.5} />}>
            初回版は画像・写真問題なし。代わりに
            <strong className="font-bold">画像所見を文章化した問題</strong>
            を含めます
          </Row>
          <Row icon={<Clock className="h-4 w-4" strokeWidth={2.5} />}>
            制限時間 <strong className="font-bold">120分</strong>（午前または午後1回分の想定）
          </Row>
          <Row icon={<Trophy className="h-4 w-4" strokeWidth={2.5} />}>
            総合スコア・分野別正答率・所要時間レポート
          </Row>
        </div>
      </section>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--text-4)]/55 bg-[var(--bg-muted)]/50 px-6 py-3.5 text-[14px] font-bold text-[var(--text-3)]"
      >
        <Sparkles className="h-4 w-4 text-[var(--text-4)]" strokeWidth={2.5} />
        いまは受験できません（12月中旬ごろ公開予定）
      </button>
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        {icon}
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </div>
  );
}
