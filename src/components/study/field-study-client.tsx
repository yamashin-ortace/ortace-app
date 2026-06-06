"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, Inbox } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import {
  parseCountFromSearchParams,
  type AllowedCount,
} from "@/components/study/question-count-selector";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { getUntouchedQuestions } from "@/lib/answer-history/status";
import { shuffle } from "@/lib/quiz";
import { restoreQuestionsFromLastProgress } from "@/lib/quiz-progress";

type Props = {
  /** その分野の全問題 */
  fieldQuestions: Question[];
  fieldName: string;
  /** URL に `?count=` が無いときの既定出題数 */
  limit: AllowedCount;
  plan: PlanType;
};

export function FieldStudyClient({
  fieldQuestions,
  fieldName,
  limit: defaultLimit,
  plan,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const quizHref = query ? `${pathname}?${query}` : pathname;
  const limit = parseCountFromSearchParams(
    searchParams.get("count"),
    defaultLimit,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const picked = useMemo(() => {
    if (!hydrated) return [];
    const restored = restoreQuestionsFromLastProgress(quizHref, fieldQuestions);
    if (restored) return restored;
    const untouched = getUntouchedQuestions(fieldQuestions, entries);
    const untouchedIds = new Set(untouched.map((q) => q.id));
    const answered = fieldQuestions.filter((q) => !untouchedIds.has(q.id));
    const head = shuffle(untouched).slice(0, limit);
    if (head.length >= limit) return head;
    const remain = shuffle(answered).slice(0, limit - head.length);
    return [...head, ...remain];
    // 解答中の並び替えを避けるため、依存は hydrated/limit のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 上記
  }, [hydrated, limit, quizHref]);

  if (!hydrated) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (picked.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-muted)] text-[var(--text-3)]">
          <Inbox className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="text-[16px] font-bold text-[var(--text-1)]">
            「{fieldName}」の問題が見つかりません
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
            分野名が変更されている可能性があります。
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          ホームへ戻る
        </Link>
      </div>
    );
  }

  return (
    <QuizPlayer
      questions={picked}
      mode="random"
      plan={plan}
      resumeLabel={`${fieldName} ${picked.length}問`}
    />
  );
}
