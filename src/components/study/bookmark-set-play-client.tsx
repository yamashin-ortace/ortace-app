"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, Inbox } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import { useStudyItemsLists } from "@/lib/study-items/use-study-items";
import type { BookmarkCategory } from "@/lib/study-items";
import { restoreQuestionsFromLastProgress } from "@/lib/quiz-progress";

type Source =
  | { kind: "bookmark"; category: BookmarkCategory }
  | { kind: "notes" };

type Props = {
  questions: Question[];
  source: Source;
  resumeLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  plan: PlanType;
};

/**
 * ブックマークの区分（わかんない／ニガテ／覚える／授業メモ）または
 * ノートが付いている問題から、その日のセッションを組み立てて QuizPlayer に渡す。
 *
 * 採点中に並びが変わると体験が悪いので、初回マウント時に1度だけ ID リストを
 * 確定する（recommended-play-client と同じ凍結方式）。
 */
export function BookmarkSetPlayClient({
  questions,
  source,
  resumeLabel,
  emptyTitle,
  emptyMessage,
  plan,
}: Props) {
  const { bookmarks, notes } = useStudyItemsLists();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const quizHref = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const [frozen, setFrozen] = useState<Question[] | null>(null);

  useEffect(() => {
    if (frozen !== null) return;
    const restored = restoreQuestionsFromLastProgress(quizHref, questions);
    if (restored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 前回の演習セットを復元する
      setFrozen(restored);
      return;
    }
    const ids: string[] =
      source.kind === "bookmark"
        ? bookmarks
            .filter((b) => b.categories.includes(source.category))
            .map((b) => b.id)
        : notes.map((n) => n.id);

    const idToQuestion = new Map(questions.map((q) => [q.id, q]));
    const picked: Question[] = [];
    for (const id of ids) {
      const q = idToQuestion.get(id);
      if (q) picked.push(q);
    }
    setFrozen(picked);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ pool を凍結する
  }, []);

  if (frozen === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (frozen.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <QuizPlayer
      questions={frozen}
      mode="random"
      plan={plan}
      resumeLabel={resumeLabel}
    />
  );
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
