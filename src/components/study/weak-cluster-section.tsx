"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import {
  analyzeClusterWeakness,
  type QuestionClusterLookup,
} from "@/lib/ai-coach/cluster-weakness";

type Props = {
  clusters: readonly { id: string; clusterId: string; clusterLabel: string }[];
};

/**
 * 学習タブで「テーマ別 3問チェック」を、テーマごとの正答率が低い順に最大5件表示する。
 * 各行タップでテーマごとの「3問だけ確認」へ遷移。
 * 苦手克服（20問の集中演習）に対して、こちらは「気になるテーマをサクッと3問」のミニ確認用。
 */
export function WeakClusterSection({ clusters }: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const lookup = useMemo<QuestionClusterLookup>(
    () => ({
      byId: new Map(
        clusters.map((c) => [c.id, { id: c.clusterId, label: c.clusterLabel }]),
      ),
    }),
    [clusters],
  );

  const rows = useMemo(() => {
    if (!hydrated) return [];
    return analyzeClusterWeakness(entries, lookup);
  }, [entries, hydrated, lookup]);

  if (!hydrated) return null;
  if (rows.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
        テーマ別 3問チェック
      </h2>
      <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="mb-2 px-1 text-[11px] text-[var(--text-3)]">
          解答履歴から、正答率が低めのテーマを並べました。タップすると近い問題を3問だけ確認できます。
        </p>
        <ul className="divide-y divide-border/70">
          {rows.map((row) => (
            <li key={row.clusterId}>
              <Link
                href={`/study/ai-theme/${encodeURIComponent(row.clusterId)}?count=3`}
                className="group -mx-1 flex items-center gap-3 rounded-[10px] px-1 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-muted)]/50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
                  <Target className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--text-1)]">
                    {row.clusterLabel}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
                    解答{" "}
                    <span className="font-bold tabular-nums text-[var(--text-2)]">
                      {row.judged}
                    </span>
                    問 ・ 正解{" "}
                    <span className="font-bold tabular-nums text-[var(--text-2)]">
                      {row.correct}
                    </span>
                    問
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[var(--text-3)]">
                    正答率
                  </p>
                  <p className="text-[18px] font-extrabold leading-none tabular-nums text-[var(--primary-dark)]">
                    {row.accuracy}
                    <span className="text-[11px] font-bold">%</span>
                  </p>
                </div>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
