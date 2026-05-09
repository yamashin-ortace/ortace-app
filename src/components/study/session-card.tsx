import Link from "next/link";
import { ChevronRight, Sun, Moon, Layers } from "lucide-react";
import type { ExamRound } from "@/lib/questions";

type Variant = "am" | "pm" | "all";

type Props = {
  round: ExamRound;
  variant: Variant;
};

const VARIANTS: Record<
  Variant,
  { label: string; subtitle: string; href: (r: number) => string; Icon: typeof Sun }
> = {
  am: {
    label: "午前",
    subtitle: "75問",
    href: (r) => `/study/${r}/am`,
    Icon: Sun,
  },
  pm: {
    label: "午後",
    subtitle: "75問",
    href: (r) => `/study/${r}/pm`,
    Icon: Moon,
  },
  all: {
    label: "全問",
    subtitle: "150問（午前+午後）",
    href: (r) => `/study/${r}/all`,
    Icon: Layers,
  },
};

export function SessionCard({ round, variant }: Props) {
  const v = VARIANTS[variant];
  const Icon = v.Icon;
  return (
    <Link
      href={v.href(round)}
      className="group flex items-center gap-3 rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--bg-muted)] text-[var(--primary-dark)]">
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[15px] font-bold tracking-tight text-[var(--text-1)]">
          {v.label}
        </span>
        <span className="mt-0.5 text-[11px] text-[var(--text-3)]">{v.subtitle}</span>
      </div>
      <ChevronRight
        className="h-4 w-4 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}

export type { Variant as SessionVariant };
