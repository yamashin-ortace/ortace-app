"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  Lightbulb,
  RotateCcw,
  Target,
  type LucideIcon,
} from "lucide-react";
import type {
  MidCategoryWeaknessAnalysis,
  MidCategoryWeaknessRow,
} from "@/lib/weak/mid-category-analysis";
type Props = {
  analysis: MidCategoryWeaknessAnalysis;
  selectedCategoryKey?: string | null;
  practiceQuestionCount?: number;
  onSelectCategory?: (categoryKey: string) => void;
  onStart?: () => void;
};

export function WeakAiComment({
  analysis,
  selectedCategoryKey,
  practiceQuestionCount = 0,
  onSelectCategory,
  onStart,
}: Props) {
  if (analysis.readiness === "collecting") {
    const remaining = Math.max(0, analysis.requiredCount - analysis.judgedCount);
    return (
      <section className="rounded-[14px] border border-[#F0B45C]/55 bg-[#FFF6E5] px-4 py-4 dark:border-[#F0B45C]/35 dark:bg-[#3A2A12]">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#F0B45C]/35 text-[#8A5A18] dark:text-[#FFD58A]">
            <Lightbulb className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[14px] font-bold text-[var(--text-1)]">
              テーマ別の弱点分析はあと {remaining} 問で使えます
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
              MiLu先生が苦手の原因まで見るには、正誤判定済みの履歴が30問ほど必要です。もう少し解いてください。苦手なテーマに絞って出題できるようになります。
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (analysis.rows.length === 0) {
    return (
      <div className="space-y-3">
        <section className="rounded-[14px] border border-[#76B991]/45 bg-[#EFF9F3] px-4 py-4 dark:border-[#76B991]/30 dark:bg-[#163124]">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#CDEBD8] text-[#287148] dark:bg-[#28543A] dark:text-[#BCE9CC]">
              <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[14px] font-bold text-[var(--text-1)]">
                今のところ、明確な苦手テーマはありません
              </p>
              <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
                直近5問で正解2問以下、または直近3問連続誤答のテーマは見つかりませんでした。無理に苦手を作らず、新しい問題に進みましょう。
              </p>
            </div>
          </div>
        </section>
        {analysis.watchRows.length > 0 ? (
          <WatchThemeList rows={analysis.watchRows} />
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <NextLink href="/study/unanswered" label="未着手問題に進む" icon={Inbox} />
          <NextLink href="/study/today" label="今日のおすすめへ" icon={ArrowRight} />
        </div>
      </div>
    );
  }

  const selected =
    analysis.rows.find((row) => row.categoryKey === selectedCategoryKey) ??
    analysis.rows[0];
  const otherRows = analysis.rows.filter(
    (row) => row.categoryKey !== selected.categoryKey,
  );

  return (
    <div className="space-y-3">
      <section className="space-y-3 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <BrainCircuit className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[12px] font-bold text-[var(--primary-dark)]">
              MiLu先生の弱点分析
            </p>
            <p className="text-[15px] font-extrabold text-[var(--text-1)]">
              まずは「{selected.minorCategory}」から固めましょう
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              {buildComment(selected)}
            </p>
          </div>
        </div>

        <WeakThemeCard row={selected} />

        {onStart && practiceQuestionCount > 0 ? (
          <button
            type="button"
            onClick={onStart}
            className="choice-pressable flex w-full items-center justify-center gap-2 rounded-[12px] bg-primary px-4 py-3 text-[14px] font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          >
            {selected.minorCategory}を{practiceQuestionCount}問で確認する
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="rounded-[12px] bg-[var(--bg-muted)] px-3 py-3">
            <p className="text-[12px] font-bold text-[var(--text-2)]">
              このテーマで、今すぐ解き直す問題はありません
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-3)]">
              直近で正解できた問題は苦手克服から外しました。必要な時期に復習モードで確認できます。
            </p>
          </div>
        )}
      </section>

      {otherRows.length > 0 ? (
        <section className="space-y-2 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4">
          <p className="text-[12px] font-bold text-[var(--text-2)]">
            ほかの苦手テーマ
          </p>
          {otherRows.map((row) => (
            <button
              key={row.categoryKey}
              type="button"
              onClick={() => onSelectCategory?.(row.categoryKey)}
              className="flex w-full items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2.5 text-left transition-colors hover:bg-[var(--primary-soft)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-[var(--text-1)]">
                  {row.minorCategory}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">
                  {row.majorCategory}
                </span>
              </span>
              <span className="text-[13px] font-extrabold tabular-nums text-[var(--primary-dark)]">
                {row.accuracy}%
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" strokeWidth={2.5} />
            </button>
          ))}
        </section>
      ) : null}

      {analysis.watchRows.length > 0 ? (
        <WatchThemeList rows={analysis.watchRows} />
      ) : null}
    </div>
  );
}

function WeakThemeCard({ row }: { row: MidCategoryWeaknessRow }) {
  return (
    <div className="rounded-[12px] border border-[var(--primary)]/20 bg-[var(--primary-soft)]/35 px-3 py-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold text-[var(--text-1)]">
            {row.minorCategory}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-3)]">
            {row.majorCategory}・直近{row.judged}問で判定
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-[var(--text-3)]">直近正答率</p>
          <p className="text-[24px] font-extrabold leading-none tabular-nums text-[var(--primary-dark)]">
            {row.accuracy}
            <span className="text-[12px] font-bold">%</span>
          </p>
        </div>
      </div>
      <WeakSignals row={row} />
    </div>
  );
}

