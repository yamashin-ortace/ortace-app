"use client";

import { CalendarRange, Info } from "lucide-react";
import {
  STUDY_GOAL_DEADLINES,
  STUDY_GOAL_ROUNDS,
  STUDY_GOAL_SCOPES,
  formatGoalDeadlineLabel,
  formatGoalDeadlineLabelWithWeekday,
  getGoalDeadlineISO,
  isValidISODate,
  previewDailyPace,
  resolveGoalDeadlineISO,
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
    customDeadlineISO: config.customDeadlineISO,
    examDateISO: examDate,
    pastQuestionsTotal,
  });
  const deadlineISO = resolveGoalDeadlineISO(config, examDate);

  const handleDeadlineChange = (next: string) => {
    if (next === "custom") {
      // 初回 "自分で決める" 選択時、まだ customDeadlineISO が未設定なら
      // 試験1ヶ月前を初期値として埋める。
      const fallback =
        config.customDeadlineISO ?? getGoalDeadlineISO(examDate, 30);
      updateConfig({
        deadline: "custom",
        customDeadlineISO: fallback,
      });
      return;
    }
    updateConfig({ deadline: next as StudyGoalDeadline });
  };

  const handleCustomDateChange = (value: string) => {
    if (!isValidISODate(value)) return;
    updateConfig({ customDeadlineISO: value });
  };

  const todayISO = formatTodayISO();

  return (
    <div id="study-goal" className="scroll-mt-24 space-y-3">
      <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <p className="text-[12px] font-semibold text-[var(--text-3)]">
          学習プリセット（任意）
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
          「対象範囲 × 周回 × 期限」の3つを選んで、自分の目標を組み立てます。
          選ばなくても学習は進められます。
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
        <ChipRow
          legend="対象範囲（どの問題？）"
          options={STUDY_GOAL_SCOPES.map((s) => ({
            id: s.id,
            label: s.label,
            hint: s.hint,
          }))}
          value={config.scope}
          onChange={(next) => updateConfig({ scope: next as StudyGoalScope })}
        />

        <ChipRow
          legend="周回（何周する？）"
          options={STUDY_GOAL_ROUNDS.map((r) => ({
            id: String(r),
            label: `${r}周`,
            hint:
              r === 1
                ? "まずは全範囲を1回"
                : r === 2
                  ? "合格安全圏の目安"
                  : "上位合格を狙う",
          }))}
          value={String(config.rounds)}
          onChange={(next) =>
            updateConfig({ rounds: Number(next) as StudyGoalRounds })
          }
        />

        <div className="space-y-2">
          <ChipRow
            legend="期限（いつまで？）"
            options={STUDY_GOAL_DEADLINES.map((d) => ({
              id: d.id,
              label: d.label,
              hint: d.hint,
            }))}
            value={config.deadline}
            onChange={handleDeadlineChange}
          />
          {config.deadline === "custom" ? (
            <div className="space-y-1.5 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5">
              <label
                htmlFor="study-goal-custom-deadline"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-3)]"
              >
                <CalendarRange className="h-3.5 w-3.5" strokeWidth={2.5} />
                期限日
              </label>
              <input
                id="study-goal-custom-deadline"
                type="date"
                min={todayISO}
                max={examDate}
                value={config.customDeadlineISO ?? ""}
                onChange={(event) => handleCustomDateChange(event.target.value)}
                className={cn(
                  "block h-10 w-full min-w-0 max-w-full appearance-none rounded-[10px] border border-border bg-[var(--bg-card)] px-3 text-[14px] font-bold text-[var(--text-1)]",
                  "focus:border-[var(--primary)] focus:outline-none",
                )}
                style={{ boxSizing: "border-box" }}
              />
              {config.customDeadlineISO ? (
                <p className="text-[11px] leading-snug text-[var(--text-2)]">
                  期限：{formatGoalDeadlineLabelWithWeekday(config.customDeadlineISO)}
                </p>
              ) : (
                <p className="text-[11px] leading-snug text-[var(--text-3)]">
                  日付を選んでください（今日〜試験日まで）
                </p>
              )}
            </div>
          ) : null}
        </div>
      </fieldset>

      {config.enabled ? (
        <div className="rounded-[14px] border border-border bg-[var(--bg-muted)]/40 px-4 py-3">
          <p className="text-[11px] font-semibold text-[var(--text-3)]">
            このプリセットだと
          </p>
          <p className="mt-0.5 text-[16px] font-extrabold text-[var(--text-1)]">
            1日 {preview.perDay ?? "—"}問以上
            <span className="ml-2 text-[11px] font-medium text-[var(--text-3)]">
              （{formatGoalDeadlineLabel(deadlineISO)}まで {preview.daysLeft}日）
            </span>
          </p>
          {preview.isOverloaded ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-2)]">
              <Info className="h-3.5 w-3.5 text-[var(--text-3)]" strokeWidth={2.5} />
              1日80問以上のペースです。短期で詰めたいときは無理のない範囲で進めてください。
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function formatTodayISO(): string {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function ChipRow({
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
  const selectedHint = options.find((opt) => opt.id === value)?.hint ?? "";
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-[var(--text-3)]">{legend}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={cn(
                "shrink-0 rounded-[12px] border px-3.5 py-2 text-center text-[13px] font-bold transition-colors",
                "min-w-[30%] sm:min-w-[120px]",
                selected
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-[var(--bg-muted)]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="min-h-[16px] text-[11px] leading-snug text-[var(--text-2)]">
        {selectedHint}
      </p>
    </div>
  );
}
