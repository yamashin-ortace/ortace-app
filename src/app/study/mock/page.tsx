import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  ImageOff,
  Sparkles,
  Trophy,
} from "lucide-react";
import { BackLink } from "@/components/study/back-link";

export default function MockStartPage() {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          模試にチャレンジ
        </h1>
        <p className="text-[12px] font-bold text-[var(--primary-dark)]">
          12月1日公開・国試対策パック対象
        </p>
      </div>

      <section className="relative overflow-hidden rounded-[18px] border border-[var(--primary)]/30 bg-[var(--bg-card)] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-2xl"
        />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/35 bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-extrabold text-[var(--primary-dark)]">
            <CalendarDays className="h-3 w-3" strokeWidth={2.5} />
            12月1日公開
          </div>
          <h2 className="text-[20px] font-extrabold leading-tight tracking-tight text-[var(--text-1)]">
            本番形式の75問模試で、国試前の仕上がりを確認できます。
          </h2>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            国試直前期に、本当に欲しくなる
            <strong className="font-bold text-[var(--text-1)]">「初見の本番形式」</strong>
            を12月1日に公開します。実際の国家試験は午前75問・午後75問で、それぞれ120分、合計240分です。
            ORT ACEの模試モードでは、その半分にあたる
            <strong className="font-bold text-[var(--text-1)]">75問・120分を1回分</strong>
            として、集中して解き切る腕試しを用意しています。
          </p>
          <div className="flex items-start gap-2 rounded-[12px] border border-[var(--primary)]/20 bg-[var(--primary-soft)]/35 px-3 py-2.5 text-[12px] text-[var(--text-2)]">
            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]" strokeWidth={2.5} />
            <span>
              国試対策パックなら、公開後すぐに受験できます。解き終わった後は
              <strong className="font-bold text-[var(--text-1)]">総合スコア・分野別正答率・所要時間レポート</strong>
              で、直前期に戻るべきテーマまで確認できます。
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/plans"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-extrabold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
            >
              国試対策パックを見る
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/study"
              className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-border bg-[var(--bg-card)] px-4 text-[14px] font-bold text-[var(--text-1)]"
            >
              12月まで過去問で仕上げる
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-5">
        <p className="text-[13px] font-semibold text-[var(--text-3)]">12月1日に解禁される内容</p>
        <div className="space-y-2.5 text-[14px] text-[var(--text-1)]">
          <Row icon={<FileText className="h-4 w-4" strokeWidth={2.5} />}>
            <strong className="font-bold">選定済みのオリジナル問題75問</strong> を、過去の出題形式に沿って出題
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
        12月1日 受験開始
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
