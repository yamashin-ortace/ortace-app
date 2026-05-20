"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  FileText,
  HelpCircle,
  History,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTokyoDateString } from "@/lib/daily-limit";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { useStudyItemsLists } from "@/lib/study-items/use-study-items";
import {
  BOOKMARK_CATEGORIES,
  type BookmarkCategory,
} from "@/lib/study-items";
import { cn } from "@/lib/utils";

export type QuestionSummary = {
  id: string;
  round: number;
  session: "am" | "pm";
  displayNumber: number;
  questionText: string;
  majorCategory: string;
};

type Props = {
  questions: QuestionSummary[];
};

const SESSION_LABEL = { am: "午前", pm: "午後" } as const;
const RECORDS_SCROLL_KEY = "ortace.records.scrollY";
const HISTORY_PAGE_SIZE = 50;
type RecordsTab = "bookmarks" | "notes" | "history";
type HistoryScope = "all" | "today" | "week" | "month";

const HISTORY_SCOPE_LABELS: Record<HistoryScope, string> = {
  all: "すべて",
  today: "今日",
  week: "1週間",
  month: "1ヶ月",
};

export function RecordsClient({ questions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { bookmarks, notes, removeBookmark, removeNote } = useStudyItemsLists();
  const { entries: answerHistory } = useAnswerHistoryList();
  const [activeTab, setActiveTab] = useState<RecordsTab>(() =>
    parseRecordsTab(searchParams.get("tab")),
  );
  const [categoryFilter, setCategoryFilter] = useState<BookmarkCategory | "all">(
    () => {
      const category = searchParams.get("category");
      return isBookmarkCategory(category) ? category : "all";
    },
  );
  const [historyScope, setHistoryScope] = useState<HistoryScope>(() =>
    parseHistoryScope(searchParams.get("range")),
  );
  const [visibleHistoryCount, setVisibleHistoryCount] =
    useState(HISTORY_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );
  const noteTextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) map.set(note.id, note.text);
    return map;
  }, [notes]);

  const matchesSearch = useCallback(
    (questionId: string, extraText: string = "") => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const question = questionMap.get(questionId);
      if (!question) return false;
      // 問題ID（"47-12"）、回数（"47" / "第47回"）、本文・分野・自分のノート本文を検索対象にする。
      const haystacks: string[] = [
        questionId,
        String(question.round),
        `第${question.round}回`,
        question.questionText,
        question.majorCategory,
        extraText,
      ];
      return haystacks.some((s) => s.toLowerCase().includes(q));
    },
    [searchQuery, questionMap],
  );

  const filteredBookmarks = useMemo(() => {
    const byCategory =
      categoryFilter === "all"
        ? bookmarks
        : bookmarks.filter((item) => item.categories.includes(categoryFilter));
    return byCategory.filter((item) =>
      matchesSearch(item.id, noteTextMap.get(item.id) ?? ""),
    );
  }, [bookmarks, categoryFilter, matchesSearch, noteTextMap]);

  const filteredNotes = useMemo(
    () => notes.filter((item) => matchesSearch(item.id, item.text)),
    [notes, matchesSearch],
  );

  const displayedHistory = useMemo(() => {
    const byScope =
      historyScope === "all"
        ? answerHistory
        : answerHistory.filter((entry) => isWithinScope(entry, historyScope));
    return byScope.filter((entry) =>
      matchesSearch(entry.id, noteTextMap.get(entry.id) ?? ""),
    );
  }, [answerHistory, historyScope, matchesSearch, noteTextMap]);
  const fieldSummaries = useMemo(
    () => calculateFieldSummaries(displayedHistory),
    [displayedHistory],
  );
  const visibleHistory = displayedHistory.slice(0, visibleHistoryCount);
  const hasMoreHistory = visibleHistory.length < displayedHistory.length;

  useEffect(() => {
    const savedScroll = window.sessionStorage.getItem(RECORDS_SCROLL_KEY);
    if (!savedScroll) return;

    window.sessionStorage.removeItem(RECORDS_SCROLL_KEY);
    const top = Number(savedScroll);
    if (!Number.isFinite(top)) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top });
      });
    });
  }, []);

  const updateRecordsUrl = useCallback(
    (
      nextTab: RecordsTab,
      nextCategory: BookmarkCategory | "all",
      nextHistoryScope: HistoryScope,
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", nextTab);
      if (nextTab === "bookmarks" && nextCategory !== "all") {
        params.set("category", nextCategory);
      } else {
        params.delete("category");
      }
      if (nextTab === "history" && nextHistoryScope !== "all") {
        params.set("range", nextHistoryScope);
      } else {
        params.delete("range");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleTabChange = (value: string) => {
    const nextTab = parseRecordsTab(value);
    setActiveTab(nextTab);
    updateRecordsUrl(nextTab, categoryFilter, historyScope);
  };

  const handleCategoryFilterChange = (nextCategory: BookmarkCategory | "all") => {
    setCategoryFilter(nextCategory);
    updateRecordsUrl(activeTab, nextCategory, historyScope);
  };

  const handleHistoryScopeChange = (nextScope: HistoryScope) => {
    setHistoryScope(nextScope);
    setVisibleHistoryCount(HISTORY_PAGE_SIZE);
    updateRecordsUrl(activeTab, categoryFilter, nextScope);
  };

  const saveRecordsScroll = () => {
    window.sessionStorage.setItem(RECORDS_SCROLL_KEY, String(window.scrollY));
  };

  const renderRecordsPanel = (tab: RecordsTab) => {
    if (tab === "bookmarks") {
      return (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            data-records-swipe-ignore
          >
            <FilterChip
              selected={categoryFilter === "all"}
              onClick={() => handleCategoryFilterChange("all")}
            >
              すべて
            </FilterChip>
            {BOOKMARK_CATEGORIES.map((category) => (
              <FilterChip
                key={category.id}
                selected={categoryFilter === category.id}
                onClick={() => handleCategoryFilterChange(category.id)}
              >
                {category.label}
              </FilterChip>
            ))}
          </div>

          {bookmarks.length === 0 ? (
            <EmptyState
              title="ブックマークはまだありません"
              description="演習中に保存した問題がここに並びます。"
            />
          ) : filteredBookmarks.length === 0 ? (
            <EmptyState
              title="一致するブックマークはありません"
              description="検索条件・フィルターを変えてみてください。"
            />
          ) : (
            filteredBookmarks.map((item) => {
              const question = questionMap.get(item.id);
              if (!question) return null;
              return (
                <SavedQuestionCard
                  key={item.id}
                  mode="bookmark"
                  question={question}
                  date={item.addedAt}
                  categories={item.categories}
                  actionLabel="ブックマーク解除"
                  onRemove={() => removeBookmark(item.id)}
                  onOpenDetail={saveRecordsScroll}
                  source="bookmark"
                  sourceCategory={categoryFilter}
                />
              );
            })
          )}
        </>
      );
    }

    if (tab === "notes") {
      return notes.length === 0 ? (
        <EmptyState
          title="ノートはまだありません"
          description="覚えておきたいことを書くと、ここから見返せます。"
        />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          title="一致するノートはありません"
          description="検索条件を変えてみてください。"
        />
      ) : (
        filteredNotes.map((item) => {
          const question = questionMap.get(item.id);
          if (!question) return null;
          return (
            <SavedQuestionCard
              key={item.id}
              mode="note"
              question={question}
              date={item.updatedAt}
              noteBody={item.text}
              actionLabel="ノート削除"
              onRemove={() => removeNote(item.id)}
              onOpenDetail={saveRecordsScroll}
              source="note"
            />
          );
        })
      );
    }

    return answerHistory.length === 0 ? (
      <EmptyState
        title="解答履歴はまだありません"
        description="問題に解答すると、ここから見返せます。"
      />
    ) : (
      <>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          data-records-swipe-ignore
        >
          {(Object.keys(HISTORY_SCOPE_LABELS) as HistoryScope[]).map((scope) => (
            <FilterChip
              key={scope}
              selected={historyScope === scope}
              onClick={() => handleHistoryScopeChange(scope)}
            >
              {HISTORY_SCOPE_LABELS[scope]}
            </FilterChip>
          ))}
        </div>

        {displayedHistory.length === 0 ? (
          <EmptyState
            title={
              searchQuery.trim()
                ? "一致する履歴はありません"
                : "今日の解答はまだありません"
            }
            description={
              searchQuery.trim()
                ? "検索条件を変えてみてください。"
                : "問題を解くと、今日の履歴がここに並びます。"
            }
          />
        ) : (
          <>
            <FieldSummaryList summaries={fieldSummaries} scope={historyScope} />
            {visibleHistory.map((entry) => {
              const question = questionMap.get(entry.id);
              if (!question) return null;
              return (
                <AnswerHistoryCard
                  key={`${entry.id}-${entry.answeredAt}`}
                  entry={entry}
                  question={question}
                  onOpenDetail={saveRecordsScroll}
                  historyScope={historyScope}
                />
              );
            })}
            {hasMoreHistory ? (
              <button
                type="button"
                onClick={() =>
                  setVisibleHistoryCount((count) => count + HISTORY_PAGE_SIZE)
                }
                className="w-full rounded-[12px] border border-border bg-[var(--bg-card)] px-4 py-3 text-[13px] font-bold text-[var(--text-2)] shadow-sm transition-colors hover:bg-[var(--bg-muted)]"
              >
                もっと見る（あと
                {displayedHistory.length - visibleHistory.length}件）
              </button>
            ) : null}
          </>
        )}
      </>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <RecordsSearchInput value={searchQuery} onChange={setSearchQuery} />
      <TabsList className="grid h-11 w-full grid-cols-3 items-center rounded-[12px] bg-[var(--bg-muted)] p-1">
        <TabsTrigger
          value="bookmarks"
          className="h-full rounded-[10px] py-0 text-[13px] leading-none font-bold after:hidden data-active:bg-[var(--bg-card)] data-active:text-[var(--text-1)]"
        >
          <Bookmark className="h-4 w-4" strokeWidth={2.5} />
          ブックマーク
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="h-full rounded-[10px] py-0 text-[13px] leading-none font-bold after:hidden data-active:bg-[var(--bg-card)] data-active:text-[var(--text-1)]"
        >
          <FileText className="h-4 w-4" strokeWidth={2.5} />
          ノート
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="h-full rounded-[10px] py-0 text-[13px] leading-none font-bold after:hidden data-active:bg-[var(--bg-card)] data-active:text-[var(--text-1)]"
        >
          <History className="h-4 w-4" strokeWidth={2.5} />
          履歴
        </TabsTrigger>
      </TabsList>

      <div className="space-y-3">
        {renderRecordsPanel(activeTab)}
      </div>
    </Tabs>
  );
}

function SavedQuestionCard({
  question,
  date,
  actionLabel,
  onRemove,
  categories,
  mode,
  noteBody,
  onOpenDetail,
  source,
  sourceCategory,
}: {
  question: QuestionSummary;
  date: string;
  actionLabel: string;
  onRemove: () => void;
  categories?: BookmarkCategory[];
  mode: "bookmark" | "note";
  noteBody?: string;
  onOpenDetail: () => void;
  source: "bookmark" | "note";
  sourceCategory?: BookmarkCategory | "all";
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const stem = question.questionText.replace(/\s+/g, " ").trim();
  const href = (() => {
    const params = new URLSearchParams({ from: source });
    if (mode === "note") params.set("note", "1");
    if (source === "bookmark" && sourceCategory && sourceCategory !== "all") {
      params.set("category", sourceCategory);
    }
    return `/study/question/${question.id}?${params.toString()}`;
  })();
  const deleteCopy =
    mode === "note"
      ? {
          title: "ノートを削除しますか？",
          description:
            "保存したメモは元に戻せません。本当に削除してよいですか？",
          confirm: "削除する",
        }
      : {
          title: "ブックマークを解除しますか？",
          description:
            "この問題はブックマーク一覧から外れます。あとで見返す必要がある場合はキャンセルしてください。",
          confirm: "解除する",
        };

  const handleConfirmRemove = () => {
    onRemove();
    setDeleteConfirmOpen(false);
  };

  const removeButton = (
    <button
      type="button"
      onClick={() => setDeleteConfirmOpen(true)}
      className="choice-pressable grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-[var(--bg-card)] text-[var(--text-3)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
      aria-label={actionLabel}
    >
      <Trash2 className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );

  return (
    <>
      <article className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {mode === "note" ? (
            <>
              <Link
                href={href}
                className="min-w-0 flex-1 space-y-2"
                onClick={onOpenDetail}
              >
                <div>
                  <span className="rounded-[6px] bg-[var(--primary-soft)] px-2 py-1 text-[11px] font-bold text-[var(--primary-dark)]">
                    第{question.round}回 {SESSION_LABEL[question.session]}{" "}
                    {question.displayNumber}
                  </span>
                </div>
                <p className="line-clamp-2 text-[14px] leading-6 font-medium text-[var(--text-1)] sm:line-clamp-3">
                  {stem || "（問題文なし）"}
                </p>
                <p className="line-clamp-4 text-[14px] leading-6 font-medium text-[var(--text-1)]">
                  {(noteBody ?? "").replace(/\s+/g, " ").trim() ||
                    "（ノート未入力）"}
                </p>
                <p className="text-[11px] text-[var(--text-3)]">
                  {formatDateTime(date)}
                </p>
              </Link>
              {removeButton}
            </>
          ) : (
            <>
            <Link
              href={href}
              className="min-w-0 flex-1 space-y-2"
              onClick={onOpenDetail}
            >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[6px] bg-[var(--primary-soft)] px-2 py-1 text-[11px] font-bold text-[var(--primary-dark)]">
                    第{question.round}回 {SESSION_LABEL[question.session]}{" "}
                    {question.displayNumber}
                  </span>
                {categories && categories.length > 0
                  ? categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-3)]"
                      >
                        {getBookmarkCategoryLabel(category)}
                      </span>
                    ))
                  : null}
                </div>
                <p className="line-clamp-2 text-[14px] leading-6 font-medium text-[var(--text-1)] sm:line-clamp-3">
                  {stem || "（問題文なし）"}
                </p>
                <p className="text-[11px] text-[var(--text-3)]">
                  {formatDateTime(date)}
                </p>
              </Link>
              {removeButton}
            </>
          )}
        </div>
      </article>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-[var(--text-1)]">
              {deleteCopy.title}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-2)]">
              {deleteCopy.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleConfirmRemove}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.5} />
              {deleteCopy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AnswerHistoryCard({
  entry,
  question,
  onOpenDetail,
  historyScope,
}: {
  entry: AnswerHistoryEntry;
  question: QuestionSummary;
  onOpenDetail: () => void;
  historyScope: HistoryScope;
}) {
  const stem = question.questionText.replace(/\s+/g, " ").trim();
  const result = getAnswerResultDisplay(entry.result);
  const ResultIcon = result.icon;
  const href = (() => {
    const params = new URLSearchParams({ from: "history" });
    if (historyScope !== "all") params.set("range", historyScope);
    return `/study/question/${question.id}?${params.toString()}`;
  })();

  return (
    <article className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-sm">
      <Link
        href={href}
        onClick={onOpenDetail}
        className="block space-y-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[6px] bg-[var(--primary-soft)] px-2 py-1 text-[11px] font-bold text-[var(--primary-dark)]">
            第{question.round}回 {SESSION_LABEL[question.session]}{" "}
            {question.displayNumber}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              result.className,
            )}
          >
            <ResultIcon className="h-3 w-3" strokeWidth={2.5} />
            {result.label}
          </span>
        </div>
        <p className="line-clamp-2 text-[14px] leading-6 font-medium text-[var(--text-1)] sm:line-clamp-3">
          {stem || "（問題文なし）"}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-3)]">
          <span>{formatDateTime(entry.answeredAt)}</span>
          {entry.selectedAnswers.length > 0 ? (
            <span>選択: {entry.selectedAnswers.join(", ")}</span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function FieldSummaryList({
  summaries,
  scope,
}: {
  summaries: FieldSummary[];
  scope: HistoryScope;
}) {
  if (summaries.length === 0) return null;

  const scopeSummary = describeHistoryScope(scope);

  return (
    <section className="rounded-[14px] border border-border bg-[var(--bg-card)] px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-2 px-1">
        <h3 className="text-[15px] font-bold text-[var(--text-1)]">
          分野別の成績
        </h3>
        <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
          {scopeSummary}の正答率と解答数
        </p>
      </div>
      <div className="divide-y divide-border/70">
        {summaries.map((summary) => (
          <FieldSummaryRow key={summary.majorCategory} summary={summary} />
        ))}
      </div>
    </section>
  );
}

function FieldSummaryRow({ summary }: { summary: FieldSummary }) {
  const accuracy = summary.accuracy;
  return (
    <div className="px-1 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 flex-1 text-[13px] font-bold text-[var(--text-1)]">
          {summary.majorCategory}
        </p>
        <p className="shrink-0 text-[11px] font-semibold text-[var(--text-3)]">
          正答率{" "}
          <span className="text-[17px] font-extrabold tabular-nums text-[var(--primary-dark)]">
            {accuracy === null ? "--" : accuracy}
          </span>
          %
        </p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, accuracy ?? 0))}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-3)]">
        <span>
          解答{" "}
          <span className="font-bold tabular-nums text-[var(--text-2)]">
            {summary.total}
          </span>
          問
        </span>
        <span>
          正解{" "}
          <span className="font-bold tabular-nums text-[var(--text-2)]">
            {summary.correct}
          </span>
          問
        </span>
        {summary.noAnswer > 0 ? (
          <span>
            正答なし{" "}
            <span className="font-bold tabular-nums text-[var(--text-2)]">
              {summary.noAnswer}
            </span>
            問
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        selected
          ? "shrink-0 rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--primary-dark)]"
          : "shrink-0 rounded-full border border-border bg-[var(--bg-card)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-3)]"
      }
    >
      {children}
    </button>
  );
}

function RecordsSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]"
        strokeWidth={2.5}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="問題番号やキーワードで検索"
        aria-label="記録を検索"
        className={cn(
          "h-10 w-full rounded-[12px] border border-border bg-[var(--bg-card)] pr-10 pl-9 text-[14px] text-[var(--text-1)]",
          "shadow-sm placeholder:text-[var(--text-3)]",
          "focus:border-[var(--primary)] focus:outline-none",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="検索をクリア"
          className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-border bg-[var(--bg-card)] px-4 py-8 text-center">
      <p className="text-[14px] font-bold text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-3)]">
        {description}
      </p>
    </div>
  );
}

function getBookmarkCategoryLabel(id: BookmarkCategory): string {
  return BOOKMARK_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

type FieldSummary = {
  majorCategory: string;
  total: number;
  judged: number;
  correct: number;
  noAnswer: number;
  accuracy: number | null;
};

function calculateFieldSummaries(entries: AnswerHistoryEntry[]): FieldSummary[] {
  const map = new Map<string, FieldSummary>();

  for (const entry of entries) {
    const key = entry.majorCategory || "未分類";
    const current =
      map.get(key) ??
      ({
        majorCategory: key,
        total: 0,
        judged: 0,
        correct: 0,
        noAnswer: 0,
        accuracy: null,
      } satisfies FieldSummary);

    current.total += 1;
    if (entry.result === "no_answer") {
      current.noAnswer += 1;
    } else {
      current.judged += 1;
      if (entry.result === "correct") current.correct += 1;
    }
    current.accuracy =
      current.judged === 0
        ? null
        : Math.round((current.correct / current.judged) * 100);
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.majorCategory.localeCompare(b.majorCategory, "ja");
  });
}

