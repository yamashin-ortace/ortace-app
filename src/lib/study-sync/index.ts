import {
  parseAnswerHistoryStore,
  serializeAnswerHistoryStore,
  type AnswerHistoryEntry,
  type AnswerHistoryStore,
} from "@/lib/answer-history";
import {
  DAILY_LIMIT,
  normalizeDailyLimitRecord,
  type DailyLimitRecord,
} from "@/lib/daily-limit";
import {
  BOOKMARK_CATEGORIES,
  normalizeBookmarksStore,
  normalizeNotesStore,
  type BookmarkCategory,
  type BookmarksStore,
  type NotesStore,
} from "@/lib/study-items";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AnswerHistoryInsert,
  AnswerHistoryRow,
  BookmarksInsert,
  BookmarksRow,
  DailyLimitsRow,
  NotesInsert,
  NotesRow,
} from "@/lib/supabase/database.types";

const ANSWER_HISTORY_DISPLAY_LIMIT = 10_000;
const BOOKMARK_CATEGORY_IDS = BOOKMARK_CATEGORIES.map((category) => category.id);

export function mergeDailyLimitRecords(
  local: DailyLimitRecord,
  remote: DailyLimitsRow | null,
): DailyLimitRecord {
  if (!remote) return normalizeDailyLimitRecord(local, local.date);

  const localRecord = normalizeDailyLimitRecord(local, local.date);
  if (remote.date !== localRecord.date) return localRecord;

  return {
    date: localRecord.date,
    count: Math.min(
      DAILY_LIMIT,
      Math.max(localRecord.count, Math.floor(remote.count)),
    ),
  };
}

export function mergeBookmarksStores(
  local: BookmarksStore,
  remoteRows: BookmarksRow[],
): BookmarksStore {
  const localStore = normalizeBookmarksStore(local);
  const items = { ...localStore.items };

  for (const row of remoteRows) {
    const remoteStore = normalizeBookmarksStore({
      version: 1,
      items: {
        [row.question_id]: {
          addedAt: row.added_at,
          categories: row.categories,
        },
      },
    });
    const remote = remoteStore.items[row.question_id];
    if (!remote) continue;

    const localEntry = items[row.question_id];
    if (!localEntry) {
      items[row.question_id] = remote;
      continue;
    }

    items[row.question_id] = {
      addedAt:
        localEntry.addedAt.localeCompare(remote.addedAt) <= 0
          ? localEntry.addedAt
          : remote.addedAt,
      categories: mergeBookmarkCategories(
        localEntry.categories,
        remote.categories,
      ),
    };
  }

  return normalizeBookmarksStore({ version: 1, items });
}

export function mergeNotesStores(
  local: NotesStore,
  remoteRows: NotesRow[],
): NotesStore {
  const localStore = normalizeNotesStore(local);
  const items = { ...localStore.items };

  for (const row of remoteRows) {
    const remoteStore = normalizeNotesStore({
      version: 1,
      items: {
        [row.question_id]: {
          text: row.text,
          updatedAt: row.updated_at,
        },
      },
    });
    const remote = remoteStore.items[row.question_id];
    if (!remote) continue;

    const localEntry = items[row.question_id];
    if (!localEntry || remote.updatedAt.localeCompare(localEntry.updatedAt) > 0) {
      items[row.question_id] = remote;
    }
  }

  return normalizeNotesStore({ version: 1, items });
}

export function mergeAnswerHistoryStores(
  local: AnswerHistoryStore,
  remoteRows: AnswerHistoryRow[],
): AnswerHistoryStore {
  const localStore = parseAnswerHistoryStore(serializeAnswerHistoryStore(local));
  const entriesByKey = new Map<string, AnswerHistoryEntry>();

  for (const entry of localStore.entries) {
    entriesByKey.set(createAnswerHistoryEntryKey(entry), entry);
  }
  for (const row of remoteRows) {
    const entry = answerHistoryRowToEntry(row);
    if (!entry) continue;
    entriesByKey.set(createAnswerHistoryEntryKey(entry), entry);
  }

  return parseAnswerHistoryStore(
    JSON.stringify({
      version: 1,
      entries: [...entriesByKey.values()]
        .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
        .slice(0, ANSWER_HISTORY_DISPLAY_LIMIT),
    }),
  );
}

