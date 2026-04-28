"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, LineChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/study", label: "学習", icon: BookOpen },
  { href: "/records", label: "記録", icon: LineChart },
  { href: "/me", label: "マイページ", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[var(--bg-card)]/95 backdrop-blur"
    >
      <ul className="mx-auto flex h-14 w-full max-w-[480px] items-stretch justify-around md:max-w-[960px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
                  active
                    ? "text-[var(--primary-dark)]"
                    : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                )}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "min-w-0 max-w-full text-center leading-tight",
                    "font-medium",
                    active && "font-semibold"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
