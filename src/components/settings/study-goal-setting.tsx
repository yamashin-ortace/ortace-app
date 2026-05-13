"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  STUDY_GOAL_DEADLINES,
  STUDY_GOAL_ROUNDS,
  STUDY_GOAL_SCOPES,
  formatGoalDeadlineLabel,
  getDeadlineDaysBeforeExam,
  getGoalDeadlineISO,
  previewDailyPace,
  type StudyGoalDeadline,
  type StudyGoalRounds,
  type StudyGoalScope,
} from "@/lib/study-goal";
import { useStudyGoalConfig } from "@/lib/study-goal/use-study-goal-config";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { cn } from "@/lib/utils";

type Props = {
  /** 過去問の総問題数（ペース計算の母数） */
  pastQuestionsTotal: number;
};

/**
 * 学習プリセット（B-prime：ガードレール付き自由設定）の編集UI。
 *
 * 「目標を立てるか」のトグル、スコープ／周回／期限を1択で組み合わせる形式。
 * 入力するたびに「1日 約 X問」のプレビューを出し、80問/日 を超える組み合わせは
 * 赤で警告して無理な目標を立てさせないようにする。
 */
export function StudyGoalSetting({ pastQuestionsTotal }: Props) {
  const { config, updateConfig } = useStudyGoalConfig();
  const { examDate } = useExamDate();

  const preview = previewDailyPace({
    scope: config.scope,
    rounds: config.rounds,
    deadline: config.deadline,
    examDateISO: examDate,
    pastQuestionsTotal,
  });
  const deadlineISO = getGoalDeadlineISO(
    examDate,
    getDeadlineDaysBeforeExam(config.deadline),
  );

  return (
    <div id="study-goal" className="scroll-mt-24 space-y-3">
      <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <p className="text-[12px] font-semibold text-[var(--text-3)]">
          学習プリセット（任意）
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          「スコープ × 周回 × 期限」の3つを選んで、自分の目標を組み立てます。
          選ばなくても学習は進められます。1日80問を超える組み合わせは赤で警告します。
        </p>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3",
          config.enabled
            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
            : "border-border bg-[var(--bg-card)]",
        )}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[var(--text-1)]">
            目標を立てる
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
            オフのときはホームのペース表示は出ません（自分のペース派向け）。
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
            config.enabled
              ? "bg-[var(--primary)]"
              : "bg-[var(--text-3)]/40",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              config.enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <fieldset
        disabled={!config.enabled}
        className={cn("space-y-3", !config.enabled && "opacity-50")}
      >
        <PickerRow
          legend="スコープ（何の問題を）"
          options={STUDY_GOAL_SCOPES.map((s) => ({
            id: s.id,
            label: s.label,
            hint: s.hint,
          }))}
          value={config.scope}
          onChange={(next) => updateConfig({ scope: next as StudyGoalScope })}
        />

        <PickerRow
          legend="周回（何回解く）"
          options={STUDY_GOAL_ROUNDS.map((r) => ({
            id: String(r),
            label: `${r}周`,
            hint:
              r === 1
                ? "まずは1周通すスタンダード"
                : r === 2
                  ? "合格安全圏の目安"
                  : "上位合格を狙う",
          }))}
          value={String(config.rounds)}
          onChange={(next) =>
            updateConfig({ rounds: Number(next) as StudyGoalRounds })
          }
        />

        <PickerRow
          legend="期限（いつまでに）"
          options={STUDY_GOAL_DEADLINES.map((d) => ({
            id: d.id,
            label: d.label,
            hint: d.hint,
          }))}
          value={config.deadline}
          onChange={(next) =>
            updateConfig({ deadline: next as StudyGoalDeadline })
          }
        />
      </fieldset>

      {config.enabled ? (
        <div
          className={cn(
            "rounded-[14px] border px-4 py-3",
            preview.isOverloaded
              ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-900/15"
              : "border-border bg-[var(--bg-muted)]/40",
          )}
        >
          <p className="text-[11px] font-semibold text-[var(--text-3)]">
            このプリセットだと
          </p>
          <p
            className={cn(
              "mt-0.5 text-[16px] font-extrabold",
              preview.isOverloaded
                ? "text-red-700 dark:text-red-300"
                : "text-[var(--text-1)]",
            )}
          >
            1日 約 {preview.perDay ?? "—"}問
            <span className="ml-2 text-[11px] font-medium text-[var(--text-3)]">
              （{formatGoalDeadlineLabel(deadlineISO)}まで {preview.daysLeft}日）
            </span>
          </p>
          {preview.isOverloaded ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
              1日80問を超えるペースになります。周回を減らすか、期限を見直すのをおすすめします。
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PickerRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<{ id: string; label: string; hint: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-[var(--text-3)]">{legend}</p>
      <div className="grid gap-2">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-[12px] border px-3 py-2 text-left transition-colors",
                selected
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-border bg-[var(--bg-card)] hover:bg-[var(--bg-muted)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--text-3)]/40 bg-[var(--bg-card)] text-transparent",
                )}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-[var(--text-1)]">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--text-2)]">
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
