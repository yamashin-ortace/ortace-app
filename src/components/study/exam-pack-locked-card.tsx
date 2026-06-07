import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  FileQuestion,
  LockKeyhole,
  Target,
} from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

const LOCKED_FEATURES: {
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "中分類の弱点深掘り",
    description: "履歴から苦手テーマを細かく見つけ、克服順に集中演習できます。",
    Icon: Target,
  },
  {
    title: "テーマ別 3問チェック TOP5",
    description: "正答率が低いテーマを上位5件に絞り、3問だけ確認できます。",
    Icon: BarChart3,
  },
  {
    title: "初見問題にチャレンジ",
    description: "過去問で固めた力を、オリジナル問題で試せます。",
    Icon: FileQuestion,
  },
  {
    title: "模試にチャレンジ",
    description: "本番形式の75問模試とスコアレポートを利用できます。",
    Icon: CalendarDays,
  },
];

export function ExamPackLockedCard({
  title = "国試対策パックで、直前期の仕上げまで",
  description = "テーマ別3問チェック、中分類の弱点深掘り、オリジナル問題、75問模試、直近テーマ対策を利用できます。",
}: Props) {
  return (
    <Link
      href="/plans"
      className="group flex items-center gap-3 rounded-[16px] border border-dashed border-[var(--primary-dark)]/45 bg-[var(--bg-muted)]/65 p-4 text-[var(--text-1)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-[var(--primary-dark)]/65 hover:shadow-[0_5px_16px_rgba(0,0,0,0.07)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-[var(--primary-dark)]/20 bg-[var(--bg-card)] text-[var(--primary-dark)]">
        <LockKeyhole className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-extrabold tracking-tight">{title}</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--primary-dark)]/30 bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary-dark)]">
            <LockKeyhole className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            ロック中
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          {description}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[var(--primary-dark)] transition-transform group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}

export function ExamPackLockedFeatureList() {
  return (
    <div className="space-y-2.5">
      {LOCKED_FEATURES.map(({ title, description, Icon }) => (
        <Link
          key={title}
          href="/plans"
          className="group flex items-center gap-3 rounded-[14px] border border-dashed border-[var(--primary-dark)]/45 bg-[var(--bg-muted)]/65 p-3.5 text-[var(--text-1)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-[var(--primary-dark)]/65 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]"
          aria-label={`${title}は国試対策パック限定です`}
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border border-[var(--primary-dark)]/20 bg-[var(--bg-card)] text-[var(--primary-dark)]">
            <Icon className="h-5 w-5 opacity-80" strokeWidth={2.5} aria-hidden />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-[var(--bg-card)] bg-[var(--text-2)] text-white">
              <LockKeyhole className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[14px] font-extrabold tracking-tight text-[var(--text-1)]">
                {title}
              </p>
              <span className="rounded-full border border-[var(--primary-dark)]/30 bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary-dark)]">
                ロック中
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
              {description}
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[var(--primary-dark)] transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.5}
          />
        </Link>
      ))}
    </div>
  );
}
