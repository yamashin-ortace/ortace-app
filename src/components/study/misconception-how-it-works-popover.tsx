"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { MisconceptionSelectionCopy } from "@/components/study/misconception-selection-copy";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function MisconceptionHowItWorksPopover({ className }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          className,
          "-m-0.5 rounded-full p-1.5 text-[var(--text-3)] transition-colors",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        )}
        aria-label="思い込みチェックの選び方"
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
              "bg-[var(--bg-card)] p-4 text-[var(--text-2)] shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
            initialFocus={false}
          >
            <p className="text-[13px] font-bold text-[var(--text-1)]">
              思い込みチェックの選び方
            </p>
            <div className="mt-2">
              <MisconceptionSelectionCopy />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
