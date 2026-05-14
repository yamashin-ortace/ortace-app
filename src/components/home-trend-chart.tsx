"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getTokyoDateString } from "@/lib/daily-limit";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d";

type DailyBin = {
  date: string;
  count: number;
  correct: number;
  judged: number;
};

const CHART_INNER_WIDTH = 320;
const CHART_INNER_HEIGHT = 120;
const CHART_PADDING = { top: 10, right: 40, bottom: 22, left: 28 };
const CHART_WIDTH =
  CHART_INNER_WIDTH + CHART_PADDING.left + CHART_PADDING.right;
const CHART_HEIGHT =
  CHART_INNER_HEIGHT + CHART_PADDING.top + CHART_PADDING.bottom;

export function HomeTrendChart() {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const bins7 = useMemo(() => buildDailyBins(entries, 7), [entries]);
  const bins30 = useMemo(() => buildDailyBins(entries, 30), [entries]);
  const bins = range === "7d" ? bins7 : bins30;

  if (!hydrated) {
    return (
      <section className="h-[220px] rounded-[14px] border border-border bg-[var(--bg-card)]" />
    );
  }

  return (
    <section
      aria-label="直近の学習推移"
      className="space-y-3 rounded-[14px] border border-border bg-[var(--bg-card)] px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-semibold text-[var(--text-3)]">
          直近の推移
        </h3>
        <RangeTabs value={range} onChange={setRange} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="space-y-3"
        >
          <FullChart bins={bins} range={range} />
          <AverageStrip bins={bins} range={range} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: Range;
  onChange: (next: Range) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="表示期間"
      className="inline-flex h-7 items-center gap-1 rounded-[10px] bg-[var(--bg-muted)] p-1"
    >
      {(["7d", "30d"] as const).map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "h-full rounded-[8px] px-2.5 text-[11px] font-bold leading-none transition-colors",
              selected
                ? "bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm"
                : "text-[var(--text-3)]",
            )}
          >
            {option === "7d" ? "7日" : "30日"}
          </button>
        );
      })}
    </div>
  );
}

