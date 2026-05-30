"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ArrowRight, Info, TrendingUp } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  calculateEstimatedScore,
  getFieldStats,
} from "@/lib/answer-history/status";
import type { EstimatedScore } from "@/lib/answer-history/status";
import type { Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

type Props = {
  questions: Question[];
};

type ScoreReliabilityStage = {
  label: string;
  level: number;
  totalLevels: number;
  description: string;
  nextHint: string | null;
  isStable: boolean;
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
  const scoreStage = estimated ? getScoreReliabilityStage(estimated) : null;

  return (
    <section>
      <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {hydrated && estimated ? (
          <>
            <ScoreSummary
              score={estimated.score}
              maxScore={estimated.maxScore}
              estimatedRate={estimatedRate}
              passLineRate={passLineRate}
              canJudgePassLine={estimated.canJudgePassLine}
              scoreStage={scoreStage}
              totalJudged={estimated.totalJudged}
              targetTotalJudged={estimated.targetTotalJudged}
              readyFieldCount={estimated.readyFieldCount}
              totalFieldCount={estimated.totalFieldCount}
            />
            <ScoreGauge
              score={estimated.score}
              max={estimated.maxScore}
              passLine={estimated.passLineScore}
              canJudgePassLine={estimated.canJudgePassLine}
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[var(--text-2)]">
              {scoreStage?.nextHint ? (
                <span className="font-semibold text-[var(--text-2)]">
                  {scoreStage.nextHint}
                </span>
              ) : estimated.canJudgePassLine && estimated.score >= estimated.passLineScore ? (
                <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-dark)]">
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                  慎重推定で合格基準圏内
                </span>
              ) : estimated.canJudgePassLine ? (
                <PassLineGap estimated={estimated} />
              ) : (
                <span className="font-semibold text-[var(--text-2)]">
                  {estimated.readiness === "collecting"
                    ? `仮推定まであと${estimated.nextStageRemaining}問`
                    : `次のステージまであと${estimated.nextStageRemaining}問`}
                </span>
              )}
            </div>
            {!estimated.canJudgePassLine ? (
              <div className="rounded-[12px] bg-[var(--bg-muted)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-2)]">
                {estimated.readiness === "collecting" ? (
                  <span>
                    まずは全9分野を3問ずつ。未到達分野を中心にあと
                    <strong className="font-bold text-[var(--text-1)]">
                      {estimated.minimumFieldRemaining}問
                    </strong>
                    解くと、仮推定に進みます。
                  </span>
                ) : (
                  <span>
                    信頼できる目安にするには、全体量だけでなく分野の偏りも埋める必要があります。下の不足分野を優先しましょう。
                  </span>
                )}
                <PriorityFieldAction estimated={estimated} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[var(--text-3)]">
                現在地スコア
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[var(--text-3)]">
                計算中…
              </p>
            </div>
            <EstimatedScoreInfo />
          </div>
        )}
      </div>
    </section>
  );
}

function ScoreSummary({
  score,
  maxScore,
  estimatedRate,
  passLineRate,
  canJudgePassLine,
  scoreStage,
  totalJudged,
  targetTotalJudged,
  readyFieldCount,
  totalFieldCount,
}: {
  score: number;
  maxScore: number;
  estimatedRate: number | null;
  passLineRate: number | null;
  canJudgePassLine: boolean;
  scoreStage: ScoreReliabilityStage | null;
  totalJudged: number;
  targetTotalJudged: number;
  readyFieldCount: number;
  totalFieldCount: number;
}) {
  if (estimatedRate === null || passLineRate === null) return null;
  const diff = estimatedRate - passLineRate;
  const isAtPass = canJudgePassLine && diff >= 0;
  const lineLabel = canJudgePassLine ? "合格目安" : "参考ライン";
  const diffText =
    diff >= 0 ? `${lineLabel}+${diff}pt` : `${lineLabel}まで${Math.abs(diff)}pt`;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[var(--text-3)]">
          現在地スコア
        </p>
        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="inline-flex items-baseline gap-1 leading-none">
            <span className="text-[42px] font-extrabold tracking-tight text-[var(--text-1)] tabular-nums">
              {score}
            </span>
            <span className="text-[18px] font-black text-[var(--text-2)]">
              /{maxScore}点
            </span>
          </span>
          <span className="mb-1 text-[15px] font-extrabold leading-none text-[var(--text-2)] tabular-nums">
            （{estimatedRate}%）
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {scoreStage ? (
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[12px] font-extrabold",
                scoreStage.isStable
                  ? "bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "bg-[var(--bg-muted)] text-[var(--text-2)]",
              )}
            >
              信頼度 {scoreStage.level}/{scoreStage.totalLevels}・
              {scoreStage.label}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[12px] font-extrabold",
              isAtPass
                ? "bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                : "bg-[var(--bg-muted)] text-[var(--text-2)]",
            )}
          >
            {diffText}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--text-3)]">
          解答数 {totalJudged}/{targetTotalJudged}問・分野網羅{" "}
          {readyFieldCount}/{totalFieldCount}
        </p>
      </div>
      <EstimatedScoreInfo />
    </div>
  );
}