function isAnsweredToday(entry: AnswerHistoryEntry): boolean {
  const date = new Date(entry.answeredAt);
  if (Number.isNaN(date.getTime())) return false;
  return getTokyoDateString(date) === getTokyoDateString();
}

function isWithinScope(
  entry: AnswerHistoryEntry,
  scope: HistoryScope,
): boolean {
  if (scope === "all") return true;
  if (scope === "today") return isAnsweredToday(entry);
  const date = new Date(entry.answeredAt);
  if (Number.isNaN(date.getTime())) return false;
  const days = scope === "week" ? 7 : 30;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= threshold;
}

function describeHistoryScope(scope: HistoryScope): string {
  if (scope === "all") return "これまでの解答全体";
  if (scope === "today") return "今日の解答";
  return `直近${HISTORY_SCOPE_LABELS[scope]}の解答`;
}

function parseHistoryScope(value: string | null): HistoryScope {
  if (value === "today" || value === "week" || value === "month") return value;
  return "all";
}

function isBookmarkCategory(value: string | null): value is BookmarkCategory {
  return BOOKMARK_CATEGORIES.some((category) => category.id === value);
}

function parseRecordsTab(value: string | null): RecordsTab {
  if (value === "notes" || value === "history") return value;
  return "bookmarks";
}

function getAnswerResultDisplay(result: AnswerHistoryEntry["result"]) {
  if (result === "correct") {
    return {
      label: "正解",
      icon: CheckCircle2,
      className: "bg-green-500/10 text-[var(--success)]",
    };
  }
  if (result === "incorrect") {
    return {
      label: "不正解",
      icon: XCircle,
      className: "bg-red-500/10 text-[var(--error)]",
    };
  }
  return {
    label: "正答なし",
    icon: HelpCircle,
    className: "bg-[var(--bg-muted)] text-[var(--text-3)]",
  };
}

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
