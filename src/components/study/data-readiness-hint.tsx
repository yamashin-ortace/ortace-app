"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, Lightbulb } from "lucide-react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";

type Props = {
  /** 「これだけ解くと精度が上がる」目安 */
  threshold?: number;
  /** モード説明用に補足文（例：「苦手分野の判定精度が上がります」）*/
  benefitMessage: string;
};

export function DataReadinessHint({
  threshold = 30,
  benefitMessage,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const answeredUniqueCount = useMemo(() => {
    if (!hydrated) return 0;
    return new Set(entries.map((entry) => entry.id)).size;
  }, [entries, hydrated]);

  if (!hydrated) return null;
  if (answeredUniqueCount >= threshold) return null;

  const remaining = Math.max(0, threshold - answeredUniqueCount);

  return (
    <Link
      href="/study/unanswered"
      className="group flex items-start gap-3 rounded-[14px] border border-[#F0B45C]/55 bg-[#FFF6E5] px-4 py-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:border-[#F0B45C]/35 dark:bg-[#3A2A12]"
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#F0B45C]/35 text-[#8A5A18] dark:text-[#FFD58A]">
        <Lightbulb className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="flex-1 space-y-1">
        <p className="text-[13px] font-bold text-[var(--text-1)]">
          まずは {remaining}問ほど解いてみましょう
        </p>
        <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
          現在の解答数は {answeredUniqueCount} 問。{benefitMessage}
          未着手モードで一気に手を動かすのもおすすめです。
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary-dark)]">
          <Inbox className="h-3 w-3" strokeWidth={2.5} />
          未着手モードを開く
          <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
