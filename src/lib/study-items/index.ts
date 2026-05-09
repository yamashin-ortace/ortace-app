export const BOOKMARKS_STORAGE_KEY = "ortace.bookmarks";
export const NOTES_STORAGE_KEY = "ortace.notes";

export const BOOKMARK_CATEGORIES = [
  { id: "unknown", label: "わかんない" },
  { id: "weak", label: "ニガテ" },
  { id: "memorize", label: "覚える" },
  { id: "class_note", label: "授業メモ" },
] as const;

export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number]["id"];

export type BookmarkEntry = {
  addedAt: string;
  categories: BookmarkCategory[];
};

export type NoteEntry = {
  text: string;
  updatedAt: string;
};

export type BookmarksStore = {
  version: 1;
  items: Record<string, BookmarkEntry>;
};

export type NotesStore = {
  version: 1;
  items: Record<string, NoteEntry>;
};

export function createBookmarksStore(): BookmarksStore {
  return { version: 1, items: {} };
}

export function createNotesStore(): NotesStore {
  return { version: 1, items: {} };
}

export function normalizeBookmarksStore(value: unknown): BookmarksStore {
  if (!isObject(value) || value.version !== 1 || !isObject(value.items)) {
    return createBookmarksStore();
  }

  const items: Record<string, BookmarkEntry> = {};
  for (const [id, entry] of Object.entries(value.items)) {
    if (!isValidQuestionId(id) || !isObject(entry)) continue;
    const addedAt =
      typeof entry.addedAt === "string" && entry.addedAt
        ? entry.addedAt
        : new Date(0).toISOString();
    const categories = normalizeBookmarkCategories(entry.categories);
    if (categories.length === 0) continue;
    items[id] = { addedAt, categories };
  }
  return { version: 1, items };
}

export function normalizeNotesStore(value: unknown): NotesStore {
  if (!isObject(value) || value.version !== 1 || !isObject(value.items)) {
    return createNotesStore();
  }

  const items: Record<string, NoteEntry> = {};
  for (const [id, entry] of Object.entries(value.items)) {
    if (!isValidQuestionId(id) || !isObject(entry)) continue;
    const text = typeof entry.text === "string" ? entry.text : "";
    if (!text.trim()) continue;
    const updatedAt =
      typeof entry.updatedAt === "string" && entry.updatedAt
        ? entry.updatedAt
        : new Date(0).toISOString();
    items[id] = { text, updatedAt };
  }
  return { version: 1, items };
}

export function parseBookmarksStore(raw: string | null): BookmarksStore {
  if (!raw) return createBookmarksStore();
  try {
    return normalizeBookmarksStore(JSON.parse(raw));
  } catch {
    return createBookmarksStore();
  }
}

export function parseNotesStore(raw: string | null): NotesStore {
  if (!raw) return createNotesStore();
  try {
    return normalizeNotesStore(JSON.parse(raw));
  } catch {
    return createNotesStore();
  }
}

export function serializeBookmarksStore(store: BookmarksStore): string {
  return JSON.stringify(normalizeBookmarksStore(store));
}

export function serializeNotesStore(store: NotesStore): string {
  return JSON.stringify(normalizeNotesStore(store));
}

export function hasBookmark(store: BookmarksStore, questionId: string): boolean {
  return Boolean(store.items[questionId]);
}

export function getBookmarkCategories(
  store: BookmarksStore,
  questionId: string,
): BookmarkCategory[] {
  return normalizeBookmarksStore(store).items[questionId]?.categories ?? [];
}

export function toggleBookmark(
  store: BookmarksStore,
  questionId: string,
  now = new Date(),
): BookmarksStore {
  const current = normalizeBookmarksStore(store);
  const items = { ...current.items };
  if (items[questionId]) {
    delete items[questionId];
    return { version: 1, items };
  }
  if (!isValidQuestionId(questionId)) return current;
  items[questionId] = { addedAt: now.toISOString(), categories: ["unknown"] };
  return { version: 1, items };
}

export function setBookmarkCategories(
  store: BookmarksStore,
  questionId: string,
  categories: readonly BookmarkCategory[],
  now = new Date(),
): BookmarksStore {
  const current = normalizeBookmarksStore(store);
  const items = { ...current.items };
  if (!isValidQuestionId(questionId)) return current;

  const nextCategories = uniqueBookmarkCategories(categories);
  if (nextCategories.length === 0) {
    delete items[questionId];
    return { version: 1, items };
  }

  items[questionId] = {
    addedAt: items[questionId]?.addedAt ?? now.toISOString(),
    categories: nextCategories,
  };
  return { version: 1, items };
}

export function removeBookmark(
  store: BookmarksStore,
  questionId: string,
): BookmarksStore {
  const current = normalizeBookmarksStore(store);
  const items = { ...current.items };
  delete items[questionId];
  return { version: 1, items };
}

export function setNote(
  store: NotesStore,
  questionId: string,
  text: string,
  now = new Date(),
): NotesStore {
  const current = normalizeNotesStore(store);
  const items = { ...current.items };
  if (!isValidQuestionId(questionId)) return current;

  const nextText = text.trim();
  if (!nextText) {
    delete items[questionId];
    return { version: 1, items };
  }

  items[questionId] = {
    text: text,
    updatedAt: now.toISOString(),
  };
  return { version: 1, items };
}

export function removeNote(store: NotesStore, questionId: string): NotesStore {
  const current = normalizeNotesStore(store);
  const items = { ...current.items };
  delete items[questionId];
  return { version: 1, items };
}

export function getSortedBookmarkEntries(store: BookmarksStore) {
  return Object.entries(normalizeBookmarksStore(store).items)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function getSortedNoteEntries(store: NotesStore) {
  return Object.entries(normalizeNotesStore(store).items)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function isValidQuestionId(value: string): boolean {
  return /^\d{2}-\d{1,3}$/.test(value);
}

function normalizeBookmarkCategories(value: unknown): BookmarkCategory[] {
  if (!Array.isArray(value)) return ["unknown"];
  return uniqueBookmarkCategories(value);
}

function uniqueBookmarkCategories(
  value: readonly unknown[],
): BookmarkCategory[] {
  const valid = new Set<BookmarkCategory>();
  for (const item of value) {
    const mapped = mapBookmarkCategory(item);
    if (mapped) valid.add(mapped);
  }
  return BOOKMARK_CATEGORIES.map((category) => category.id).filter((id) =>
    valid.has(id),
  );
}

function isBookmarkCategory(value: unknown): value is BookmarkCategory {
  return (
    typeof value === "string" &&
    BOOKMARK_CATEGORIES.some((category) => category.id === value)
  );
}

function mapBookmarkCategory(value: unknown): BookmarkCategory | null {
  if (isBookmarkCategory(value)) return value;
  if (value === "later" || value === "retry" || value === "research") {
    return "unknown";
  }
  if (value === "important") return "memorize";
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