export function createAnswerHistoryEntryKey(entry: AnswerHistoryEntry): string {
  return [
    entry.id,
    entry.answeredAt,
    entry.result,
    entry.selectedAnswers.join(","),
  ].join("|");
}

export async function syncDailyLimitWithDatabase(
  local: DailyLimitRecord,
): Promise<DailyLimitRecord | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("daily_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("date", local.date)
    .maybeSingle();

  if (error) return null;

  const merged = mergeDailyLimitRecords(local, data);
  await supabase.from("daily_limits").upsert(
    {
      user_id: userId,
      date: merged.date,
      count: merged.count,
    },
    { onConflict: "user_id,date" },
  );

  return merged;
}

export async function pushDailyLimitToDatabase(
  record: DailyLimitRecord,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const normalized = normalizeDailyLimitRecord(record, record.date);
  const supabase = createSupabaseBrowserClient();
  await supabase.from("daily_limits").upsert(
    {
      user_id: userId,
      date: normalized.date,
      count: normalized.count,
    },
    { onConflict: "user_id,date" },
  );
}

export async function syncStudyItemsWithDatabase(
  localBookmarks: BookmarksStore,
  localNotes: NotesStore,
): Promise<{ bookmarks: BookmarksStore; notes: NotesStore } | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = createSupabaseBrowserClient();
  const [{ data: bookmarkRows, error: bookmarksError }, { data: noteRows, error: notesError }] =
    await Promise.all([
      supabase.from("bookmarks").select("*").eq("user_id", userId),
      supabase.from("notes").select("*").eq("user_id", userId),
    ]);

  if (bookmarksError || notesError) return null;

  const mergedBookmarks = mergeBookmarksStores(localBookmarks, bookmarkRows ?? []);
  const mergedNotes = mergeNotesStores(localNotes, noteRows ?? []);

  const bookmarkPayload = bookmarksStoreToRows(userId, mergedBookmarks);
  const notePayload = notesStoreToRows(userId, mergedNotes);

  await Promise.all([
    bookmarkPayload.length > 0
      ? supabase
          .from("bookmarks")
          .upsert(bookmarkPayload, { onConflict: "user_id,question_id" })
      : Promise.resolve(),
    notePayload.length > 0
      ? supabase.from("notes").upsert(notePayload, {
          onConflict: "user_id,question_id",
        })
      : Promise.resolve(),
  ]);

  return { bookmarks: mergedBookmarks, notes: mergedNotes };
}

export async function pushBookmarkToDatabase(
  questionId: string,
  store: BookmarksStore,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const entry = normalizeBookmarksStore(store).items[questionId];
  const supabase = createSupabaseBrowserClient();
  if (!entry) {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
    return;
  }

  await supabase.from("bookmarks").upsert(
    {
      user_id: userId,
      question_id: questionId,
      categories: entry.categories,
      added_at: entry.addedAt,
    },
    { onConflict: "user_id,question_id" },
  );
}

export async function pushNoteToDatabase(
  questionId: string,
  store: NotesStore,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const entry = normalizeNotesStore(store).items[questionId];
  const supabase = createSupabaseBrowserClient();
  if (!entry) {
    await supabase
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
    return;
  }

  await supabase.from("notes").upsert(
    {
      user_id: userId,
      question_id: questionId,
      text: entry.text,
      updated_at: entry.updatedAt,
    },
    { onConflict: "user_id,question_id" },
  );
}

