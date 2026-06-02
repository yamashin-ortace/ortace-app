import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { AttemptBadgeSetting } from "@/components/settings/attempt-badge-setting";
import { ExamDateSetting } from "@/components/settings/exam-date-setting";
import { StudyGoalSetting } from "@/components/settings/study-goal-setting";
import { SyncTroubleshooting } from "@/components/settings/sync-troubleshooting";
import { ActiveDevices } from "@/components/settings/active-devices";
import { getSessionContext } from "@/lib/auth/profile";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import type { ActiveDevice } from "@/lib/auth/device-limit";
import { loadAllQuestions } from "@/lib/questions/loader";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlanForProfile(session.profile)
    : "free";
  const questions = await loadAllQuestions();
  const devices = session ? await loadActiveDevices(session.userId) : [];

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
          <StudyGoalSetting pastQuestionsTotal={questions.length} plan={plan} />
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

        <SettingsSection
          title="ログイン中の端末"
          description="アカウント共有防止のため、同時ログインは最大3端末までです。"
        >
          <ActiveDevices devices={devices} />
        </SettingsSection>

        <SettingsSection
          title="サポート"
          description="国試対策パックの保証申請を確認できます。"
        >
          <Link
            href="/support-claim"
            className="group flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-3 transition-colors hover:bg-[var(--bg-muted)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[var(--text-1)]">
                合格サポート保証 申請
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">
                不合格時の翌年度延長申請と申請履歴を確認します。
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
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

async function loadActiveDevices(userId: string): Promise<ActiveDevice[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_devices")
    .select(
      "id,device_fingerprint,device_label,user_agent,last_seen_at,created_at",
    )
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });

  return data ?? [];
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
