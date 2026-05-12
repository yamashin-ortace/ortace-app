"use client";

import { Popover } from "@base-ui/react/popover";
import { HelpCircle } from "lucide-react";
import { TodayRecommendedSelectionCopy } from "@/components/study/today-recommended-selection-copy";
import { cn } from "@/lib/utils";

type Props = {
  /** 「今日のおすすめ」の横に並べる想定 */
  className?: string;
};

export function TodayRecommendedHowItWorksPopover({ className }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          className,
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-[var(--bg-muted)] text-[var(--text-2)] shadow-sm transition-[transform,colors,box-shadow]",
          "hover:bg-[var(--bg-card)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label="今日のおすすめの選び方"
      >
        <HelpCircle className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden />
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
              "bg-[var(--bg-card)] p-4 text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p className="text-[13px] font-bold text-[var(--text-1)]">
              今日やる問題の決め方
            </p>
            <div className="mt-2">
              <TodayRecommendedSelectionCopy />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
