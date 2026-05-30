"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileImage, Loader2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupportClaimStatus } from "@/lib/supabase/database.types";
import type { SupportClaimEligibility } from "@/lib/support-claim/eligibility";
import { SUPPORT_CLAIM_EVIDENCE_BUCKET } from "@/lib/support-claim/constants";
import {
  createEvidenceObjectPath,
  getSupportClaimContentType,
  validateSupportClaimFile,
} from "@/lib/support-claim/evidence";
import { countLearningDaysFromAnsweredAts } from "@/lib/support-claim/learning-days";

type ClaimSummary = {
  id: string;
  status: SupportClaimStatus;
  submittedAt: string;
  reviewedAt: string | null;
  rejectReason: string | null;
};

type Props = {
  userId: string;
  eligibility: SupportClaimEligibility;
  claims: ClaimSummary[];
};

const STATUS_LABELS: Record<SupportClaimStatus, string> = {
  pending: "確認待ち",
  approved: "承認済み",
  rejected: "却下",
};

export function ClaimForm({ userId, eligibility, claims }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { entries } = useAnswerHistoryList();
  const answeredAts = useMemo(
    () => entries.map((entry) => entry.answeredAt),
    [entries],
  );
  const effectiveEligibility = useMemo(() => {
    const localLearningDays = countLearningDaysFromAnsweredAts(answeredAts);
    if (localLearningDays <= eligibility.learningDays) return eligibility;
    const reasons =
      localLearningDays >= eligibility.requiredLearningDays
        ? eligibility.reasons.filter(
            (reason) => !reason.startsWith("直近3ヶ月の学習日数が"),
          )
        : eligibility.reasons;
    return {
      ...eligibility,
      learningDays: localLearningDays,
      reasons,
      eligible: reasons.length === 0,
    };
  }, [answeredAts, eligibility]);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!effectiveEligibility.eligible) {
      setError("現在この申請は対象外です。");
      return;
    }
    if (!file) {
      setError("合否通知書のスクリーンショットを選択してください。");
      return;
    }
    const fileError = validateSupportClaimFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    if (!agreed) {
      setError("利用規約への同意が必要です。");
      return;
    }

    setIsSubmitting(true);
    try {
      const evidencePath = createEvidenceObjectPath(
        userId,
        file.name,
        crypto.randomUUID(),
      );
      const { error: uploadError } = await supabase.storage
        .from(SUPPORT_CLAIM_EVIDENCE_BUCKET)
        .upload(evidencePath, file, {
          cacheControl: "3600",
          contentType: getSupportClaimContentType(file),
          upsert: false,
        });
      if (uploadError) {
        setError("画像のアップロードに失敗しました。時間を置いて再度お試しください。");
        return;
      }

      const response = await fetch("/api/support-claim/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidencePath,
          userComment: comment,
          agreed: true,
          clientAnsweredAts: answeredAts,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setError(data?.error ?? "申請の送信に失敗しました。");
        return;
      }

      setSuccess(true);
      setFile(null);
      setComment("");
      setAgreed(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <ClaimHistory claims={claims} />

      {!effectiveEligibility.eligible ? (
        <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4">
          <p className="text-[14px] font-bold text-[var(--text-1)]">
            現在は申請対象外です
          </p>
          <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-[var(--text-2)]">
            {effectiveEligibility.reasons.map((reason) => (
              <li key={reason}>・{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--text-1)]">
                {effectiveEligibility.examYear}年度 合格サポート保証
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
                申請期限: {effectiveEligibility.deadlineLabel}。確認結果は3営業日以内にメールでお知らせします。
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-[12px] font-bold">
              合否通知書のスクリーンショット
            </Label>
            <Input
              id="evidence"
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
              onChange={(event) => {
                setError(null);
                setFile(event.currentTarget.files?.[0] ?? null);
              }}
            />
            <p className="text-[11px] leading-relaxed text-[var(--text-3)]">
              氏名・受験番号・結果が見える範囲を添付してください。JPG/PNG/HEIC、5MB以内。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-[12px] font-bold">
              コメント（任意）
            </Label>
            <Textarea
              id="comment"
              value={comment}
              maxLength={800}
              placeholder="確認してほしい補足があれば入力してください。"
              onChange={(event) => setComment(event.currentTarget.value)}
            />
          </div>

          <label className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.currentTarget.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span>
              合否通知書を確認資料として提出し、合格サポート保証の条件確認に利用することに同意します。
            </span>
          </label>

          {error ? (
            <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-[10px] bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4" strokeWidth={2.5} />
              <span>申請を受け付けました。3営業日以内に確認結果をメールします。</span>
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.5} />
            )}
            申請を送信
          </Button>
        </form>
      )}
    </div>
  );
}

function ClaimHistory({ claims }: { claims: ClaimSummary[] }) {
  if (claims.length === 0) return null;
  return (
    <section className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-4">
      <div className="flex items-center gap-2">
        <FileImage className="h-4 w-4 text-[var(--primary-dark)]" strokeWidth={2.5} />
        <h2 className="text-[14px] font-bold text-[var(--text-1)]">
          申請履歴
        </h2>
      </div>
      <div className="mt-3 divide-y divide-border/70">
        {claims.map((claim) => (
          <div key={claim.id} className="py-2 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold text-[var(--text-1)]">
                {STATUS_LABELS[claim.status]}
              </p>
              <p className="text-[11px] tabular-nums text-[var(--text-3)]">
                {formatDateTime(claim.submittedAt)}
              </p>
            </div>
            {claim.rejectReason ? (
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
                理由: {claim.rejectReason}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
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
