"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { Flame, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_BOX =
  "flex h-full min-h-0 w-full min-w-0 flex-col rounded-[14px] border border-border bg-[var(--bg-card)] p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)]";
const ROW_LABEL =
  "flex min-h-10 w-full items-center gap-1.5 text-[11px] font-medium text-[var(--text-3)]";
const ROW_VALUE = "mt-1.5 flex w-full min-w-0 items-baseline justify-start gap-1";

type HomeStatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  /** ラベル行の右端（例: 情報アイコンボタン） */
  trailing?: React.ReactNode;
};

/**
 * ホーム3枚の数値カード共通レイアウト。ラベル行・数値行の揃えを揃える。
 */
export function HomeStatCard({ icon, label, value, unit, trailing }: HomeStatCardProps) {
  return (
    <div className={CARD_BOX}>
      <div className={ROW_LABEL}>
        <span className="shrink-0 text-[var(--primary-dark)] [&_svg]:block">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex w-full min-w-0 items-center justify-between gap-0.5">
            <span className="min-w-0 flex-1 leading-tight">{label}</span>
            {trailing != null ? <span className="shrink-0">{trailing}</span> : null}
          </div>
        </div>
      </div>
      <div className={ROW_VALUE}>
        <span className="text-[22px] font-extrabold leading-none tracking-tight text-[var(--text-1)] tabular-nums">
          {value}
        </span>
        <span className="shrink-0 text-[11px] text-[var(--text-3)]">{unit}</span>
      </div>
    </div>
  );
}

const STREAK_INFO =
  "「学習の継続」は、解答や復習を行った日の連続を表す想定です（アプリを開いただけの日は含みません）。本番では学習データと連携して集計する予定です。";

/**
 * 学習の継続＋ラベル横のポップオーバー説明
 */
export function StreakStatCard() {
  return (
    <HomeStatCard
      icon={<Flame className="h-5 w-5" strokeWidth={2} />}
      label="学習の継続"
      value="0"
      unit="日"
      trailing={
        <Popover.Root>
          <Popover.Trigger
            type="button"
            className={cn(
              "rounded-full p-1.5 text-[var(--text-3)] transition-colors -m-0.5",
              "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] focus-visible:outline-none"
            )}
            aria-label="学習の継続の説明を表示"
          >
            <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              className="z-50 max-w-[min(20rem,calc(100vw-1.5rem))]"
              side="top"
              align="end"
              sideOffset={6}
            >
              <Popover.Popup
                className={cn(
                  "w-[var(--positioner-width)] max-w-[min(20rem,calc(100vw-1.5rem))] rounded-[12px] border border-border",
                  "bg-[var(--bg-card)] p-3 text-[13px] leading-relaxed text-[var(--text-2)] shadow-lg",
                  "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
                  "data-open:animate-in data-open:zoom-in-95 data-open:fade-in-0",
                  "data-closed:animate-out data-closed:zoom-out-95 data-closed:fade-out-0"
                )}
                initialFocus={false}
              >
                <p>{STREAK_INFO}</p>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      }
    />
  );
}
