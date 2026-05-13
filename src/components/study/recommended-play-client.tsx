"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Inbox } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import {
  parseCountFromSearchParams,
  type AllowedCount,
} from "@/components/study/question-count-selector";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import {
  getReviewQuestions,
  getUntouchedQuestions,
  getStagedWeakFields,
  getFieldStats,
  pickTodaysRecommended,
} from "@/lib/answer-history/status";
import { shuffle } from "@/lib/quiz";

export type RecommendedMode = "review" | "unanswered" | "weak" | "today";

type Props = {
  questions: Question[];
  mode: RecommendedMode;
  /** URL に `?count=` が無いときの既定出題数 */
  limit: AllowedCount;
  resumeLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  plan: PlanType;
};

const MAX_LIMIT = 20;

/**
 * 解答のたびに entries が更新されたり、出題数を変更したりするたびに pool が
 * 作り直されると、解答済み状態が新しい並びに対してズレてしまう。それを防ぐため
 * ハイドレーション直後に「最大出題数（20問）ぶん」を1回だけ確定し、UI の出題数は
 * その固定プールを slice するだけにする。出題数を増減しても先頭からの並びは変わらず、
 * 既に解答した問題はそのままの位置にとどまる。
 */
export function RecommendedPlayClient({
  questions,
  mode,
  limit: defaultLimit,
  resumeLabel,
  emptyTitle,
  emptyMessage,
  plan,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const searchParams = useSearchParams();
  const limit = parseCountFromSearchParams(
    searchParams.get("count"),
    defaultLimit,
  );
  const [frozenPool, setFrozenPool] = useState<Question[] | null>(null);

  useEffect(() => {
    if (frozenPool !== null) return;
    const pool = pickPoolByMode(mode, questions, entries, MAX_LIMIT);
    const ordered = orderPoolForMode(mode, pool);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション後にプールを確定する
    setFrozenPool(ordered.slice(0, MAX_LIMIT));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ pool を凍結する
  }, []);

  const sessionQuestions = frozenPool
    ? frozenPool.slice(0, Math.min(limit, frozenPool.length))
    : null;

  if (sessionQuestions === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (sessionQuestions.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <QuizPlayer
      questions={sessionQuestions}
      mode="random"
      plan={plan}
      resumeLabel={resumeLabel}
    />
  );
}

/**
 * モードごとに pool の並びを「最終的な出題順」に整える（凍結前の1回だけ）。
 * - today/unanswered：すでに pickPoolByMode 内で並び順が確定しているのでそのまま
 * - review/weak：ランダム性を持たせるためここで一度だけ shuffle する
 */
function orderPoolForMode(mode: RecommendedMode, pool: Question[]): Question[] {
  if (pool.length === 0) return [];
  if (mode === "today" || mode === "unanswered") return pool;
  return shuffle(pool);
}

function pickPoolByMode(
  mode: RecommendedMode,
  questions: Question[],
  entries: AnswerHistoryEntry[],
  limit: number,
): Question[] {
  if (mode === "review") {
    return getReviewQuestions(questions, entries);
  }
  if (mode === "unanswered") {
    return getUntouchedQuestions(questions, entries).sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      if (a.session !== b.session) return a.session === "am" ? -1 : 1;
      return a.displayNumber - b.displayNumber;
    });
  }
  if (mode === "weak") {
    const stats = getFieldStats(questions, entries);
    const staged = getStagedWeakFields(stats);
    // 確定（10問以上）を優先し、足りなければ暫定（5問以上）で補う。
    // 上位3分野まで対象にする。
    const ranked = [...staged.confirmed, ...staged.provisional];
    const topWeakFields = new Set(ranked.slice(0, 3).map((s) => s.field));
    if (topWeakFields.size === 0) return [];
    return questions.filter((q) => topWeakFields.has(q.majorCategory));
  }
  return pickTodaysRecommended(questions, entries, limit);
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-muted)] text-[var(--text-3)]">
        <Inbox className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-bold text-[var(--text-1)]">{title}</p>
        <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
          {message}
        </p>
      </div>
      <Link
        href="/study"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        学習トップへ戻る
      </Link>
    </div>
  );
}
