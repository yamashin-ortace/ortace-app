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
            <ScoreGauge
              score={estimated.score}
              max={estimated.maxScore}
              passLine={estimated.passLineScore}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-2)]">
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
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[var(--text-3)]">
              <ScoreMetric
                markerClassName="bg-[var(--primary-dark)]"
                label="推定正答率"
                value={`${estimatedRate}%`}
              />
              <ScoreMetric
                markerClassName="w-0.5 rounded-full bg-[var(--primary-dark)]"
                label="合格基準"
                value={`${passLineRate}%`}
              />
              <ScoreMetric label="カバー率" value={`${estimated.coverage}%`} />
            </div>
          </>
        ) : null}
      </div>
    </section>
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
    <div className="space-y-1.5">
      <div
        className="relative py-2"
        aria-label={`推定正答率 ${scorePercent}%、合格基準 ${passPercent}%`}
      >
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="absolute top-0 right-0 h-full bg-[var(--primary-soft)]"
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
            className="absolute top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-[var(--primary-dark)] shadow-[0_0_0_2px_var(--bg-card)]"
            style={{ left: `${passRatio * 100}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg-card)] shadow-sm",
              isAtPass ? "bg-[var(--primary-dark)]" : "bg-[var(--primary)]",
            )}
            style={{ left: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-[var(--text-3)]">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ScoreMetric({
  label,
  value,
  markerClassName,
}: {
  label: string;
  value: string;
  markerClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-[10px] bg-[var(--bg-muted)]/45 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        {markerClassName ? (
          <span
            aria-hidden
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", markerClassName)}
          />
        ) : null}
        <span className="truncate font-semibold">{label}</span>
      </div>
      <p className="mt-0.5 text-[13px] font-extrabold leading-none tabular-nums text-[var(--text-1)]">
        {value}
      </p>
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
