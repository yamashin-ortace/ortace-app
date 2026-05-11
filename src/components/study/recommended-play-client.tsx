"use client";

import { useEffect, useMemo, useState } from "react";
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

/**
 * 解答のたびに entries が更新されると pool のシャッフル結果が毎回変わり、
 * QuizPlayer に渡す questions の並びが差し替わって採点表示が壊れるのを防ぐため、
 * ハイドレーション直後の1回だけ出題リストを確定する（entries は依存に含めない）。
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  // 出題数を変更した場合はセッションを選び直す。
  // entries/mode/questions は意図的に依存に含めない（解答のたびに並びが変わらないようにする）。
  const sessionQuestions = useMemo(() => {
    if (!hydrated) return null;
    const pool = pickPoolByMode(mode, questions, entries, limit);
    return pickSessionFromPool(mode, pool, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 解答中の並び替えを避けるため、依存は hydrated/limit のみ
  }, [hydrated, limit]);

  if (!hydrated || sessionQuestions === null) {
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

function pickSessionFromPool(
  mode: RecommendedMode,
  pool: Question[],
  limit: number,
): Question[] {
  if (pool.length === 0) return [];
  const n = Math.min(limit, pool.length);
  if (mode === "today" || mode === "unanswered") {
    return pool.slice(0, n);
  }
  return shuffle(pool).slice(0, n);
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
