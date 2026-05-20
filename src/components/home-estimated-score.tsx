"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Award, Info, TrendingUp } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  calculateEstimatedScore,
  getFieldStats,
} from "@/lib/answer-history/status";
import type { Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

type Props = {
  questions: Question[];
};

export function HomeEstimatedScore({ questions }: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const estimated = useMemo(() => {
    if (!hydrated) return null;
    const stats = getFieldStats(questions, entries);
    return calculateEstimatedScore(stats);
  }, [hydrated, questions, entries]);
  const estimatedRate =
    hydrated && estimated
      ? Math.round((estimated.score / estimated.maxScore) * 100)
      : null;
  const passLineRate =
    hydrated && estimated
      ? Math.round((estimated.passLineScore / estimated.maxScore) * 100)
      : null;

  return (
    <section>
      <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <Award className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-[var(--text-3)]">
              最新実力の目安（推定スコア）
            </span>
            <span className="mt-0.5 text-[24px] font-extrabold leading-none tracking-tight text-[var(--text-1)]">
              {hydrated && estimated ? (
                <>
                  {estimated.score}
                  <span className="ml-1 text-[14px] font-bold text-[var(--text-3)]">
                    /{estimated.maxScore}点
                  </span>
                </>
              ) : (
                <span className="text-[14px] text-[var(--text-3)]">計算中…</span>
              )}
            </span>
          </div>
          <EstimatedScoreInfo />
        </div>

        {hydrated && estimated ? (
          <>
            <ScoreOverview
              score={estimated.score}
              maxScore={estimated.maxScore}
              estimatedRate={estimatedRate}
              passLineRate={passLineRate}
            />
            <ScoreGauge
              score={estimated.score}
              max={estimated.maxScore}
              passLine={estimated.passLineScore}
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[var(--text-2)]">
              {estimated.score >= estimated.passLineScore ? (
                <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-dark)]">
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                  合格基準をクリア中
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-2)]">
                  合格基準まで残り{" "}
                  <span className="font-bold text-[var(--text-1)]">
                    {Math.max(0, estimated.passLineScore - estimated.score)}点
                  </span>
                </span>
              )}
              {estimated.insufficientFields.length > 0 ? (
                <span className="text-[var(--text-3)]">
                  データ不足の分野 {estimated.insufficientFields.length}
                </span>
              ) : null}
              <span className="text-[var(--text-3)]">
                カバー率 {estimated.coverage}%
              </span>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function ScoreOverview({
  score,
  maxScore,
  estimatedRate,
  passLineRate,
}: {
  score: number;
  maxScore: number;
  estimatedRate: number | null;
  passLineRate: number | null;
}) {
  if (estimatedRate === null || passLineRate === null) return null;
  const diff = estimatedRate - passLineRate;
  const isAtPass = diff >= 0;

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[var(--text-3)]">
          推定正答率
        </p>
        <p className="mt-0.5 text-[38px] font-extrabold leading-none tracking-tight text-[var(--text-1)]">
          {estimatedRate}
          <span className="text-[18px] font-black text-[var(--text-2)]">%</span>
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--text-3)]">
          {score}/{maxScore}点換算
        </p>
      </div>
      <div
        className={cn(
          "shrink-0 rounded-[12px] px-3 py-2 text-right",
          isAtPass ? "bg-[var(--primary-soft)]" : "bg-[var(--bg-muted)]",
        )}
      >
        <p className="text-[10px] font-bold text-[var(--text-3)]">
          合格基準60%との差
        </p>
        <p
          className={cn(
            "mt-0.5 text-[18px] font-extrabold leading-none tabular-nums",
            isAtPass ? "text-[var(--primary-dark)]" : "text-[var(--text-1)]",
          )}
        >
          {isAtPass ? "+" : ""}
          {diff}pt
        </p>
      </div>
    </div>
  );
}

function ScoreGauge({
  score,
  max,
  passLine,
}: {
  score: number;
  max: number;
  passLine: number;
}) {
  const ratio = Math.max(0, Math.min(1, score / max));
  const passRatio = Math.max(0, Math.min(1, passLine / max));
  const isAtPass = score >= passLine;
  const scorePercent = Math.round(ratio * 100);
  const passPercent = Math.round(passRatio * 100);

  return (
    <div className="space-y-2">
      <div
        className="relative pt-4 pb-2"
        aria-label={`推定正答率 ${scorePercent}%、合格基準 ${passPercent}%`}
      >
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="absolute top-0 right-0 h-full bg-[var(--primary-soft)]/90"
            style={{ left: `${passRatio * 100}%` }}
          />
          <div
            className={cn(
              "relative h-full rounded-full transition-[width]",
              isAtPass ? "bg-[var(--primary-dark)]" : "bg-[var(--primary)]",
            )}
            style={{ width: `${ratio * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-1)] shadow-[0_0_0_2px_var(--bg-card)]"
            style={{ left: `${passRatio * 100}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--bg-card)] shadow-[0_2px_7px_rgba(0,0,0,0.18)]",
              isAtPass ? "bg-[var(--primary-dark)]" : "bg-[var(--primary)]",
            )}
            style={{ left: `${ratio * 100}%` }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95"
            style={{ left: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center text-[10px] font-bold text-[var(--text-3)]">
        <span>0%</span>
        <span className="rounded-full bg-[var(--text-1)] px-2 py-0.5 text-white">
          合格基準 {passPercent}%
        </span>
        <span className="text-right">100%</span>
      </div>
    </div>
  );
}

function EstimatedScoreInfo() {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          "-m-0.5 rounded-full p-1.5 text-[var(--text-3)] transition-colors",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label="推定スコアの計算ルール"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="z-50 max-w-[min(22rem,calc(100vw-1.5rem))]"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <Popover.Popup
            className={cn(
              "w-[var(--positioner-width)] min-w-[17rem] max-w-[min(22rem,calc(100vw-1.5rem))] rounded-[14px] border border-border",
              "bg-[var(--bg-card)] p-4 text-[12px] leading-relaxed text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p className="text-[13px] font-bold text-[var(--text-1)]">
              推定スコアの計算ルール
            </p>
            <div className="mt-2 space-y-2">
              <p>
                同じ問題を複数回解いた場合は、各問題の最新解答だけを使います。
                その分野別正答率を本試験の出題数で加重平均し、150点満点に換算しています（
                <strong className="font-bold text-[var(--text-1)]">3問未満</strong>
                の分野は除外）。
              </p>
              <p>
                表示は「今の実力の目安」です。バーの線は厚生労働省の合格発表に基づく
                <strong className="font-bold text-[var(--text-1)]">
                  正答率約60%
                </strong>
                の基準です。試験の分野別出題数は過去問からの推定値です。
              </p>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
