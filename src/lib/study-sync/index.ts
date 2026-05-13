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
  const localRows = localStore.entries.map((entry) =>
    answerHistoryEntryToRow(userId, entry),
  );

  // 50件ずつチャンク化して push。チャンク失敗時は単発upsertにフォールバックして、
  // 1件の問題行が他49件を巻き込まないようにする。エラー詳細は console に出す。
  let successCount = 0;
  let failureCount = 0;
  for (let i = 0; i < localRows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = localRows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error: pushError } = await supabase
      .from("answer_history")
      .upsert(chunk, { onConflict: "user_id,entry_key" });
    if (!pushError) {
      successCount += chunk.length;
      continue;
    }

    if (typeof window !== "undefined") {
      console.warn(
        `[answer-history sync] チャンク${i / UPSERT_CHUNK_SIZE + 1}(${chunk.length}件)のpushに失敗: ${pushError.message}。単発にフォールバックします。`,
      );
    }
    for (const row of chunk) {
      const { error: singleError } = await supabase
        .from("answer_history")
        .upsert(row, { onConflict: "user_id,entry_key" });
      if (singleError) {
        failureCount += 1;
        if (typeof window !== "undefined") {
          console.warn(
            `[answer-history sync] 単発pushに失敗: ${singleError.message} / row=`,
            row,
          );
        }
      } else {
        successCount += 1;
      }
    }
  }
  if (typeof window !== "undefined" && (localRows.length > 0 || failureCount > 0)) {
    console.info(
      `[answer-history sync] push完了: 成功 ${successCount} / 失敗 ${failureCount}（ローカル合計 ${localRows.length}件）`,
    );
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

const UPSERT_CHUNK_SIZE = 50;

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
