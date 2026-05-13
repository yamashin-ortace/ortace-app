"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { useStudyItemsLists } from "@/lib/study-items/use-study-items";
import {
  BOOKMARK_CATEGORIES,
  type BookmarkCategory,
} from "@/lib/study-items";

type Source = "bookmark" | "note" | "history";

type Props = {
  question: Question;
  plan: PlanType;
  initialNote: boolean;
};

/**
 * 記録ページから「ブックマーク／ノート／履歴」の1問だけを開いた時の単問プレイヤー。
 *
 * - QuizPlayer に singleMode を渡し、結果画面に飛ばないようにする
 * - URL の `from` を見て、対応するソース一覧の中での前後の問題 ID を計算
 * - フッターの「前へ／次へ」でリスト内の隣接問題に遷移できる
 *
 * 履歴タブの「今日だけ」フィルタなど、コンテキストは `range` などの URL パラメータで受け取る。
 */
export function SingleQuestionPlayer({ question, plan, initialNote }: Props) {
  const searchParams = useSearchParams();
  const { entries: history } = useAnswerHistoryList();
  const { bookmarks, notes } = useStudyItemsLists();

  const source = parseSource(searchParams.get("from"));
  const categoryParam = searchParams.get("category");
  const range = searchParams.get("range");

  const orderedIds = useMemo(() => {
    if (source === "bookmark") {
      const filterCategory = isBookmarkCategory(categoryParam)
        ? categoryParam
        : null;
      return bookmarks
        .filter((item) =>
          filterCategory ? item.categories.includes(filterCategory) : true,
        )
        .map((item) => item.id);
    }
    if (source === "note") {
      return notes.map((item) => item.id);
    }
    if (source === "history") {
      const rows =
        range === "today"
          ? history.filter((entry) => isAnsweredToday(entry.answeredAt))
          : history;
      // 同じ問題が複数回履歴にあるが、重複は最初に出てくる順を残す。
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const entry of rows) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        ids.push(entry.id);
      }
      return ids;
    }
    return [];
  }, [source, categoryParam, range, bookmarks, notes, history]);

  const queryStringForList = useMemo(() => {
    const params = new URLSearchParams({ from: source ?? "" });
    if (source === "bookmark" && categoryParam) {
      params.set("category", categoryParam);
    }
    if (source === "history" && range === "today") {
      params.set("range", "today");
    }
    if (initialNote) params.set("note", "1");
    // from が空文字なら params から除く
    if (!source) params.delete("from");
    return params.toString();
  }, [source, categoryParam, range, initialNote]);

  const hrefForId = (id: string) =>
    queryStringForList
      ? `/study/question/${id}?${queryStringForList}`
      : `/study/question/${id}`;

  const currentPos = orderedIds.indexOf(question.id);
  const prevId = currentPos > 0 ? orderedIds[currentPos - 1] : null;
  const nextId =
    currentPos >= 0 && currentPos < orderedIds.length - 1
      ? orderedIds[currentPos + 1]
      : null;

  const backHref = (() => {
    if (source === "bookmark") {
      const params = new URLSearchParams({ tab: "bookmarks" });
      if (categoryParam) params.set("category", categoryParam);
      return `/records?${params.toString()}`;
    }
    if (source === "note") return "/records?tab=notes";
    if (source === "history") {
      const params = new URLSearchParams({ tab: "history" });
      if (range === "today") params.set("range", "today");
      return `/records?${params.toString()}`;
    }
    return "/records";
  })();

  return (
    <QuizPlayer
      questions={[question]}
      mode="random"
      plan={plan}
      initialStudyAction={initialNote ? "note" : undefined}
      saveProgress={false}
      singleMode={source !== null}
      prevQuestionHref={prevId ? hrefForId(prevId) : null}
      nextQuestionHref={nextId ? hrefForId(nextId) : null}
      singleBackHref={backHref}
      singleBackLabel="記録に戻る"
    />
  );
}

function parseSource(value: string | null): Source | null {
  if (value === "bookmark" || value === "note" || value === "history") {
    return value;
  }
  return null;
}

function isBookmarkCategory(value: string | null): value is BookmarkCategory {
  return (
    typeof value === "string" &&
    BOOKMARK_CATEGORIES.some((c) => c.id === value)
  );
}

function isAnsweredToday(answeredAtISO: string): boolean {
  const date = new Date(answeredAtISO);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}