function WatchThemeList({ rows }: { rows: MidCategoryWeaknessRow[] }) {
  return (
    <section className="space-y-2 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4">
      <div>
        <p className="text-[12px] font-bold text-[var(--text-2)]">要注意テーマ</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">
          苦手とは断定しません。今後の演習で意識すると安心です。
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((row) => (
          <span
            key={row.categoryKey}
            className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-2)]"
          >
            {row.minorCategory} {row.accuracy}%
          </span>
        ))}
      </div>
    </section>
  );
}

function NextLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="choice-pressable flex items-center justify-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
      {label}
    </Link>
  );
}

function WeakSignals({ row }: { row: MidCategoryWeaknessRow }) {
  const signals = [
    row.highConfidenceMisses > 0
      ? {
          icon: Target,
          label: `自信あり誤答 ${row.highConfidenceMisses}件`,
        }
      : null,
    row.slowAnswers > 0
      ? {
          icon: Clock3,
          label: `時間遅め ${row.slowAnswers}件`,
        }
      : null,
    row.repeatedMisses > 0
      ? {
          icon: RotateCcw,
          label: `反復ミス ${row.repeatedMisses}件`,
        }
      : null,
  ].filter((signal): signal is { icon: LucideIcon; label: string } => Boolean(signal));

  if (signals.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {signals.map((signal) => {
        const Icon = signal.icon;
        return (
          <span
            key={signal.label}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card)] px-2 py-1 text-[10px] font-bold text-[var(--text-2)]"
          >
            <Icon className="h-3 w-3" strokeWidth={2.5} />
            {signal.label}
          </span>
        );
      })}
    </div>
  );
}

function buildComment(row: MidCategoryWeaknessRow): string {
  const reasons: string[] = [];
  if (row.highConfidenceMisses > 0) {
    reasons.push(`自信あり誤答が${row.highConfidenceMisses}件`);
  }
  if (row.slowAnswers > 0) {
    reasons.push(`解答時間が遅めの傾向`);
  }
  if (row.repeatedMisses > 0) {
    reasons.push(`同テーマの反復ミスが${row.repeatedMisses}件`);
  }
  if (reasons.length === 0) {
    reasons.push(`正答率が${row.accuracy}%で低め`);
  }
  return `${reasons.join("、")}が見えています。基礎問題、自信あり誤答の解き直し、類題の順で確認します。`;
}
