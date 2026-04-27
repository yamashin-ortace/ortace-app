"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "system", label: "自動", icon: Monitor },
  { value: "dark", label: "ダーク", icon: Moon },
] as const;

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // next-themes の theme は SSR 時 undefined のため、マウント後に実値を描画する
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? theme ?? "system" : "system";

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[12px] bg-[var(--bg-muted)] p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-[var(--bg-card)] text-[var(--text-1)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            )}
          >
            <Icon className="h-[16px] w-[16px]" strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
