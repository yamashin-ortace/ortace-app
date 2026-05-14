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
import {
  parseStudyGoalConfig,
  serializeStudyGoalConfig,
  type StudyGoalConfig,
} from "@/lib/study-goal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AnswerHistoryInsert,
  AnswerHistoryRow,
  BookmarksInsert,
  BookmarksRow,
  Json,
  DailyLimitsRow,
  NotesInsert,
  NotesRow,
  StudyGoalSettingsRow,
} from "@/lib/supabase/database.types";

const ANSWER_HISTORY_DISPLAY_LIMIT = 10_000;
const BOOKMARK_CATEGORY_IDS = BOOKMARK_CATEGORIES.map((category) => category.id);

export type StudyGoalConfigRecord = {
  config: StudyGoalConfig;
  updatedAt: string | null;
};

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
  const afterLocalSize = entriesByKey.size;

  let nullCount = 0;
  // 重要：remote 行は DB が unique に保存している `entry_key` をそのまま
  // map のキーに使う。recompute すると行間で衝突が発生（1050→525のように
  // half collapse）する事例が観測されたため。
  // local 側は createAnswerHistoryEntryKey の値をキーに継続使用。push 時に
  // 同じロジックで entry_key を生成して DB に保存しているので、自分由来の
  // remote 行は同じキーで上書きされる。
  for (const row of remoteRows) {
    const entry = answerHistoryRowToEntry(row);
    if (!entry) {
      nullCount += 1;
      continue;
    }
    entriesByKey.set(row.entry_key, entry);
  }
  const afterRemoteSize = entriesByKey.size;

  if (typeof window !== "undefined") {
    console.info(
      `[answer-history merge] local→map: ${afterLocalSize} / 最終 map size: ${afterRemoteSize}（remote ${remoteRows.length}件 中 ${nullCount}件 null）`,
    );
  }

  // 注意：ここで parseAnswerHistoryStore を再度通すと、relax した
  // answerHistoryRowToEntry で受け取った行が isAnswerHistoryEntry の
  // 厳密チェックで弾き返される可能性がある。merge 結果はそのまま返す。
  const entries = [...entriesByKey.values()]
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, ANSWER_HISTORY_DISPLAY_LIMIT);

  return { version: 1, entries };
}

export function mergeStudyGoalConfigRecord(
  local: StudyGoalConfigRecord,
  remote: StudyGoalSettingsRow | null,
): { record: StudyGoalConfigRecord; shouldPush: boolean } {
  if (!remote) {
    return { record: local, shouldPush: true };
  }

  if (local.updatedAt && local.updatedAt.localeCompare(remote.updated_at) > 0) {
    return { record: local, shouldPush: true };
  }

  return {
    record: {
      config: parseStudyGoalConfig(JSON.stringify(remote.config)),
      updatedAt: remote.updated_at,
    },
    shouldPush: false,
  };
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

export async function syncStudyGoalConfigWithDatabase(
  local: StudyGoalConfigRecord,
): Promise<StudyGoalConfigRecord | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_goal_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;

  const merged = mergeStudyGoalConfigRecord(local, data);
  if (!merged.shouldPush) return merged.record;

  const updatedAt = merged.record.updatedAt ?? new Date().toISOString();
  const record = { ...merged.record, updatedAt };
  await pushStudyGoalConfigToDatabase(record);
  return record;
}

export async function pushStudyGoalConfigToDatabase(
  record: StudyGoalConfigRecord,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createSupabaseBrowserClient();
  await supabase.from("study_goal_settings").upsert(
    {
      user_id: userId,
      config: studyGoalConfigToJson(record.config),
      updated_at: record.updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "user_id" },
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
  // PostgREST / Supabase の1リクエスト当たり最大1000件制限を超えて取るために
  // ページネーションで取得する。
  const PAGE_SIZE = 1000;
  const fetchedRows: AnswerHistoryRow[] = [];
  let pageFrom = 0;
  while (fetchedRows.length < ANSWER_HISTORY_DISPLAY_LIMIT) {
    const pageTo = Math.min(
      pageFrom + PAGE_SIZE - 1,
      ANSWER_HISTORY_DISPLAY_LIMIT - 1,
    );
    const { data, error } = await supabase
      .from("answer_history")
      .select("*")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false })
      .range(pageFrom, pageTo);
    if (error) {
      if (typeof window !== "undefined") {
        console.warn(
          `[answer-history sync] fetch失敗 (range ${pageFrom}-${pageTo}): ${error.message}`,
        );
      }
      return null;
    }
    if (!data || data.length === 0) break;
    fetchedRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    pageFrom += PAGE_SIZE;
  }
  const merged = mergeAnswerHistoryStores(localStore, fetchedRows);

  if (typeof window !== "undefined") {
    console.info(
      `[answer-history sync] push成功 ${successCount} / push失敗 ${failureCount} / DB fetch ${fetchedRows.length}件 / merge後 ${merged.entries.length}件（ローカル ${localRows.length}件）`,
    );
  }

  return merged;
}

const UPSERT_CHUNK_SIZE = 50;

export async function pushAnswerHistoryEntryToDatabase(
  entry: AnswerHistoryEntry,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("answer_history")
    .upsert(answerHistoryEntryToRow(userId, entry), {
      onConflict: "user_id,entry_key",
    });
  if (error) {
    if (typeof window !== "undefined") {
      console.warn(
        `[answer-history sync] 単発pushに失敗: ${error.message}`,
        entry,
      );
    }
    return false;
  }
  return true;
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

function studyGoalConfigToJson(config: StudyGoalConfig): Json {
  return JSON.parse(serializeStudyGoalConfig(config)) as Json;
}

function answerHistoryRowToEntry(row: AnswerHistoryRow): AnswerHistoryEntry | null {
  // DB CHECK 制約を通過して保存されているデータなので、ここでは強い検証を
  // かけず、最低限の必須フィールド（id / answered_at）のみ確認する。
  // 過剰な検証で正当なDB行を弾いてしまうと merge から落ちて他端末で
  // データが揃わなくなる。
  if (typeof row.question_id !== "string" || row.question_id === "") return null;
  if (typeof row.answered_at !== "string" || row.answered_at === "") return null;

  return {
    id: row.question_id,
    answeredAt: row.answered_at,
    result: (row.result === "correct" ||
    row.result === "incorrect" ||
    row.result === "no_answer"
      ? row.result
      : "no_answer") as AnswerHistoryEntry["result"],
    selectedAnswers: (Array.isArray(row.selected_answers)
      ? row.selected_answers.filter(
          (v): v is AnswerHistoryEntry["selectedAnswers"][number] =>
            v === "1" || v === "2" || v === "3" || v === "4" || v === "5",
        )
      : []) as AnswerHistoryEntry["selectedAnswers"],
    round: (typeof row.round === "number"
      ? row.round
      : 47) as AnswerHistoryEntry["round"],
    session: (row.session === "am" || row.session === "pm"
      ? row.session
      : "am") as AnswerHistoryEntry["session"],
    displayNumber: typeof row.display_number === "number" ? row.display_number : 1,
    majorCategory:
      typeof row.major_category === "string" ? row.major_category : "",
  };
}
