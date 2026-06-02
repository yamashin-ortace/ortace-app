import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import type { PlanType } from "@/lib/daily-limit";

export function OriginalQuestionPreviewCard({ plan }: { plan: PlanType }) {
  const isExamPlan = plan === "exam";
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        <Sparkles className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-extrabold tracking-tight text-[var(--text-1)]">
            初見問題にチャレンジ
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary-dark)]">
            {isExamPlan ? "準備中" : "限定"}
          </span>
        </div>
        <span className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--text-2)]">
          過去問で身につけた力を、新しいオリジナル問題で試せる実戦演習を準備しています
        </span>
      </div>
      {isExamPlan ? null : (
        <LockKeyhole
          className="h-4 w-4 shrink-0 text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
      )}
    </>
  );

  const className =
    "flex items-center gap-3 rounded-[16px] border border-[var(--primary)]/25 bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]";

  return isExamPlan ? (
    <div className={className} aria-label="オリジナル問題は準備中です">
      {content}
    </div>
  ) : (
    <Link
      href="/plans"
      className={className}
      aria-label="オリジナル問題は国試対策パック限定です"
    >
      {content}
    </Link>
  );
}
