"use client";

import {
  STUDY_GOAL_ROUNDS_MAX,
  STUDY_GOAL_ROUNDS_MIN,
} from "@/lib/study-goal";
import { useStudyRoundsTarget } from "@/lib/study-goal/use-study-rounds-target";
import { cn } from "@/lib/utils";

/** 試験日までに向けて「総解答」を数えるときの過去問周回めあて（ひとつのみ設定） */
export function StudyGoalSetting() {
  const { roundsTarget, setRoundsTarget } = useStudyRoundsTarget();
  const options = Array.from(
    { length: STUDY_GOAL_ROUNDS_MAX - STUDY_GOAL_ROUNDS_MIN + 1 },
    (_, i) => STUDY_GOAL_ROUNDS_MIN + i,
  );

  return (
    <div id="study-goal" className="scroll-mt-24 space-y-3">
      <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <p className="text-[12px] font-semibold text-[var(--text-3)]">
          目標となる「過去問の周回」
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          ひとつ選ぶと、「全問題数 × 周回」を目標の総解答数として、試験日までのペースがホームに出ます。
          （同じ問題に何度も答えたときも、解答のたびにカウントされます）
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRoundsTarget(n)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
              roundsTarget === n
                ? "bg-[var(--primary)] text-white"
                : "border border-border bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-muted)]",
            )}
          >
            {n}周
          </button>
        ))}
      </div>
    </div>
  );
}
