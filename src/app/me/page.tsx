import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarClock,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { getSessionContext } from "@/lib/auth/profile";
import { signOutAction } from "@/lib/auth/actions";
import {
  PLAN_DEFINITIONS,
  getEffectivePlan,
} from "@/lib/billing/plans";
import type { BillingPlanStatus } from "@/lib/supabase/database.types";

export default async function MePage() {
  const session = await getSessionContext();

  // proxy.ts で未ログインは /login にリダイレクトされるので、ここでは存在前提
  const profile = session?.profile;
  const nickname = profile?.nickname ?? "ゲスト";
  const effectivePlan = profile
    ? getEffectivePlan({
        plan: profile.plan,
        status: profile.plan_status,
        expiresAt: profile.plan_expires_at,
      })
    : "free";
  const planName = PLAN_DEFINITIONS[effectivePlan].name;
  const expiresAt = profile?.plan_expires_at
    ? formatDate(profile.plan_expires_at)
    : null;

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1">
        <p className="text-[12px] font-bold text-[var(--primary-dark)]">
          アカウント
        </p>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          マイページ
        </h1>
      </div>

      <section className="rounded-[18px] border border-border bg-[var(--bg-card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-pale)] text-[var(--primary-dark)]">
            <UserRound className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-extrabold text-[var(--text-1)]">
              {nickname}
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--text-3)]">
              <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
              <span className="truncate">{session?.email ?? "メール未設定"}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ProfileTile
            icon={<GraduationCap />}
            label="学年"
            value={profile?.grade ?? "未設定"}
          />
          <ProfileTile
            icon={<Target />}
            label="目標"
            value={profile?.goal ?? "未設定"}
          />
          <ProfileTile
            icon={<ShieldCheck />}
            label="利用中プラン"
            value={planName}
            subValue={getPlanStatusLabel(profile?.plan_status)}
          />
          <ProfileTile
            icon={<CalendarClock />}
            label="利用期限"
            value={expiresAt ?? "期限なし"}
            subValue={expiresAt ? "この日まで有料機能を利用できます" : "無料プランとして利用中です"}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Link
            href="/plans"
            className="btn-pressable flex items-center justify-between gap-3 border-b border-border px-4 py-4 text-[14px] text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--bg-muted)] text-[var(--primary-dark)]">
                <CreditCard className="h-4 w-4" strokeWidth={2.3} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">プラン・お支払い</span>
                <span className="block truncate text-[12px] text-[var(--text-3)]">
                  プラン確認・購入・支払い方法
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-4)]" />
          </Link>

          <Link
            href="/settings"
            className="btn-pressable flex items-center justify-between gap-3 border-b border-border px-4 py-4 text-[14px] text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--bg-muted)] text-[var(--primary-dark)]">
                <Settings className="h-4 w-4" strokeWidth={2.3} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">設定</span>
                <span className="block truncate text-[12px] text-[var(--text-3)]">
                  学習プリセット・表示・同期
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-4)]" />
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="btn-pressable flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-[14px] text-destructive hover:bg-destructive/5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-destructive/10 text-destructive">
                  <LogOut className="h-4 w-4" strokeWidth={2.3} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">ログアウト</span>
                  <span className="block truncate text-[12px] text-destructive/70">
                    この端末からサインアウトします
                  </span>
                </span>
              </span>
            </button>
          </form>
      </section>
    </div>
  );
}

function ProfileTile({
  icon,
  label,
  value,
  subValue,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-[14px] bg-[var(--bg-muted)]/45 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--text-3)]">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-[var(--primary-dark)] [&>svg]:[stroke-width:2.4]">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-1.5 text-[15px] font-extrabold text-[var(--text-1)]">
        {value}
      </p>
      {subValue ? (
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-4)]">
          {subValue}
        </p>
      ) : null}
    </div>
  );
}

function getPlanStatusLabel(status: BillingPlanStatus | undefined): string {
  if (status === "payment_failed") return "支払い確認が必要です";
  if (status === "expired") return "期限切れ";
  return "利用中";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
