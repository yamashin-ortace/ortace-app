import { notFound } from "next/navigation";
import { FileImage, ShieldCheck } from "lucide-react";
import { isAdminUserId } from "@/lib/admin/access";
import { getSessionContext } from "@/lib/auth/profile";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import type {
  ProfilesRow,
  SupportClaimsRow,
  SupportClaimStatus,
} from "@/lib/supabase/database.types";
import { SUPPORT_CLAIM_EVIDENCE_BUCKET } from "@/lib/support-claim/constants";
import {
  countLearningDays,
  getLearningWindowStart,
} from "@/lib/support-claim/eligibility";

type ClaimView = {
  claim: SupportClaimsRow;
  profile: ProfilesRow | null;
  email: string | null;
  learningDays: number;
  signedEvidenceUrl: string | null;
};

const STATUS_LABELS: Record<SupportClaimStatus, string> = {
  pending: "確認待ち",
  approved: "承認済み",
  rejected: "却下",
};

const STATUS_ORDER: Record<SupportClaimStatus, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

export default async function AdminSupportClaimsPage() {
  const session = await getSessionContext();
  if (!isAdminUserId(session?.userId)) notFound();

  const views = await loadClaimViews();

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          合格サポート保証 管理
        </h1>
        <p className="text-[12px] leading-relaxed text-[var(--text-3)]">
          添付画像、ユーザー情報、直近3ヶ月の学習日数を確認して承認または却下します。
        </p>
      </div>

      {views.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-[var(--text-3)]" strokeWidth={2.5} />
          <p className="mt-3 text-[14px] font-bold text-[var(--text-1)]">
            申請はまだありません
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {views.map((view) => (
            <ClaimCard key={view.claim.id} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}

async function loadClaimViews(): Promise<ClaimView[]> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const { data: claims } = await admin
    .from("support_claims")
    .select("*")
    .order("submitted_at", { ascending: false });

  const sortedClaims = [...(claims ?? [])].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.submitted_at.localeCompare(a.submitted_at);
  });
  const userIds = [...new Set(sortedClaims.map((claim) => claim.user_id))];
  if (userIds.length === 0) return [];

  const [{ data: profiles }, { data: answerRows }] = await Promise.all([
    admin.from("profiles").select("*").in("id", userIds),
    admin
      .from("answer_history")
      .select("user_id,answered_at")
      .in("user_id", userIds)
      .gte("answered_at", getLearningWindowStart(now).toISOString()),
  ]);

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const answersByUserId = new Map<string, { answered_at: string }[]>();
  for (const row of answerRows ?? []) {
    const bucket = answersByUserId.get(row.user_id) ?? [];
    bucket.push({ answered_at: row.answered_at });
    answersByUserId.set(row.user_id, bucket);
  }

  const emailsByUserId = new Map<string, string | null>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      emailsByUserId.set(userId, data.user?.email ?? null);
    }),
  );

  const signedUrlByClaimId = new Map<string, string | null>();
  await Promise.all(
    sortedClaims.map(async (claim) => {
      const { data } = await admin.storage
        .from(SUPPORT_CLAIM_EVIDENCE_BUCKET)
        .createSignedUrl(claim.evidence_url, 60 * 60);
      signedUrlByClaimId.set(claim.id, data?.signedUrl ?? null);
    }),
  );

  return sortedClaims.map((claim) => ({
    claim,
    profile: profilesById.get(claim.user_id) ?? null,
    email: emailsByUserId.get(claim.user_id) ?? null,
    learningDays: countLearningDays(answersByUserId.get(claim.user_id) ?? [], now),
    signedEvidenceUrl: signedUrlByClaimId.get(claim.id) ?? null,
  }));
}

function ClaimCard({ view }: { view: ClaimView }) {
  const { claim, profile } = view;
  return (
    <article className="space-y-4 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={getStatusClassName(claim.status)}>
              {STATUS_LABELS[claim.status]}
            </span>
            <p className="text-[12px] tabular-nums text-[var(--text-3)]">
              {formatDateTime(claim.submitted_at)}
            </p>
          </div>
          <h2 className="mt-2 text-[16px] font-extrabold text-[var(--text-1)]">
            {profile?.nickname ?? "ニックネーム未設定"}
          </h2>
          <p className="mt-1 break-all text-[12px] text-[var(--text-3)]">
            {view.email ?? "メール未設定"} / {claim.user_id}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
          <AdminStat label="プラン" value={profile?.plan ?? "-"} />
          <AdminStat label="学習日" value={`${view.learningDays}日`} />
          <AdminStat label="学年" value={profile?.grade ?? "-"} />
          <AdminStat
            label="期限"
            value={profile?.plan_expires_at ? formatDate(profile.plan_expires_at) : "-"}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <InfoBlock label="ユーザーコメント" value={claim.user_comment || "（なし）"} />
          {claim.reject_reason ? (
            <InfoBlock label="却下理由" value={claim.reject_reason} />
          ) : null}
          {claim.status === "pending" ? <ClaimActions claimId={claim.id} /> : null}
        </div>

        <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/50 p-2">
          <div className="mb-2 flex items-center gap-2 px-1 text-[12px] font-bold text-[var(--text-1)]">
            <FileImage className="h-4 w-4 text-[var(--primary-dark)]" strokeWidth={2.5} />
            添付画像
          </div>
          {view.signedEvidenceUrl ? (
            <a
              href={view.signedEvidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-[10px] border border-border bg-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage の署名付きURLを管理者確認用に表示する */}
              <img
                src={view.signedEvidenceUrl}
                alt="合否通知書の添付画像"
                className="max-h-[320px] w-full object-contain"
              />
            </a>
          ) : (
            <p className="px-1 py-8 text-center text-[12px] text-[var(--text-3)]">
              画像URLを作成できませんでした
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ClaimActions({ claimId }: { claimId: string }) {
  return (
    <div className="grid gap-3 border-t border-border/70 pt-3 md:grid-cols-2">
      <form action={`/api/support-claim/${claimId}/approve`} method="post">
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-[var(--primary)] px-3 text-[13px] font-bold text-white"
        >
          承認して翌年度へ延長
        </button>
      </form>
      <form
        action={`/api/support-claim/${claimId}/reject`}
        method="post"
        className="space-y-2"
      >
        <textarea
          name="reason"
          required
          maxLength={800}
          placeholder="却下理由"
          className="min-h-20 w-full resize-none rounded-[10px] border border-input bg-[var(--bg-card)] px-3 py-2 text-[13px] outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center rounded-[10px] border border-border bg-[var(--bg-card)] px-3 text-[13px] font-bold text-[var(--text-1)]"
        >
          理由を送って却下
        </button>
      </form>
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[var(--bg-muted)]/60 px-3 py-2">
      <p className="text-[10px] font-bold text-[var(--text-3)]">{label}</p>
      <p className="mt-1 text-[12px] font-extrabold text-[var(--text-1)]">
        {value}
      </p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[var(--text-3)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-1)]">
        {value}
      </p>
    </div>
  );
}

function getStatusClassName(status: SupportClaimStatus): string {
  const base = "rounded-full px-2.5 py-1 text-[11px] font-bold";
  if (status === "approved") {
    return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200`;
  }
  if (status === "rejected") {
    return `${base} bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200`;
  }
  return `${base} bg-[#FFF6E5] text-[#8A5A18] dark:bg-[#3A2A12] dark:text-[#FFD58A]`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
