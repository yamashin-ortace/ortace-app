import type { ReactNode } from "react";
import { ThemePicker } from "@/components/theme-picker";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { AttemptBadgeSetting } from "@/components/settings/attempt-badge-setting";
import { ExamDateSetting } from "@/components/settings/exam-date-setting";
import { StudyGoalSetting } from "@/components/settings/study-goal-setting";
import { SyncTroubleshooting } from "@/components/settings/sync-troubleshooting";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function SettingsPage() {
  const questions = await loadAllQuestions();

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        設定
      </h1>

      <div className="overflow-hidden rounded-[18px] border border-border bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <SettingsSection
          title="本試験日"
          description="ホームのカウントダウンに使う日付です。"
        >
          <ExamDateSetting />
        </SettingsSection>

        <SettingsSection
          title="学習プリセット（任意）"
          description="対象範囲・周回・期限を選ぶと、ホームに1日の目安が出ます。"
        >
          <StudyGoalSetting pastQuestionsTotal={questions.length} />
        </SettingsSection>

        <SettingsSection
          title="学習設定"
          description="問題を解く画面の表示を調整します。"
        >
          <AttemptBadgeSetting />
        </SettingsSection>

        <SettingsSection
          title="同期・表示トラブル"
          description="別端末と表示が違うときに、最新データを取り込みます。"
        >
          <SyncTroubleshooting />
        </SettingsSection>

        <SettingsSection title="表示モード">
          <DarkModeToggle />
        </SettingsSection>

        <SettingsSection title="カラーテーマ">
          <ThemePicker />
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/70 px-4 py-4 last:border-b-0">
      <div className="mb-3">
        <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--text-1)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
