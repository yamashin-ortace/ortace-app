import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ExamRound } from "@/lib/questions";

type Props = {
  round: ExamRound;
  /** 西暦（任意・第47回=2017年）*/
  year?: number;
};

/** 第47回〜56回 → 開催年（参考表示用） */
const YEAR_BY_ROUND: Record<number, number> = {
  47: 2017,
  48: 2018,
  49: 2019,
  50: 2020,
  51: 2021,
  52: 2022,
  53: 2023,
  54: 2024,
  55: 2025,
  56: 2026,
};

export function RoundCard({ round, year = YEAR_BY_ROUND[round] }: Props) {
  return (
    <Link
      href={`/study/${round}`}
      className="group flex min-h-[74px] items-center justify-between rounded-[12px] border border-border bg-[var(--bg-card)] px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-col">
        <span className="text-[15px] font-bold tracking-tight text-[var(--text-1)]">
          第{round}回
        </span>
        <span className="mt-0.5 text-[10px] text-[var(--text-3)]">
          {year ? `${year}年実施 / ` : ""}150問
        </span>
      </div>
      <ChevronRight
        className="h-4 w-4 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}
