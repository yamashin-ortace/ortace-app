"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatExamDateLabel,
  getDefaultExamDate,
  isValidExamDateString,
} from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";

export function ExamDateSetting() {
  const [hydrated, setHydrated] = useState(false);
  const { examDate, isCustom, setExamDate } = useExamDate();
  const [draft, setDraft] = useState(examDate);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション後に最新値を反映
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部更新に追従
    setDraft(examDate);
  }, [examDate, hydrated]);

  const canSave =
    hydrated && isValidExamDateString(draft) && draft !== examDate;

  const handleSave = () => {
    if (!canSave) return;
    setExamDate(draft);
  };

  const handleReset = () => {
    setExamDate(null);
    setDraft(getDefaultExamDate());
  };

  return (
    <div id="exam-date" className="space-y-3 scroll-mt-24">
      <div className="flex items-start gap-3 rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[var(--text-3)]">
            現在の設定
          </p>
          <p className="mt-0.5 text-[14px] font-bold text-[var(--text-1)]">
            {hydrated ? formatExamDateLabel(examDate) : "—"}
            {!isCustom ? (
              <span className="ml-1 text-[11px] font-medium text-[var(--text-3)]">
                （仮の初期値）
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
            ホーム画面で「本試験まで何日」と「推奨ペース」の計算に使います。
            正確な試験日を設定すると、日々の目標が見えやすくなります。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-bold text-[var(--text-2)]" htmlFor="exam-date-input">
          本試験予定日
        </label>
        <input
          id="exam-date-input"
          type="date"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-[10px] border border-border bg-[var(--bg-card)] px-3 py-2 text-[14px] text-[var(--text-1)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          className="gap-1"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
          保存
        </Button>
        {isCustom ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="gap-1"
          >
            <Undo2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            既定に戻す
          </Button>
        ) : null}
      </div>
    </div>
  );
}
