"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  BOOKMARKS_STORAGE_KEY,
  NOTES_STORAGE_KEY,
  createBookmarksStore,
  createNotesStore,
  getBookmarkCategories,
  getSortedBookmarkEntries,
  getSortedNoteEntries,
  hasBookmark,
  parseBookmarksStore,
  parseNotesStore,
  removeBookmark,
  removeNote,
  serializeBookmarksStore,
  serializeNotesStore,
  setBookmarkCategories,
  setNote,
  toggleBookmark,
  type BookmarkCategory,
  type BookmarksStore,
  type NotesStore,
} from ".";
import {
  pushBookmarkToDatabase,
  pushNoteToDatabase,
  syncStudyItemsWithDatabase,
} from "@/lib/study-sync";

const STUDY_ITEMS_UPDATED_EVENT = "ortace:study-items-updated";

export function useQuestionStudyItems(questionId: string) {
  useEnsureStudyItemsSynced();
  const { bookmarks, notes } = useStudyItemsStores();

  const isBookmarked = hasBookmark(bookmarks, questionId);
  const bookmarkCategories = getBookmarkCategories(bookmarks, questionId);
  const noteText = notes.items[questionId]?.text ?? "";
  const hasNote = noteText.trim().length > 0;

  const toggleCurrentBookmark = useCallback(() => {
    const next = toggleBookmark(readBookmarksStore(), questionId);
    writeBookmarksStore(next);
    notifyStudyItemsUpdated();
    void pushBookmarkToDatabase(questionId, next);
  }, [questionId]);

  const saveCurrentBookmarkCategories = useCallback(
    (categories: readonly BookmarkCategory[]) => {
      const next = setBookmarkCategories(
        readBookmarksStore(),
        questionId,
        categories,
      );
      writeBookmarksStore(next);
      notifyStudyItemsUpdated();
      void pushBookmarkToDatabase(questionId, next);
    },
    [questionId],
  );

  const removeCurrentBookmark = useCallback(() => {
    const next = removeBookmark(readBookmarksStore(), questionId);
    writeBookmarksStore(next);
    notifyStudyItemsUpdated();
    void pushBookmarkToDatabase(questionId, next);
  }, [questionId]);

  const saveCurrentNote = useCallback(
    (text: string) => {
      const next = setNote(readNotesStore(), questionId, text);
      writeNotesStore(next);
      notifyStudyItemsUpdated();
      void pushNoteToDatabase(questionId, next);
    },
    [questionId],
  );

  const removeCurrentNote = useCallback(() => {
    const next = removeNote(readNotesStore(), questionId);
    writeNotesStore(next);
    notifyStudyItemsUpdated();
    void pushNoteToDatabase(questionId, next);
  }, [questionId]);

  return {
    isBookmarked,
    bookmarkCategories,
    noteText,
    hasNote,
    toggleBookmark: toggleCurrentBookmark,
    saveBookmarkCategories: saveCurrentBookmarkCategories,
    removeBookmark: removeCurrentBookmark,
    saveNote: saveCurrentNote,
    removeNote: removeCurrentNote,
  };
}

export function useStudyItemsLists() {
  useEnsureStudyItemsSynced();
  const { bookmarks, notes } = useStudyItemsStores();

  const removeCurrentBookmark = useCallback((questionId: string) => {
    const next = removeBookmark(readBookmarksStore(), questionId);
    writeBookmarksStore(next);
    notifyStudyItemsUpdated();
    void pushBookmarkToDatabase(questionId, next);
  }, []);

  const removeCurrentNote = useCallback((questionId: string) => {
    const next = removeNote(readNotesStore(), questionId);
    writeNotesStore(next);
    notifyStudyItemsUpdated();
    void pushNoteToDatabase(questionId, next);
  }, []);

  return useMemo(
    () => ({
      bookmarks: getSortedBookmarkEntries(bookmarks),
      notes: getSortedNoteEntries(notes),
      removeBookmark: removeCurrentBookmark,
      removeNote: removeCurrentNote,
    }),
    [bookmarks, notes, removeCurrentBookmark, removeCurrentNote],
  );
}

function useStudyItemsStores() {
  const snapshot = useSyncExternalStore(
    subscribeStudyItems,
    getStudyItemsSnapshot,
    getStudyItemsServerSnapshot,
  );

  return useMemo(() => {
    const parsed = JSON.parse(snapshot) as {
      bookmarks: string;
      notes: string;
    };
    return {
      bookmarks: parseBookmarksStore(parsed.bookmarks),
      notes: parseNotesStore(parsed.notes),
    };
  }, [snapshot]);
}

let fallbackBookmarksStore: BookmarksStore | null = null;
let fallbackNotesStore: NotesStore | null = null;
let studyItemsSyncStarted = false;

function useEnsureStudyItemsSynced() {
  useEffect(() => {
    if (studyItemsSyncStarted) return;
    studyItemsSyncStarted = true;

    let cancelled = false;
    void syncStudyItemsWithDatabase(readBookmarksStore(), readNotesStore()).then(
      (merged) => {
        if (cancelled || !merged) return;
        writeBookmarksStore(merged.bookmarks);
        writeNotesStore(merged.notes);
        notifyStudyItemsUpdated();
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);
}

function subscribeStudyItems(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === BOOKMARKS_STORAGE_KEY ||
      event.key === NOTES_STORAGE_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STUDY_ITEMS_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STUDY_ITEMS_UPDATED_EVENT, onStoreChange);
  };
}

function getStudyItemsSnapshot(): string {
  return JSON.stringify({
    bookmarks: serializeBookmarksStore(readBookmarksStore()),
    notes: serializeNotesStore(readNotesStore()),
  });
}

function getStudyItemsServerSnapshot(): string {
  return JSON.stringify({
    bookmarks: serializeBookmarksStore(createBookmarksStore()),
    notes: serializeNotesStore(createNotesStore()),
  });
}

function readBookmarksStore(): BookmarksStore {
  if (typeof window === "undefined") {
    return fallbackBookmarksStore ?? createBookmarksStore();
  }

  try {
    const store = parseBookmarksStore(
      window.localStorage.getItem(BOOKMARKS_STORAGE_KEY),
    );
    fallbackBookmarksStore = store;
    return store;
  } catch {
    return fallbackBookmarksStore ?? createBookmarksStore();
  }
}

function readNotesStore(): NotesStore {
  if (typeof window === "undefined") {
    return fallbackNotesStore ?? createNotesStore();
  }

  try {
    const store = parseNotesStore(window.localStorage.getItem(NOTES_STORAGE_KEY));
    fallbackNotesStore = store;
    return store;
  } catch {
    return fallbackNotesStore ?? createNotesStore();
  }
}

function writeBookmarksStore(store: BookmarksStore) {
  const next = parseBookmarksStore(serializeBookmarksStore(store));
  fallbackBookmarksStore = next;
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      serializeBookmarksStore(next),
    );
  } catch {
    // LocalStorage が使えない環境では、その場の state だけで扱う。
  }
}

function writeNotesStore(store: NotesStore) {
  const next = parseNotesStore(serializeNotesStore(store));
  fallbackNotesStore = next;
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, serializeNotesStore(next));
  } catch {
    // LocalStorage が使えない環境では、その場の state だけで扱う。
  }
}

function notifyStudyItemsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDY_ITEMS_UPDATED_EVENT));
}
