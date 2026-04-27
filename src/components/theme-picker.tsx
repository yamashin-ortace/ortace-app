"use client";

import { Check } from "lucide-react";
import { COLOR_THEMES, useColorTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="grid grid-cols-5 gap-3">
      {COLOR_THEMES.map((theme) => {
        const active = theme.value === colorTheme;
        return (
          <button
            key={theme.value}
            type="button"
            onClick={() => setColorTheme(theme.value)}
            aria-label={`${theme.label}テーマ`}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[12px] p-2 transition-colors",
              active ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)]"
            )}
          >
            <span
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform",
                active ? "scale-105 border-[var(--text-1)]" : "border-transparent"
              )}
              style={{ background: theme.swatch }}
            >
              {active && (
                <Check
                  className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                  strokeWidth={3}
                />
              )}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-[var(--text-1)]" : "text-[var(--text-3)]"
              )}
            >
              {theme.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
