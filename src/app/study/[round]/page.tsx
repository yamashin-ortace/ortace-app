import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { SessionCard } from "@/components/study/session-card";
import { isExamRound } from "@/lib/questions/loader";

type Props = {
  params: Promise<{ round: string }>;
};

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

export default async function RoundDetailPage({ params }: Props) {
  const { round: roundStr } = await params;
  const round = Number(roundStr);
  if (!isExamRound(round)) notFound();

  const year = YEAR_BY_ROUND[round];

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          第{round}回
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          {year}年実施 / 全150問
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          範囲を選ぶ
        </h2>
        <div className="space-y-3">
          <SessionCard round={round} variant="am" />
          <SessionCard round={round} variant="pm" />
          <SessionCard round={round} variant="all" />
        </div>
      </section>
    </div>
  );
}
