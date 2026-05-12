"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatExamDateLabel } from "@/lib/exam-date";
import { useExamDate } from "@/lib/exam-date/use-exam-date";

/**
 * 試験日は当面「2月の第3木曜日」で仮固定し、設定からの変更は受け付けない。
 * ユーザーが現状の固定値を確認できるよう、読み取り専用で表示するだけのカード。
 */
export function ExamDateSetting() {
  const [hydrated, setHydrated] = useState(false);
  const { examDate } = useExamDate();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション後に最新値を反映
    setHydrated(true);
  }, []);

  return (
    <div id="exam-date" className="space-y-3 scroll-mt-24">
      <div className="flex items-start gap-3 rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[var(--text-3)]">
            次回の試験日（仮固定）
          </p>
          <p className="mt-0.5 text-[14px] font-bold text-[var(--text-1)]">
            {hydrated ? formatExamDateLabel(examDate) : "—"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
            視能訓練士国家試験は例年「2月の第3木曜日」に実施されるため、その日付を仮で表示しています。
            個別に試験日を変更する設定は当面ご用意していません。
          </p>
        </div>
      </div>
    </div>
  );
}
