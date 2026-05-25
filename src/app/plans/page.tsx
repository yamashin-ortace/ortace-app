import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import {
  Check,
  CreditCard,
  FileText,
  Smartphone,
  Store,
  TimerReset,
} from "lucide-react";
import { PaidPlanCard } from "@/components/billing/paid-plan-card";
import {
  PAID_PLANS,
  PLAN_DEFINITIONS,
  getEffectivePlan,
} from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import type { BillingPlan } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "プラン｜ORT ACE",
  description: "ORT ACEの無料・基礎定着パス・国試対策パックの比較と購入。",
};

type Props = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function PlansPage({ searchParams }: Props) {
  const session = await getSessionContext();
  const { checkout } = await searchParams;
  const profile = session?.profile;
  const currentPlan = profile
    ? getEffectivePlan({
        plan: profile.plan,
        status: profile.plan_status,
        expiresAt: profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-2">
        <p className="text-[12px] font-bold text-[var(--primary-dark)]">
          ORT ACE プラン
        </p>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          合格点まで仕上げる学習パス
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--text-2)]">
          基礎定着パスは日々の復習、国試対策パックは受験年度の総仕上げ。支払いはStripeの安全な決済画面で行います。
        </p>
      </div>

      {checkout === "success" ? (
        <StatusNotice tone="success" title="決済を受け付けました">
          カード・PayPayなど即時決済の場合は、まもなくプランが反映されます。コンビニ払いは支払い完了後に反映されます。
        </StatusNotice>
      ) : null}
      {checkout === "cancel" ? (
        <StatusNotice tone="muted" title="決済をキャンセルしました">
          プランは変更されていません。必要になったタイミングでいつでも再開できます。
        </StatusNotice>
      ) : null}

      {profile ? (
        <CurrentPlanCard
          plan={currentPlan}
          rawPlan={profile.plan}
          expiresAt={profile.plan_expires_at}
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <FreePlanCard currentPlan={currentPlan} />
        {PAID_PLANS.map((plan) => (
          <PaidPlanCard
            key={plan}
            plan={plan}
            currentPlan={currentPlan}
            isLoggedIn={Boolean(session)}
          />
        ))}
      </section>

      <section className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4">
        <h2 className="text-[15px] font-bold text-[var(--text-1)]">
          使える支払い方法
        </h2>
        <div className="mt-3 grid gap-2 text-[13px] text-[var(--text-2)] sm:grid-cols-2">
          <PaymentMethod icon={<CreditCard />} label="クレジットカード・カード分割" />
          <PaymentMethod icon={<Smartphone />} label="PayPay" />
          <PaymentMethod icon={<Store />} label="コンビニ払い" />
          <PaymentMethod icon={<FileText />} label="Apple Pay / Google Pay" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-4)]">
          Apple Pay / Google Pay とカード分割は、利用端末・ブラウザ・カード会社の条件により表示が変わります。
        </p>
      </section>
    </div>
  );
}

function CurrentPlanCard({
  plan,
  rawPlan,
  expiresAt,
}: {
  plan: BillingPlan;
  rawPlan: BillingPlan;
  expiresAt: string | null;
}) {
  const definition = PLAN_DEFINITIONS[plan];
  const isExpiredPaidPlan = rawPlan !== "free" && plan === "free";

  return (
    <section className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4">
      <div className="flex items-start gap-3">
        <TimerReset
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-[var(--text-1)]">
            現在のプラン：{definition.name}
          </p>
          <p className="text-[12px] leading-relaxed text-[var(--text-3)]">
            {isExpiredPaidPlan
              ? "以前の有料プランは期限切れです。必要な場合は再購入できます。"
              : expiresAt
                ? `${formatDate(expiresAt)} まで利用できます。`
                : "無料プランとして利用中です。"}
          </p>
        </div>
      </div>
    </section>
  );
}

function FreePlanCard({ currentPlan }: { currentPlan: BillingPlan }) {
  const definition = PLAN_DEFINITIONS.free;

  return (
    <FreePlanShell title={definition.name}>
      <div className="space-y-2">
        <h2 className="text-[17px] font-bold text-[var(--text-1)]">
          {definition.name}
        </h2>
        <p className="min-h-[42px] text-[12px] leading-relaxed text-[var(--text-3)]">
          {definition.description}
        </p>
        <div>
          <span className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
            {definition.priceLabel}
          </span>
          {definition.periodLabel ? (
            <p className="text-[12px] font-medium text-[var(--text-3)]">
              {definition.periodLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <ul className="space-y-2">
          {definition.featureLabels.map((feature) => (
            <li key={feature} className="flex gap-2 text-[12px] text-[var(--text-2)]">
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]"
                strokeWidth={2.5}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-2">
        <Link
          href="/study"
          className="inline-flex h-12 w-full items-center justify-center rounded-[12px] border border-border bg-[var(--bg-muted)] text-[14px] font-bold text-[var(--text-1)]"
        >
          {currentPlan === "free" ? "学習を続ける" : "無料プラン"}
        </Link>
      </div>
    </FreePlanShell>
  );
}

function FreePlanShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={title}
      className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-sm"
    >
      <div className="flex h-full flex-col gap-4">{children}</div>
    </article>
  );
}

function PaymentMethod({ icon, label }: { icon: ReactElement; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-border bg-[var(--bg-muted)] px-3 py-2">
      <span className="text-[var(--primary-dark)] [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function StatusNotice({
  tone,
  title,
  children,
}: {
  tone: "success" | "muted";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-4 py-3",
        tone === "success"
          ? "border-[var(--success)] bg-[var(--bg-card)]"
          : "border-border bg-[var(--bg-muted)]",
      )}
    >
      <p className="text-[13px] font-bold text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
        {children}
      </p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