function getScoreReliabilityStage(
  estimated: EstimatedScore,
): ScoreReliabilityStage {
  const totalLevels = 5;
  if (estimated.readiness === "collecting") {
    return {
      label: "データ収集中",
      level: 1,
      totalLevels,
      description: "まだ分野のデータを集めている段階です。",
      nextHint: `仮推定まであと${estimated.nextStageRemaining}問`,
      isStable: false,
    };
  }

  if (estimated.canJudgePassLine) {
    return {
      label: "安定推定",
      level: 5,
      totalLevels,
      description: "日々の現在地として最も信頼しやすい段階です。",
      nextHint: null,
      isStable: true,
    };
  }

  if (estimated.totalJudged >= 500 && estimated.readinessCoverage >= 50) {
    return {
      label: "実力推定",
      level: 4,
      totalLevels,
      description: "実力の傾向がかなり見えてきた段階です。",
      nextHint: `安定推定には解答数と分野網羅をさらに増やします`,
      isStable: false,
    };
  }

  if (estimated.totalJudged >= 100 && estimated.readinessCoverage >= 25) {
    return {
      label: "参考推定",
      level: 3,
      totalLevels,
      description: "弱点や得点傾向を参考にしやすくなった段階です。",
      nextHint: "実力推定には500問以上と分野網羅50%以上が目安です",
      isStable: false,
    };
  }

  return {
    label: "仮推定",
    level: 2,
    totalLevels,
    description: "全分野の最低データから控えめに出した初期値です。",
    nextHint: "参考推定には100問以上と分野網羅25%以上が目安です",
    isStable: false,
  };
}

function ScoreGauge({
  score,
  max,
  passLine,
  canJudgePassLine,
}: {
  score: number;
  max: number;
  passLine: number;
  canJudgePassLine: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, score / max));
  const passRatio = Math.max(0, Math.min(1, passLine / max));
  const isAtPass = canJudgePassLine && score >= passLine;
  const scorePercent = Math.round(ratio * 100);
  const passPercent = Math.round(passRatio * 100);

  return (
    <div className="space-y-2">
      <div
        className="relative pt-6 pb-4"
        aria-label={`慎重推定正答率 ${scorePercent}%、合格基準 ${passPercent}%`}
      >
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-[var(--primary-dark)]"
          style={{ left: `${passRatio * 100}%` }}
        >
          合格目安 {passPercent}%
        </span>
        <div className="relative h-4 w-full rounded-full bg-[var(--bg-muted)]">
          <div
            className="absolute top-0 right-0 h-full rounded-r-full bg-[var(--primary-soft)]/70"
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
            className="absolute top-1/2 h-7 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary-dark)] shadow-[0_0_0_2px_var(--bg-card)]"
            style={{ left: `${passRatio * 100}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--bg-card)] shadow-[0_2px_7px_rgba(0,0,0,0.18)]",
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
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-[var(--text-3)]">
          <span>0%</span>
          <span>100%</span>
        </div>
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
        aria-label="慎重推定スコアの計算ルール"
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
              慎重推定スコアの見方
            </p>
            <div className="mt-2 space-y-2">
              <p>
                最新の解答だけを使って分野別の正答率を出し、本試験の出題バランスで
                <strong className="font-bold text-[var(--text-1)]">150点満点</strong>
                に換算しています。正解が増えると上がり、不正解が増えると下がります。
              </p>
              <p>
                信頼度は5段階です：
                <strong className="font-bold text-[var(--text-1)]">
                  データ収集中 → 仮推定 → 参考推定 → 実力推定 → 安定推定
                </strong>
                。一番信頼できるのは、十分な解答数と分野網羅に届いた
                <strong className="font-bold text-[var(--text-1)]">安定推定</strong>
                です。
              </p>
              <p>
                解き始めは、足りない分を
                <strong className="font-bold text-[var(--text-1)]">50%</strong>
                として混ぜて控えめに補正します。解答数と分野の網羅が増えるほど
                実力に近い目安になります。バーの線は
                <strong className="font-bold text-[var(--text-1)]">60% / 90点</strong>
                の参考ラインです。
              </p>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PassLineGap({ estimated }: { estimated: EstimatedScore }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-2)]">
      合格基準まで残り{" "}
      <span className="font-bold text-[var(--text-1)]">
        {Math.max(0, estimated.passLineScore - estimated.score)}点
      </span>
    </span>
  );
}

function PriorityFieldAction({ estimated }: { estimated: EstimatedScore }) {
  const rows = estimated.fieldProgress
    .map((row) => {
      const isCollecting = estimated.readiness === "collecting";
      return {
        field: row.field,
        judged: row.judged,
        target: isCollecting ? row.minimumTargetJudged : row.targetJudged,
        remaining: isCollecting ? row.minimumRemaining : row.remaining,
      };
    })
    .filter((row) => row.remaining > 0)
    .sort((a, b) => {
      if (a.remaining !== b.remaining) return b.remaining - a.remaining;
      return b.target - a.target;
    })
    .slice(0, 3);

  if (rows.length === 0) return null;

  const href = buildUnansweredHref(rows.map((row) => row.field));

  return (
    <div className="mt-2 border-t border-border/70 pt-2">
      <p className="text-[11px] font-bold text-[var(--text-3)]">
        まず埋めたい分野
      </p>
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div
            key={row.field}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-0.5"
          >
            <span className="truncate text-[11px] font-semibold text-[var(--text-2)]">
              {row.field}
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-2)]">
              あと
              <strong className="mx-0.5 font-extrabold text-[var(--text-1)]">
                {row.remaining}
              </strong>
              問
            </span>
            <span className="col-span-2 text-[10px] text-[var(--text-3)]">
              現在 {row.judged}/{row.target}問
            </span>
          </div>
        ))}
      </div>
      <Link
        href={href}
        className="choice-pressable mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--primary)] px-3 py-2 text-[12px] font-bold text-white hover:opacity-95"
      >
        不足分野の未着手を解く
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function buildUnansweredHref(fields: readonly string[]): string {
  const params = new URLSearchParams();
  params.set("fields", fields.join("|"));
  return `/study/unanswered?${params.toString()}`;
}
