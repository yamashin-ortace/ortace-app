import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarClock,
  ChevronRight,
  CreditCard,
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
  getEffectivePlanForProfile,
} from "@/lib/billing/plans";
import type { BillingPlanStatus } from "@/lib/supabase/database.types";

export default async function MePage() {
  const session = await getSessionContext();

  // proxy.ts で未ログインは /login にリダイレクトされるので、ここでは存在前提
  const profile = session?.profile;
  const nickname = profile?.nickname ?? "ゲスト";
  const effectivePlan = profile
    ? getEffectivePlanForProfile(profile)
    : "free";
  const planName = PLAN_DEFINITIONS[effectivePlan].name;
  const planDateLabel = getPlanDateLabel({
    status: profile?.plan_status,
    trialEndsAt: profile?.trial_ends_at ?? null,
    expiresAt: profile?.plan_expires_at ?? null,
    isFree: effectivePlan === "free",
  });

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

        <Link
          href="/settings#study-goal"
          className="btn-pressable mt-5 flex items-center justify-between gap-3 rounded-[14px] bg-[var(--bg-muted)]/45 px-3.5 py-3 text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[var(--bg-card)] text-[var(--primary-dark)]">
              <Target className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-extrabold">
                学習設定
              </span>
              <span className="block truncate text-[12px] text-[var(--text-3)]">
                試験日・学習目標・表示設定を調整
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-4)]" />
        </Link>
      </section>

      <PlanStatusBanner
        planName={planName}
        statusLabel={getPlanStatusLabel(profile?.plan_status)}
        dateLabel={planDateLabel}
      />

      <section className="overflow-hidden rounded-[18px] border border-border bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <SettingsLink
          href="/plans"
          icon={<CreditCard className="h-4 w-4" strokeWidth={2.3} />}
          title="プラン・お支払い"
          description="プラン確認・購入・支払い方法"
        />
        <SettingsLink
          href="/settings"
          icon={<Settings className="h-4 w-4" strokeWidth={2.3} />}
          title="設定"
          description="学習プリセット・表示・同期"
          last
        />
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
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

function PlanStatusBanner({
  planName,
  statusLabel,
  dateLabel,
}: {
  planName: string;
  statusLabel: string;
  dateLabel: string;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--primary)]/30 bg-[var(--primary-soft)]/55 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary)] text-white">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[var(--primary-dark)]">
            利用中プラン
          </p>
          <p className="mt-0.5 text-[18px] font-extrabold text-[var(--text-1)]">
            {planName}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--text-2)]">
            <span>{statusLabel}</span>
            <span className="inline-flex items-center gap-1 text-[var(--text-3)]">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.3} />
              {dateLabel}
            </span>
          </p>
        </div>
      </div>
      <Link
        href="/plans"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-[var(--primary)] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
      >
        プランを確認する
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </section>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  description,
  last = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`btn-pressable flex items-center justify-between gap-3 px-4 py-4 text-[14px] text-[var(--text-1)] hover:bg-[var(--bg-muted)] ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--bg-muted)] text-[var(--primary-dark)]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block font-bold">{title}</span>
          <span className="block truncate text-[12px] text-[var(--text-3)]">
            {description}
          </span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-4)]" />
    </Link>
  );
}

function getPlanStatusLabel(status: BillingPlanStatus | undefined): string {
  if (status === "trialing") return "無料トライアル中";
  if (status === "payment_failed") return "支払い確認が必要です";
  if (status === "expired") return "期限切れ";
  if (status === "canceled") return "キャンセル済み";
  return "利用中";
}

function getPlanDateLabel({
  status,
  trialEndsAt,
  expiresAt,
  isFree,
}: {
  status: BillingPlanStatus | undefined;
  trialEndsAt: string | null;
  expiresAt: string | null;
  isFree: boolean;
}): string {
  if (status === "trialing" && trialEndsAt) {
    return `無料トライアルは${formatDate(trialEndsAt)}まで`;
  }
  if (expiresAt) return `${formatDate(expiresAt)}まで`;
  if (isFree) return "無料プランとして利用中";
  if (status === "trialing") return "無料トライアル中";
  return "期限なし";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
