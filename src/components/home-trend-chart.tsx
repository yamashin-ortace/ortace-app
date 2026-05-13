"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

const STORAGE_KEY = "ortace.homeTrendExpanded";

export function HomeTrendChart() {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setExpanded(true);
    } catch {
      // localStorage 不可な環境（プライベートモード等）は既定の collapsed のまま
    }
  }, []);

  const bins7 = useMemo(() => buildDailyBins(entries, 7), [entries]);
  const bins30 = useMemo(() => buildDailyBins(entries, 30), [entries]);
  const bins = range === "7d" ? bins7 : bins30;
  const averagePerDay = useMemo(() => {
    if (bins7.length === 0) return 0;
    const total = bins7.reduce((sum, b) => sum + b.count, 0);
    return Math.round(total / bins7.length);
  }, [bins7]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!hydrated) {
    return (
      <section className="h-[68px] rounded-[14px] border border-border bg-[var(--bg-card)]" />
    );
  }

  return (
    <section
      aria-label="直近の学習推移"
      className="rounded-[14px] border border-border bg-[var(--bg-card)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="home-trend-chart-body"
        className={cn(
          "flex w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left transition-colors",
          "hover:bg-[var(--bg-muted)]/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-[var(--text-3)]">
              直近の推移
            </span>
            <span className="text-[11px] text-[var(--text-3)]">
              平均{" "}
              <span className="font-bold text-[var(--text-1)] tabular-nums">
                {averagePerDay}
              </span>
              問/日
            </span>
          </div>
          <div className="mt-1">
            <Sparkline bins={bins7} />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200",
            expanded && "rotate-180",
          )}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id="home-trend-chart-body"
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-3.5 pt-3 pb-4">
              <RangeTabs value={range} onChange={setRange} />
              <FullChart bins={bins} range={range} />
              <Legend />
            </div>
          </motion.div>
        ) : null}
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
      className="inline-flex h-8 items-center gap-1 rounded-[10px] bg-[var(--bg-muted)] p-1"
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
              "h-full rounded-[8px] px-3 text-[12px] font-bold leading-none transition-colors",
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

function Sparkline({ bins }: { bins: DailyBin[] }) {
  const width = 200;
  const height = 24;
  const max = Math.max(1, ...bins.map((b) => b.count));
  const gap = 2;
  const barWidth =
    bins.length === 0 ? 0 : (width - gap * (bins.length - 1)) / bins.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden
    >
      {bins.map((bin, i) => {
        const barHeight = bin.count === 0 ? 2 : (bin.count / max) * height;
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        return (
          <rect
            key={bin.date}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1.5}
            className="fill-[var(--primary)]/45"
          />
        );
      })}
    </svg>
  );
}

function FullChart({ bins, range }: { bins: DailyBin[]; range: Range }) {
  const padding = { top: 8, right: 8, bottom: 22, left: 24 };
  const innerWidth = 320;
  const innerHeight = 120;
  const width = innerWidth + padding.left + padding.right;
  const height = innerHeight + padding.top + padding.bottom;
  const maxCount = Math.max(4, ...bins.map((b) => b.count));
  const gap = range === "7d" ? 6 : 2;
  const barWidth =
    bins.length === 0 ? 0 : (innerWidth - gap * (bins.length - 1)) / bins.length;

  const linePoints = bins.map((bin, i) => {
    const cx = padding.left + i * (barWidth + gap) + barWidth / 2;
    if (bin.judged === 0) return { cx, cy: null as number | null, bin };
    const rate = bin.correct / bin.judged;
    const cy = padding.top + innerHeight - rate * innerHeight;
    return { cx, cy, bin };
  });

  const linePath = buildLinePath(linePoints);

  const xLabels = pickXLabels(bins, range);

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={`直近${range === "7d" ? "7" : "30"}日の解答数と正答率の推移`}
        className="block"
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={padding.left + innerWidth}
                y1={y}
                y2={y}
                className="stroke-[var(--border)]"
                strokeWidth={ratio === 0 ? 1 : 0.5}
                strokeDasharray={ratio === 0 ? undefined : "2 3"}
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--text-3)] text-[9px] tabular-nums"
              >
                {Math.round(ratio * maxCount)}
              </text>
            </g>
          );
        })}

        {bins.map((bin, i) => {
          const barHeight = bin.count === 0 ? 0 : (bin.count / maxCount) * innerHeight;
          const x = padding.left + i * (barWidth + gap);
          const y = padding.top + innerHeight - barHeight;
          return (
            <rect
              key={bin.date}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              className="fill-[var(--primary)]/55"
            />
          );
        })}

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-[var(--primary-dark)]"
          />
        ) : null}
        {linePoints.map((pt) =>
          pt.cy === null ? null : (
            <circle
              key={pt.bin.date}
              cx={pt.cx}
              cy={pt.cy}
              r={range === "7d" ? 2.5 : 1.5}
              className="fill-[var(--primary-dark)]"
            />
          ),
        )}

        {xLabels.map(({ index, label }) => {
          const cx = padding.left + index * (barWidth + gap) + barWidth / 2;
          return (
            <text
              key={index}
              x={cx}
              y={height - 6}
              textAnchor="middle"
              className="fill-[var(--text-3)] text-[9px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-3)]">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-[var(--primary)]/55" />
        解答数
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[2px] w-3 bg-[var(--primary-dark)]" />
        正答率（0-100%）
      </span>
    </div>
  );
}

function buildLinePath(
  points: { cx: number; cy: number | null }[],
): string | null {
  const valid = points.filter(
    (p): p is { cx: number; cy: number } => p.cy !== null,
  );
  if (valid.length < 2) return null;
  return valid
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.cx} ${p.cy}`)
    .join(" ");
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
