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
import type { Field, Question } from "@/lib/questions";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { getUntouchedQuestions } from "@/lib/answer-history/status";
import { shuffle } from "@/lib/quiz";
import { restoreQuestionsFromLastProgress } from "@/lib/quiz-progress";

type Mode = "selected" | "random";

type Props = {
  questions: Question[];
  fields: readonly Field[];
  defaultLimit: AllowedCount;
  plan: PlanType;
};

/**
 * 「未着手から解く」のプレイ画面。
 * URL から `mode` / `fields` / `count` を読み、未着手の中からセッション分を選ぶ。
 */
export function UnansweredPlayClient({
  questions,
  fields,
  defaultLimit,
  plan,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const quizHref = query ? `${pathname}?${query}` : pathname;
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const mode: Mode = searchParams.get("mode") === "random" ? "random" : "selected";
  const fieldsParam = searchParams.get("fields") ?? "";
  const limit = parseCountFromSearchParams(searchParams.get("count"), defaultLimit);

  const selectedFieldSet = useMemo(() => {
    if (mode === "random") return null;
    const validFields = new Set<string>(fields);
    return new Set(
      fieldsParam
        .split("|")
        .filter((value) => value.length > 0 && validFields.has(value)),
    );
  }, [fields, fieldsParam, mode]);

  const sessionQuestions = useMemo(() => {
    if (!hydrated) return null;
    const restored = restoreQuestionsFromLastProgress(quizHref, questions);
    if (restored) return restored;
    const untouched = getUntouchedQuestions(questions, entries);
    const pool =
      mode === "random"
        ? untouched
        : selectedFieldSet && selectedFieldSet.size > 0
          ? untouched.filter((q) => selectedFieldSet.has(q.majorCategory))
          : [];
    if (pool.length === 0) return [];
    if (mode === "random") {
      return shuffle(pool).slice(0, limit);
    }
    const ordered = [...pool].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      if (a.session !== b.session) return a.session === "am" ? -1 : 1;
      return a.displayNumber - b.displayNumber;
    });
    return ordered.slice(0, limit);
    // 解答中の並び替えを避けるため、依存は hydrated/mode/limit と分野キーのみ
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 上記
  }, [hydrated, mode, limit, fieldsParam, quizHref]);

  if (!hydrated || sessionQuestions === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (sessionQuestions.length === 0) {
    return <EmptyState mode={mode} hasFields={Boolean(selectedFieldSet && selectedFieldSet.size > 0)} />;
  }

  const resumeLabel =
    mode === "random"
      ? `未着手（ランダム ${sessionQuestions.length}問）`
      : `未着手（${selectedFieldSet?.size ?? 0}分野・${sessionQuestions.length}問）`;

  return (
    <QuizPlayer
      questions={sessionQuestions}
      mode="random"
      plan={plan}
      resumeLabel={resumeLabel}
    />
  );
}

function EmptyState({ mode, hasFields }: { mode: Mode; hasFields: boolean }) {
  const message =
    mode === "random"
      ? "未着手の問題がありません。お疲れさまでした！"
      : !hasFields
        ? "分野が選ばれていません。設定画面に戻って分野を選んでください。"
        : "選んだ分野には未着手の問題がありません。別の分野を選んでみましょう。";

  return (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-muted)] text-[var(--text-3)]">
        <Inbox className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-bold text-[var(--text-1)]">
          出題できる問題がありません
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{message}</p>
      </div>
      <Link
        href="/study/unanswered"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        設定画面に戻る
      </Link>
    </div>
  );
}
