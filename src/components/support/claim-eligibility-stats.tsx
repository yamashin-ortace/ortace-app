"use client";

import { useMemo } from "react";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { SupportClaimEligibility } from "@/lib/support-claim/eligibility";
import { countLearningDaysFromAnsweredAts } from "@/lib/support-claim/learning-days";

type Props = {
  eligibility: SupportClaimEligibility;
};

export function ClaimEligibilityStats({ eligibility }: Props) {
  const { entries } = useAnswerHistoryList();
  const learningDays = useMemo(() => {
    const localDays = countLearningDaysFromAnsweredAts(
      entries.map((entry) => entry.answeredAt),
    );
    return Math.max(eligibility.learningDays, localDays);
  }, [entries, eligibility.learningDays]);

  return (
    <div className="grid gap-2 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4 sm:grid-cols-3">
      <EligibilityStat label="受験年度" value={`${eligibility.examYear}年度`} />
      <EligibilityStat
        label="直近3ヶ月の学習日"
        value={`${learningDays}/${eligibility.requiredLearningDays}日`}
      />
      <EligibilityStat label="申請期限" value={eligibility.deadlineLabel} />
    </div>
  );
}

function EligibilityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[var(--bg-muted)]/60 px-3 py-2">
      <p className="text-[10px] font-bold text-[var(--text-3)]">{label}</p>
      <p className="mt-1 text-[14px] font-extrabold text-[var(--text-1)]">
        {value}
      </p>
    </div>
  );
}
