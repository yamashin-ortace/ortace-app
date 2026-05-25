"use client";

import {
  BrainCircuit,
  Clock3,
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
};

export function WeakAiComment({ analysis }: Props) {
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
              中分類分析はあと {remaining} 問で使えます
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
              MiLu先生が苦手の原因まで見るには、正誤判定済みの履歴が30問ほど必要です。もう少し解いてください。中分類別に絞って出題できるようになります。
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (analysis.rows.length === 0) {
    return (
      <section className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <Target className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[14px] font-bold text-[var(--text-1)]">
              中分類の判定には、もう少し偏りのある履歴が必要です
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
              解答数は足りていますが、同じ中分類で3問以上の判定がまだ少なめです。未着手やランダムで少し広げると判定しやすくなります。
            </p>
          </div>
        </div>
      </section>
    );
  }

  const top = analysis.rows[0];
  return (
    <section className="space-y-3 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <BrainCircuit className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-[12px] font-bold text-[var(--primary-dark)]">
            MiLu先生の中分類コメント
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-1)]">
            {buildComment(top)}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {analysis.rows.map((row) => (
          <div
            key={row.categoryKey}
            className="rounded-[12px] border border-border bg-[var(--bg-muted)]/55 px-3 py-2.5"
          >
            <p className="line-clamp-2 text-[12px] font-bold leading-snug text-[var(--text-1)]">
              {row.minorCategory}
            </p>
            <p className="mt-1 text-[10px] text-[var(--text-3)]">
              {row.majorCategory}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-[10px] text-[var(--text-3)]">
                <span className="font-bold tabular-nums text-[var(--text-2)]">
                  {row.judged}
                </span>
                問判定
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--text-3)]">
                  正答率
                </p>
                <p className="text-[20px] font-extrabold leading-none tabular-nums text-[var(--primary-dark)]">
                  {row.accuracy}
                  <span className="text-[11px] font-bold">%</span>
                </p>
              </div>
            </div>
            <WeakSignals row={row} />
          </div>
        ))}
      </div>
    </section>
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
  return `${row.minorCategory}が苦手な可能性があります。${reasons.join("、")}が見えています。今日は基礎問題、自信あり誤答の解き直し、類題の順で固めましょう。`;
}
