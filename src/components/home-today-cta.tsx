"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCcw, Sparkles } from "lucide-react";
import { ReviewQueueHowItWorksPopover } from "@/components/study/review-queue-how-it-works-popover";
import { TodayRecommendedHowItWorksPopover } from "@/components/study/today-recommended-how-it-works-popover";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { getReviewTargetIds } from "@/lib/answer-history/status";
import { buildHomeAiCoachComment } from "@/lib/ai-coach/home-comment";
import type { QuestionClusterLookup } from "@/lib/ai-coach/cluster-weakness";

type Props = {
  /** AIコーチコメントを具体テーマで補強するための問題ID→クラスタ辞書 */
  clusters?: readonly { id: string; clusterId: string; clusterLabel: string }[];
};

/**
 * ホームの「AIコーチが、今日のあなたに」カード。
 * 上半分にAIコーチのナレーション、下半分に「今日のおすすめ20問」CTA。
 * 復習対象がある日だけ復習導線が追加で出る。
 */
export function HomeTodayCta({ clusters }: Props) {
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const summary = useMemo(() => {
    if (!hydrated) {
      return { reviewCount: 0 };
    }
    const reviewCount = getReviewTargetIds(entries).size;
    return { reviewCount };
  }, [entries, hydrated]);

  const lookup = useMemo<QuestionClusterLookup | undefined>(() => {
    if (!clusters || clusters.length === 0) return undefined;
    return {
      byId: new Map(
        clusters.map((c) => [c.id, { id: c.clusterId, label: c.clusterLabel }]),
      ),
    };
  }, [clusters]);

  const aiComment = useMemo(() => {
    if (!hydrated) return null;
    return buildHomeAiCoachComment(entries, new Date(), {
      clusterLookup: lookup,
    });
  }, [entries, hydrated, lookup]);

  return (
    <section className="space-y-2">
      <article className="relative overflow-hidden rounded-[16px] border border-[var(--primary)]/30 bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-14 right-4 h-32 w-32 rounded-full bg-[var(--primary)]/10 blur-2xl"
        />
        <div className="relative space-y-3 p-4">
          {/* AIコーチのナレーション */}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-wider text-[var(--primary-dark)]">
                AIコーチMiLu先生
              </p>
              <p
                className="mt-0.5 min-h-[2.4rem] text-[13px] leading-[1.75] font-medium text-[var(--text-1)]"
                aria-live="polite"
              >
                {aiComment?.message ??
                  "回答履歴を読み込んでいます。少しお待ちください。"}
              </p>
            </div>
          </div>

          {/* メインCTA: 今日のおすすめ */}
          <div className="flex items-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] p-3 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/40 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
            <Link
              href="/study/today"
              className="group flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-white shadow-[0_4px_12px_var(--primary-shadow-soft)]">
                <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-extrabold tracking-tight text-[var(--text-1)]">
                  今日のおすすめ 20問
                </span>
                <span className="mt-0.5 text-[11px] text-[var(--text-3)]">
                  復習・弱点・思い込み・未回答をAIがバランスよく
                </span>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
                strokeWidth={2.5}
              />
            </Link>
            <TodayRecommendedHowItWorksPopover />
          </div>

          {/* 補助CTA: 条件付きで出るMiLu先生からの一押し（メニューではなく文脈ベースの提案） */}
          {aiComment?.cta ? (
            <Link
              href={aiComment.cta.href}
              className="group flex items-center justify-between gap-2 rounded-[12px] border border-[var(--primary)]/30 bg-[var(--primary-soft)]/40 px-3 py-2.5 text-[var(--primary-dark)] transition-colors hover:bg-[var(--primary-soft)]/70"
            >
              <span className="text-[12px] font-bold">
                今日のひと押し：{aiComment.cta.label}
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            </Link>
          ) : null}
        </div>
      </article>

      {/* 復習導線（対象がある日だけ） */}
      {hydrated && summary.reviewCount > 0 ? (
        <div className="flex items-center gap-2 rounded-[16px] border border-border bg-[var(--bg-card)] p-4 text-[var(--text-1)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[var(--primary)]/35 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
          <Link
            href="/study/review"
            className="group flex min-w-0 flex-1 items-center gap-3"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              <RefreshCcw className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-1)]">
                今日の復習 {summary.reviewCount}問
              </span>
              <span className="mt-0.5 text-[12px] text-[var(--text-2)]">
                間違い・迷い・勘かもを少し時間を空けて確認します
              </span>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--primary-dark)]"
              strokeWidth={2.5}
            />
          </Link>
          <ReviewQueueHowItWorksPopover />
        </div>
      ) : null}
    </section>
  );
}
