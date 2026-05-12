"use client";

import { Check } from "lucide-react";
import {
  STUDY_GOAL_PRESETS,
  formatGoalDeadlineLabel,
  getGoalDeadlineISO,
  ORIGINAL_QUESTIONS_TOTAL,
  type StudyGoalPreset,
} from "@/lib/study-goal";
import { useStudyGoalPreset } from "@/lib/study-goal/use-study-goal-preset";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { cn } from "@/lib/utils";

type Props = {
  /** 過去問の総問題数（ペース計算の母数） */
  pastQuestionsTotal: number;
};

/**
 * 学習プリセット（none / base / safe / top）の1択選択。
 * 各プリセットで「目標問題数 × 期限まで日数」から1日あたりの目安を算出して見せる。
 */
export function StudyGoalSetting({ pastQuestionsTotal }: Props) {
  const { presetId, setPresetId } = useStudyGoalPreset();
  const { examDate } = useExamDate();

  return (
    <div id="study-goal" className="scroll-mt-24 space-y-3">
      <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <p className="text-[12px] font-semibold text-[var(--text-3)]">
          学習プリセット
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          1つだけ選びます。プリセットを選ぶと、ホーム画面に「いつまでに何問」「1日あたりの目安」が出ます。
          いずれも目標期限は本試験日より前に置き、直前は復習・模試にあてる前提です。
        </p>
      </div>
      <div className="space-y-2">
        {STUDY_GOAL_PRESETS.map((preset) => (
          <PresetOption
            key={preset.id}
            preset={preset}
            selected={preset.id === presetId}
            onSelect={() => setPresetId(preset.id)}
            examDateISO={examDate}
            pastQuestionsTotal={pastQuestionsTotal}
          />
        ))}
      </div>
    </div>
  );
}

function PresetOption({
  preset,
  selected,
  onSelect,
  examDateISO,
  pastQuestionsTotal,
}: {
  preset: StudyGoalPreset;
  selected: boolean;
  onSelect: () => void;
  examDateISO: string;
  pastQuestionsTotal: number;
}) {
  const targetTotal =
    preset.pastRounds * pastQuestionsTotal +
    preset.originalRounds * ORIGINAL_QUESTIONS_TOTAL;
  const deadlineISO =
    preset.id === "none"
      ? null
      : getGoalDeadlineISO(examDateISO, preset.daysBeforeExam);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
          : "border-border bg-[var(--bg-card)] hover:bg-[var(--bg-muted)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          selected
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[var(--text-3)]/40 bg-[var(--bg-card)] text-transparent",
        )}
        aria-hidden
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[14px] font-bold text-[var(--text-1)]">
          {preset.label}
        </p>
        <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
          {preset.summary}
        </p>
        {deadlineISO ? (
          <p className="text-[11px] text-[var(--text-3)] tabular-nums">
            目標期限：{formatGoalDeadlineLabel(deadlineISO)}　／　目標総解答：
            {targetTotal.toLocaleString()}問
          </p>
        ) : null}
      </div>
    </button>
  );
}
