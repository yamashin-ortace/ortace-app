import Link from "next/link";
import { Clock3, CreditCard } from "lucide-react";
import type { TrialState } from "@/lib/billing/trial";

type Props = {
  trial: TrialState | null;
};

export function TrialBanner({ trial }: Props) {
  if (!trial?.isActive && !trial?.hasEnded) return null;

  if (trial.isActive) {
    return (
      <section className="flex items-start gap-3 rounded-[14px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 py-3">
        <Clock3
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]"
          strokeWidth={2.5}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[var(--text-1)]">
            基礎定着パスの14日無料トライアル中です
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
            あと{trial.remainingDays}日、1日100問まで演習できます。
          </p>
        </div>
        <Link
          href="/plans"
          className="shrink-0 rounded-[10px] bg-[var(--primary)] px-3 py-2 text-[12px] font-bold text-white"
        >
          継続する
        </Link>
      </section>
    );
  }

  return (
    <section className="flex items-start gap-3 rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3">
      <CreditCard
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]"
        strokeWidth={2.5}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[var(--text-1)]">
          14日無料トライアルが終了しました
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
          続ける場合は基礎定着パスを購入すると、1日100問まで演習できます。
        </p>
      </div>
      <Link
        href="/plans"
        className="shrink-0 rounded-[10px] bg-[var(--navy)] px-3 py-2 text-[12px] font-bold text-white"
      >
        プランを見る
      </Link>
    </section>
  );
}
