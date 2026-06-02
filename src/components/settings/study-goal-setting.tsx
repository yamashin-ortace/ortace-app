"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, Info, LockKeyhole, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  serializeStudyGoalConfig,
  type StudyGoalConfig,
  type StudyGoalDeadline,
  type StudyGoalRounds,
  type StudyGoalScope,
} from "@/lib/study-goal";
import { useStudyGoalConfig } from "@/lib/study-goal/use-study-goal-config";
import { useExamDate } from "@/lib/exam-date/use-exam-date";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/lib/daily-limit";

type Props = {
  /** 過去問の総問題数（ペース計算の母数） */
  pastQuestionsTotal: number;
  plan: PlanType;
};

/**
 * 学習プリセット（B-prime：ガードレール付き自由設定）の編集UI。
 *
 * 「目標を立てるか」のトグル、スコープ／周回／期限を1択で組み合わせる形式。
 * 入力中は下書きとして扱い、「保存する」でアカウント設定へ反映する。
 */
export function StudyGoalSetting({ pastQuestionsTotal, plan }: Props) {
  const { config, setConfig } = useStudyGoalConfig();
  const [draftOverride, setDraftOverride] = useState<StudyGoalConfig | null>(
    null,
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const { examDate } = useExamDate();
  const draft = draftOverride ?? config;
  const canUseOriginalScope = plan === "exam";
  const activeScope = canUseOriginalScope ? draft.scope : "past";

  useEffect(() => {
    if (!savedNotice) return;
    const timerId = window.setTimeout(() => setSavedNotice(false), 1800);
    return () => window.clearTimeout(timerId);
  }, [savedNotice]);

  const preview = previewDailyPace({
    scope: activeScope,
    rounds: draft.rounds,
    deadline: draft.deadline,
    customDeadlineISO: draft.customDeadlineISO,
    examDateISO: examDate,
    pastQuestionsTotal,
  });
  const deadlineISO = resolveGoalDeadlineISO(draft, examDate);
  const hasChanges = useMemo(
    () =>
      draftOverride !== null &&
      serializeStudyGoalConfig(draftOverride) !== serializeStudyGoalConfig(config),
    [config, draftOverride],
  );

  const updateDraft = (patch: Partial<StudyGoalConfig>) => {
    setDraftOverride((current) => ({ ...(current ?? config), ...patch }));
    setSavedNotice(false);
  };

  const handleSave = () => {
    setConfig({ ...draft, scope: activeScope });
    setDraftOverride(null);
    setSavedNotice(true);
  };

  const handleReset = () => {
    setDraftOverride(null);
    setSavedNotice(false);
  };

  const handleDeadlineChange = (next: string) => {
    if (next === "custom") {
      // 初回 "自分で決める" 選択時、まだ customDeadlineISO が未設定なら
      // 試験1ヶ月前を初期値として埋める。
      const fallback =
        draft.customDeadlineISO ?? getGoalDeadlineISO(examDate, 30);
      updateDraft({
        deadline: "custom",
        customDeadlineISO: fallback,
      });
      return;
    }
    updateDraft({ deadline: next as StudyGoalDeadline });
  };

  const handleCustomDateChange = (value: string) => {
    if (!isValidISODate(value)) return;
    updateDraft({ customDeadlineISO: value });
  };

  const todayISO = formatTodayISO();

  return (
    <div id="study-goal" className="scroll-mt-24 space-y-3">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[14px] px-3 py-3",
          draft.enabled
            ? "bg-[var(--primary-soft)]"
            : "bg-[var(--bg-muted)]/35",
        )}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[var(--text-1)]">
            目標を立てる
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">
            オフにすると、ホームのペース表示は出ません。
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.enabled}
          onClick={() => updateDraft({ enabled: !draft.enabled })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
            draft.enabled
              ? "bg-[var(--primary)]"
              : "bg-[var(--text-3)]/40",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              draft.enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <fieldset
        disabled={!draft.enabled}
        className={cn("space-y-3", !draft.enabled && "opacity-50")}
      >
        <ChipRow
          legend="対象範囲（どの問題？）"
          options={STUDY_GOAL_SCOPES.map((s) => ({
            id: s.id,
            label: s.label,
            hint: s.hint,
            locked: s.id === "past_plus_original" && !canUseOriginalScope,
          }))}
          value={activeScope}
          onChange={(next) => updateDraft({ scope: next as StudyGoalScope })}
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
          value={String(draft.rounds)}
          onChange={(next) =>
            updateDraft({ rounds: Number(next) as StudyGoalRounds })
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
            value={draft.deadline}
            onChange={handleDeadlineChange}
          />
          {draft.deadline === "custom" ? (
            <div className="space-y-1.5 rounded-[12px] bg-[var(--bg-muted)]/35 px-3 py-2.5">
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
                value={draft.customDeadlineISO ?? ""}
                onChange={(event) => handleCustomDateChange(event.target.value)}
                className={cn(
                  "block h-10 w-full min-w-0 max-w-full appearance-none rounded-[10px] border border-border bg-[var(--bg-card)] px-3 py-0 text-[14px] leading-10 font-bold text-[var(--text-1)]",
                  "[&::-webkit-date-and-time-value]:min-h-[40px] [&::-webkit-date-and-time-value]:leading-10",
                  "focus:border-[var(--primary)] focus:outline-none",
                )}
                style={{ boxSizing: "border-box" }}
              />
              {draft.customDeadlineISO ? (
                <p className="text-[11px] leading-snug text-[var(--text-2)]">
                  期限：{formatGoalDeadlineLabelWithWeekday(draft.customDeadlineISO)}
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

      {draft.enabled ? (
        <div className="rounded-[14px] bg-[var(--bg-muted)]/45 px-4 py-3">
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

      <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-[18px] text-[11px] font-medium text-[var(--text-2)]">
          {hasChanges
            ? "保存すると他の端末にも反映されます。"
            : savedNotice
              ? "保存しました。"
              : ""}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasChanges}
            onClick={handleReset}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            元に戻す
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasChanges}
            onClick={handleSave}
            className="flex-1 sm:flex-none"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
            保存する
          </Button>
        </div>
      </div>
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
  options: Array<{ id: string; label: string; hint: string; locked?: boolean }>;
  value: string;
  onChange: (next: string) => void;
}) {
  const selectedHint = options.find((opt) => opt.id === value)?.hint ?? "";
  const hasLockedOption = options.some((opt) => opt.locked);
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
              disabled={opt.locked}
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={cn(
                "shrink-0 rounded-[12px] border px-3.5 py-2 text-center text-[13px] font-bold transition-colors",
                "min-w-[30%] sm:min-w-[120px]",
                opt.locked
                  ? "cursor-not-allowed border-border bg-[var(--bg-muted)]/60 text-[var(--text-3)]"
                  : selected
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-[var(--bg-muted)]",
              )}
            >
              <span className="inline-flex items-center gap-1">
                {opt.locked ? (
                  <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : null}
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="min-h-[16px] text-[11px] leading-snug text-[var(--text-2)]">
        {selectedHint}
      </p>
      {hasLockedOption ? (
        <Link
          href="/plans"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary-dark)] underline-offset-2 hover:underline"
        >
          <LockKeyhole className="h-3 w-3" strokeWidth={2.5} />
          オリジナル問題は国試対策パックで利用できます
        </Link>
      ) : null}
    </div>
  );
}