export async function syncAnswerHistoryWithDatabase(
  local: AnswerHistoryStore,
): Promise<AnswerHistoryStore | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = createSupabaseBrowserClient();
  const localStore = parseAnswerHistoryStore(serializeAnswerHistoryStore(local));
  const allLocalRows = localStore.entries.map((entry) =>
    answerHistoryEntryToRow(userId, entry),
  );
  // DBスキーマの CHECK 制約に違反する古い・壊れたエントリで upsert 全体が
  // 失敗するのを避けるため、事前にバリデートして弾く。弾かれたものは
  // ローカルには残しつつ、DB には送らない（次回までに状況改善することを期待）。
  const localRows = allLocalRows.filter(isValidAnswerHistoryRow);
  const skippedCount = allLocalRows.length - localRows.length;
  if (skippedCount > 0 && typeof window !== "undefined") {
    console.warn(
      `[answer-history sync] ${skippedCount}件のエントリをスキップしました（DBスキーマ違反）`,
    );
  }

  // 大量エントリでもエラーで全件失敗しないよう、200件ずつにチャンク化する。
  for (let i = 0; i < localRows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = localRows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error: pushError } = await supabase
      .from("answer_history")
      .upsert(chunk, { onConflict: "user_id,entry_key" });
    if (pushError && typeof window !== "undefined") {
        console.warn(
        `[answer-history sync] チャンク${i / UPSERT_CHUNK_SIZE + 1}のpushに失敗: ${pushError.message}`,
      );
    }
  }

  const { data, error } = await supabase
    .from("answer_history")
    .select("*")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false })
    .limit(ANSWER_HISTORY_DISPLAY_LIMIT);

  if (error) return null;

  return mergeAnswerHistoryStores(localStore, data ?? []);
}

const UPSERT_CHUNK_SIZE = 200;

/**
 * DB スキーマ（0002_study_sync.sql の answer_history テーブル）に定義された
 * CHECK 制約に合致するかを判定する。1件でも違反すると Postgres は upsert
 * 全体を失敗させるため、事前に弾く必要がある。
 */
function isValidAnswerHistoryRow(row: AnswerHistoryInsert): boolean {
  if (!/^[0-9]{2}-[0-9]{1,3}$/.test(row.question_id)) return false;
  if (!["correct", "incorrect", "no_answer"].includes(row.result)) return false;
  if (!Array.isArray(row.selected_answers)) return false;
  for (const sel of row.selected_answers) {
    if (!["1", "2", "3", "4", "5"].includes(sel)) return false;
  }
  if (row.round < 47 || row.round > 56) return false;
  if (row.session !== "am" && row.session !== "pm") return false;
  if (row.display_number < 1 || row.display_number > 75) return false;
  return true;
}

export async function pushAnswerHistoryEntryToDatabase(
  entry: AnswerHistoryEntry,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createSupabaseBrowserClient();
  await supabase
    .from("answer_history")
    .upsert(answerHistoryEntryToRow(userId, entry), {
      onConflict: "user_id,entry_key",
    });
}

async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function mergeBookmarkCategories(
  a: readonly BookmarkCategory[],
  b: readonly BookmarkCategory[],
): BookmarkCategory[] {
  const set = new Set<BookmarkCategory>([...a, ...b]);
  return BOOKMARK_CATEGORY_IDS.filter((id) => set.has(id));
}

function bookmarksStoreToRows(
  userId: string,
  store: BookmarksStore,
): BookmarksInsert[] {
  return Object.entries(normalizeBookmarksStore(store).items).map(
    ([questionId, entry]) => ({
      user_id: userId,
      question_id: questionId,
      categories: entry.categories,
      added_at: entry.addedAt,
    }),
  );
}

function notesStoreToRows(userId: string, store: NotesStore): NotesInsert[] {
  return Object.entries(normalizeNotesStore(store).items).map(
    ([questionId, entry]) => ({
      user_id: userId,
      question_id: questionId,
      text: entry.text,
      updated_at: entry.updatedAt,
    }),
  );
}

function answerHistoryEntryToRow(
  userId: string,
  entry: AnswerHistoryEntry,
): AnswerHistoryInsert {
  return {
    user_id: userId,
    entry_key: createAnswerHistoryEntryKey(entry),
    question_id: entry.id,
    answered_at: entry.answeredAt,
    result: entry.result,
    selected_answers: entry.selectedAnswers,
    round: entry.round,
    session: entry.session,
    display_number: entry.displayNumber,
    major_category: entry.majorCategory,
  };
}

function answerHistoryRowToEntry(row: AnswerHistoryRow): AnswerHistoryEntry | null {
  const store = parseAnswerHistoryStore(
    JSON.stringify({
      version: 1,
      entries: [
        {
          id: row.question_id,
          answeredAt: row.answered_at,
          result: row.result,
          selectedAnswers: row.selected_answers,
          round: row.round,
          session: row.session,
          displayNumber: row.display_number,
          majorCategory: row.major_category,
        },
      ],
    }),
  );

  return store.entries[0] ?? null;
}