function FullChart({ bins, range }: { bins: DailyBin[]; range: Range }) {
  const geom = useMemo(() => computeGeometry(bins, range), [bins, range]);
  const xLabels = useMemo(() => pickXLabels(bins, range), [bins, range]);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 外側タップで tooltip を閉じる
  useEffect(() => {
    if (tappedIndex === null) return;
    const handle = (event: globalThis.MouseEvent | TouchEvent) => {
      const node = containerRef.current;
      if (!node) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      setTappedIndex(null);
    };
    window.addEventListener("mousedown", handle);
    window.addEventListener("touchstart", handle, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("touchstart", handle);
    };
  }, [tappedIndex]);

  const handleColumnClick = (index: number) => (event: MouseEvent) => {
    event.stopPropagation();
    setTappedIndex((prev) => (prev === index ? null : index));
  };

  const tappedBin = tappedIndex !== null ? bins[tappedIndex] : null;
  const tappedLeftPercent =
    tappedIndex !== null
      ? clampPercent(
          ((geom.barX(tappedIndex) + geom.barWidth / 2) / CHART_WIDTH) * 100,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        role="img"
        aria-label={`直近${range === "7d" ? "7" : "30"}日の解答数と正答率の推移`}
        className="block"
      >
        {/* 水平グリッド + 左軸（問題数）+ 右軸（正答率） */}
        {[0, 0.5, 1].map((ratio) => {
          const y = CHART_PADDING.top + CHART_INNER_HEIGHT - ratio * CHART_INNER_HEIGHT;
          return (
            <g key={ratio}>
              <line
                x1={CHART_PADDING.left}
                x2={CHART_PADDING.left + CHART_INNER_WIDTH}
                y1={y}
                y2={y}
                className="stroke-[var(--border)]"
                strokeWidth={ratio === 0 ? 1 : 0.5}
                strokeDasharray={ratio === 0 ? undefined : "2 3"}
              />
              <text
                x={CHART_PADDING.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--text-3)] text-[9px] tabular-nums"
              >
                {Math.round(ratio * geom.maxCount)}
              </text>
              <text
                x={CHART_PADDING.left + CHART_INNER_WIDTH + 5}
                y={y + 3}
                textAnchor="start"
                className="fill-[var(--text-3)] text-[8px] tabular-nums"
              >
                {Math.round(ratio * 100)}%
              </text>
            </g>
          );
        })}

        {/* 棒（解答数） */}
        {bins.map((bin, i) => (
          <rect
            key={`bar-${bin.date}`}
            x={geom.barX(i)}
            y={geom.barY(bin)}
            width={geom.barWidth}
            height={geom.barHeight(bin)}
            rx={2}
            className={cn(
              "fill-[var(--primary)]/55 transition-opacity",
              tappedIndex !== null && tappedIndex !== i && "opacity-30",
            )}
          />
        ))}

        {/* 折れ線（正答率） */}
        {geom.linePath ? (
          <path
            d={geom.linePath}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-[var(--primary-dark)]"
          />
        ) : null}
        {geom.linePoints.map((pt) =>
          pt.cy === null ? null : (
            <circle
              key={`pt-${pt.bin.date}`}
              cx={pt.cx}
              cy={pt.cy}
              r={range === "7d" ? 2.5 : 1.5}
              className="fill-[var(--primary-dark)]"
            />
          ),
        )}

        {/* 横軸ラベル（M/D） */}
        {xLabels.map(({ index, label }) => {
          const cx = geom.barX(index) + geom.barWidth / 2;
          return (
            <text
              key={`xl-${index}`}
              x={cx}
              y={CHART_HEIGHT - 6}
              textAnchor="middle"
              className="fill-[var(--text-3)] text-[9px]"
            >
              {label}
            </text>
          );
        })}

        {/* 透明なタップ領域（バーが細くてもタップしやすいよう列全幅） */}
        {bins.map((bin, i) => (
          <rect
            key={`hit-${bin.date}`}
            x={geom.barX(i) - geom.gap / 2}
            y={CHART_PADDING.top}
            width={geom.barWidth + geom.gap}
            height={CHART_INNER_HEIGHT}
            fill="transparent"
            className="cursor-pointer"
            onClick={handleColumnClick(i)}
            aria-label={`${formatShortLabel(bin.date)} 解答${bin.count}問`}
          />
        ))}
      </svg>

      <AnimatePresence>
        {tappedBin && tappedLeftPercent !== null ? (
          <motion.div
            key={tappedBin.date}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute z-10 -translate-x-1/2 rounded-[8px] border border-border bg-[var(--bg-card)]",
              "px-1.5 py-1 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            )}
            style={{ left: `${tappedLeftPercent}%`, top: 0 }}
          >
            <p className="text-[8px] leading-none text-[var(--text-3)]">
              {formatShortLabel(tappedBin.date)}
            </p>
            <p className="mt-0.5 text-[10px] leading-none font-bold text-[var(--text-1)] tabular-nums">
              解答 {tappedBin.count}問
            </p>
            <p className="mt-0.5 text-[10px] leading-none font-semibold text-[var(--primary-dark)] tabular-nums">
              正答率 {tappedBin.judged === 0
                ? "--"
                : Math.round((tappedBin.correct / tappedBin.judged) * 100)}
              %
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AverageStrip({ bins, range }: { bins: DailyBin[]; range: Range }) {
  const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
  const judgedTotal = bins.reduce((sum, b) => sum + b.judged, 0);
  const correctTotal = bins.reduce((sum, b) => sum + b.correct, 0);
  const avgPerDay = bins.length === 0 ? 0 : Math.round(totalCount / bins.length);
  const accuracy =
    judgedTotal === 0 ? null : Math.round((correctTotal / judgedTotal) * 100);
  const rangeLabel = range === "7d" ? "直近7日" : "直近30日";

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--bg-muted)]/45 px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--text-3)]">
        {rangeLabel}の平均
      </p>
      <p className="text-[12px] font-bold text-[var(--text-2)] tabular-nums">
        <span className="text-[var(--text-1)]">{avgPerDay}</span>
        問/日 ・ 正答率{" "}
        <span className="text-[var(--text-1)]">
          {accuracy === null ? "--" : accuracy}
        </span>
        %
      </p>
    </div>
  );
}

