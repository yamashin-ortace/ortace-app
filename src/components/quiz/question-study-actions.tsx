"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkX,
  Brain,
  Check,
  CircleHelp,
  NotebookText,
  PencilLine,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import type { Question } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { useQuestionStudyItems } from "@/lib/study-items/use-study-items";
import {
  BOOKMARK_CATEGORIES,
  type BookmarkCategory,
} from "@/lib/study-items";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  question: Question;
  initialOpen?: "note";
};

const SESSION_LABEL = { am: "午前", pm: "午後" } as const;

export function QuestionStudyActions({ question, initialOpen }: Props) {
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkDraft, setBookmarkDraft] = useState<BookmarkCategory[]>([]);
  const [noteOpen, setNoteOpen] = useState(initialOpen === "note");
  const [draft, setDraft] = useState<string | null>(null);
  const [saveFeedbackText, setSaveFeedbackText] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    "bookmark" | "note" | null
  >(null);
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookmarkCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const {
    isBookmarked,
    bookmarkCategories,
    noteText,
    hasNote,
    saveBookmarkCategories,
    removeBookmark,
    saveNote,
    removeNote,
  } = useQuestionStudyItems(question.id);

  const questionLabel = `第${question.round}回 ${SESSION_LABEL[question.session]} ${question.displayNumber}`;

  const handleOpenBookmark = () => {
    setBookmarkDraft(bookmarkCategories);
    setBookmarkOpen(true);
  };

  const showSaveFeedback = (message: string, durationMs = 2800) => {
    if (saveFeedbackTimerRef.current) {
      clearTimeout(saveFeedbackTimerRef.current);
    }
    setSaveFeedbackText(message);
    saveFeedbackTimerRef.current = setTimeout(() => {
      setSaveFeedbackText(null);
      saveFeedbackTimerRef.current = null;
    }, durationMs);
  };

  const handleSaveBookmark = () => {
    saveBookmarkCategories(bookmarkDraft);
    showSaveFeedback(
      isBookmarked && bookmarkDraft.length === 0 ? "解除しました" : "保存しました",
      2000,
    );
    if (bookmarkCloseTimerRef.current) {
      clearTimeout(bookmarkCloseTimerRef.current);
    }
    bookmarkCloseTimerRef.current = setTimeout(() => {
      setSaveFeedbackText(null);
      setBookmarkOpen(false);
      bookmarkCloseTimerRef.current = null;
    }, 2000);
  };

  const toggleBookmarkCategory = (category: BookmarkCategory) => {
    setBookmarkDraft((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const handleOpenNote = () => {
    setDraft(noteText);
    setNoteOpen(true);
  };

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current);
      }
      if (bookmarkCloseTimerRef.current) {
        clearTimeout(bookmarkCloseTimerRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    saveNote(draft ?? noteText);
    showSaveFeedback("保存しました");
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmTarget === "bookmark") {
      removeBookmark();
      setBookmarkDraft([]);
      setBookmarkOpen(false);
      showSaveFeedback("解除しました", 2000);
    }

    if (deleteConfirmTarget === "note") {
      removeNote();
      setDraft(null);
      setNoteOpen(false);
      showSaveFeedback("削除しました", 2000);
    }

    setSaveFeedbackText(null);
    if (saveFeedbackTimerRef.current) {
      clearTimeout(saveFeedbackTimerRef.current);
      saveFeedbackTimerRef.current = null;
    }
    setDeleteConfirmTarget(null);
  };

  const deleteCopy =
    deleteConfirmTarget === "bookmark"
      ? {
          title: "ブックマークを解除しますか？",
          description:
            "この問題はブックマークから外れます。あとで見返したい場合はキャンセルしてください。",
          confirm: "解除する",
        }
      : {
          title: "ノートを削除しますか？",
          description:
            "保存したメモは元に戻せません。本当に削除してよいですか？",
          confirm: "削除する",
        };

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={handleOpenBookmark}
          aria-pressed={isBookmarked}
          className={cn(
            "study-action-pressable inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold",
            isBookmarked
              ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
              : "border-border bg-[var(--bg-card)] text-[var(--text-2)] hover:border-[var(--text-3)]",
          )}
        >
          <Bookmark
            className={cn("h-3 w-3", isBookmarked && "fill-current")}
            strokeWidth={2.5}
          />
          ブックマーク
        </button>

        <button
          type="button"
          onClick={handleOpenNote}
          aria-pressed={hasNote}
          className={cn(
            "study-action-pressable inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold",
            hasNote
              ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
              : "border-border bg-[var(--bg-card)] text-[var(--text-2)] hover:border-[var(--text-3)]",
          )}
        >
          <PencilLine className="h-3 w-3" strokeWidth={2.5} />
          ノート
        </button>
      </div>

      <Sheet
        open={bookmarkOpen}
        onOpenChange={(open) => {
          if (open) setBookmarkDraft(bookmarkCategories);
          setBookmarkOpen(open);
          if (!open && bookmarkCloseTimerRef.current) {
            clearTimeout(bookmarkCloseTimerRef.current);
            bookmarkCloseTimerRef.current = null;
          }
          if (!open && deleteConfirmTarget === "bookmark") {
            setDeleteConfirmTarget(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[88vh] rounded-t-[16px] border-border bg-[var(--bg-card)]"
        >
          {isBookmarked ? (
            <SheetDeleteIconButton
              label="ブックマークを解除"
              onClick={() => setDeleteConfirmTarget("bookmark")}
            />
          ) : null}
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[17px] font-bold text-[var(--text-1)]">
              <span>ブックマーク</span>
              <span className="text-[11px] font-medium text-[var(--text-3)]">
                （あとで見返すためのタグを選んでください）
              </span>
            </SheetTitle>
            <SheetDescription className="text-[12px] text-[var(--text-3)]">
              {questionLabel}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 px-4">
            {BOOKMARK_CATEGORIES.map((category) => {
              const selected = bookmarkDraft.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleBookmarkCategory(category.id)}
                  aria-pressed={selected}
                  className={cn(
                    "study-action-pressable flex h-11 items-center gap-2 rounded-[12px] border px-3 text-left text-[13px] font-bold",
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                      : "border-border bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-muted)]",
                  )}
                >
                  <BookmarkCategoryIcon id={category.id} />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          <SheetFooter className="border-t border-border bg-[var(--bg-muted)]/40">
            <button
              type="button"
              onClick={handleSaveBookmark}
              disabled={!isBookmarked && bookmarkDraft.length === 0}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              {isBookmarked && bookmarkDraft.length === 0 ? (
                <>
                  <BookmarkX className="h-4 w-4" strokeWidth={2.5} />
                  解除
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" strokeWidth={2.5} />
                  保存
                </>
              )}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={noteOpen}
        onOpenChange={(open) => {
          setNoteOpen(open);
          if (!open) {
            if (deleteConfirmTarget === "note") {
              setDeleteConfirmTarget(null);
            }
            setSaveFeedbackText(null);
            if (saveFeedbackTimerRef.current) {
              clearTimeout(saveFeedbackTimerRef.current);
              saveFeedbackTimerRef.current = null;
            }
          }
        }}
      >
        <SheetContent
          side="top"
          className="max-h-[78vh] rounded-b-[16px] border-border bg-[var(--bg-card)]"
        >
          {hasNote ? (
            <SheetDeleteIconButton
              label="ノートを削除"
              onClick={() => setDeleteConfirmTarget("note")}
            />
          ) : null}
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle className="text-[17px] font-bold text-[var(--text-1)]">
              ノート
            </SheetTitle>
            <SheetDescription className="text-[12px] text-[var(--text-3)]">
              {questionLabel}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4">
            <Textarea
              value={draft ?? noteText}
              onChange={(e) => {
                setDraft(e.target.value);
                if (saveFeedbackText) {
                  setSaveFeedbackText(null);
                  if (saveFeedbackTimerRef.current) {
                    clearTimeout(saveFeedbackTimerRef.current);
                    saveFeedbackTimerRef.current = null;
                  }
                }
              }}
              placeholder="覚えておきたいこと、間違えた理由、次に見るポイントを書いておく"
              className="min-h-[160px]"
            />
          </div>

          <SheetFooter className="border-t border-border bg-[var(--bg-muted)]/40 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              <Save className="h-4 w-4" strokeWidth={2.5} />
              保存
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={deleteConfirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmTarget(null);
        }}
      >
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
              onClick={() => setDeleteConfirmTarget(null)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.5} />
              {deleteCopy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {saveFeedbackText ? (
                <motion.div
                  key="save-feedback-toast"
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: 28, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className={cn(
                    "pointer-events-none fixed top-[max(4.5rem,env(safe-area-inset-top)+2.75rem)] left-1/2 z-[110] flex w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 text-[14px] font-medium text-[var(--text-1)] shadow-lg",
                  )}
                >
                  <Check
                    className="h-5 w-5 shrink-0 text-[var(--success)]"
                    strokeWidth={2.5}
                  />
                  {saveFeedbackText}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

function SheetDeleteIconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute top-12 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--bg-card)] text-[var(--text-3)] shadow-sm transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      <Trash2 className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

function BookmarkCategoryIcon({ id }: { id: BookmarkCategory }) {
  const className = "h-4 w-4 shrink-0";
  if (id === "unknown") {
    return <CircleHelp className={className} strokeWidth={2.5} />;
  }
  if (id === "weak") return <Target className={className} strokeWidth={2.5} />;
  if (id === "memorize") return <Brain className={className} strokeWidth={2.5} />;
  return <NotebookText className={className} strokeWidth={2.5} />;
}