type ChartGeometry = {
  maxCount: number;
  gap: number;
  barWidth: number;
  barX: (index: number) => number;
  barY: (bin: DailyBin) => number;
  barHeight: (bin: DailyBin) => number;
  linePoints: Array<{ cx: number; cy: number | null; bin: DailyBin }>;
  linePath: string | null;
};

function computeGeometry(bins: DailyBin[], range: Range): ChartGeometry {
  const maxCount = Math.max(4, ...bins.map((b) => b.count));
  const gap = range === "7d" ? 6 : 2;
  const barWidth =
    bins.length === 0
      ? 0
      : (CHART_INNER_WIDTH - gap * (bins.length - 1)) / bins.length;

  const barX = (index: number) =>
    CHART_PADDING.left + index * (barWidth + gap);

  const barHeight = (bin: DailyBin) =>
    bin.count === 0 ? 0 : (bin.count / maxCount) * CHART_INNER_HEIGHT;

  const barY = (bin: DailyBin) =>
    CHART_PADDING.top + CHART_INNER_HEIGHT - barHeight(bin);

  const linePoints = bins.map((bin, i) => {
    const cx = barX(i) + barWidth / 2;
    if (bin.judged === 0) return { cx, cy: null as number | null, bin };
    const rate = bin.correct / bin.judged;
    const cy = CHART_PADDING.top + CHART_INNER_HEIGHT - rate * CHART_INNER_HEIGHT;
    return { cx, cy, bin };
  });

  const valid = linePoints.filter(
    (p): p is { cx: number; cy: number; bin: DailyBin } => p.cy !== null,
  );
  const linePath =
    valid.length < 2
      ? null
      : valid.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx} ${p.cy}`).join(" ");

  return { maxCount, gap, barWidth, barX, barY, barHeight, linePoints, linePath };
}

function clampPercent(value: number): number {
  return Math.max(8, Math.min(92, value));
}

function pickXLabels(bins: DailyBin[], range: Range) {
  if (bins.length === 0) return [];
  if (range === "7d") {
    return bins.map((bin, index) => ({
      index,
      label: formatShortLabel(bin.date),
    }));
  }
  const stride = Math.ceil(bins.length / 5);
  return bins
    .map((bin, index) => ({ index, label: formatShortLabel(bin.date) }))
    .filter(({ index }) => index === 0 || index === bins.length - 1 || index % stride === 0);
}

function formatShortLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function buildDailyBins(
  entries: AnswerHistoryEntry[],
  days: number,
): DailyBin[] {
  const today = getTokyoDateString();
  const dateList = lastNDates(today, days);
  const byDate = new Map<string, DailyBin>();
  for (const date of dateList) {
    byDate.set(date, { date, count: 0, correct: 0, judged: 0 });
  }
  for (const entry of entries) {
    const date = getTokyoDateString(new Date(entry.answeredAt));
    const bin = byDate.get(date);
    if (!bin) continue;
    bin.count += 1;
    if (entry.result !== "no_answer") {
      bin.judged += 1;
      if (entry.result === "correct") bin.correct += 1;
    }
  }
  return dateList.map((date) => byDate.get(date)!);
}

function lastNDates(todayTokyo: string, days: number): string[] {
  const todayNoon = new Date(`${todayTokyo}T12:00:00+09:00`);
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayNoon.getTime() - i * 24 * 60 * 60 * 1000);
    list.push(getTokyoDateString(d));
  }
  return list;
}
