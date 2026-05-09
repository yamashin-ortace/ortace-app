import { describe, expect, it } from "vitest";
import {
  createBookmarksStore,
  createNotesStore,
  getBookmarkCategories,
  getSortedBookmarkEntries,
  getSortedNoteEntries,
  hasBookmark,
  normalizeBookmarksStore,
  normalizeNotesStore,
  parseBookmarksStore,
  parseNotesStore,
  removeBookmark,
  removeNote,
  serializeBookmarksStore,
  serializeNotesStore,
  setBookmarkCategories,
  setNote,
  toggleBookmark,
} from ".";

describe("study-items", () => {
  it("ブックマークを追加・解除できる", () => {
    const now = new Date("2026-05-08T00:00:00.000Z");
    const added = toggleBookmark(createBookmarksStore(), "52-101", now);

    expect(hasBookmark(added, "52-101")).toBe(true);
    expect(added.items["52-101"]).toEqual({
      addedAt: now.toISOString(),
      categories: ["unknown"],
    });

    const removed = toggleBookmark(added, "52-101", now);
    expect(hasBookmark(removed, "52-101")).toBe(false);
  });

  it("ブックマーク分類を複数保存できる", () => {
    const now = new Date("2026-05-08T00:00:00.000Z");
    const store = setBookmarkCategories(
      createBookmarksStore(),
      "52-101",
      ["memorize", "weak", "memorize"],
      now,
    );

    expect(getBookmarkCategories(store, "52-101")).toEqual(["weak", "memorize"]);
    expect(store.items["52-101"]).toEqual({
      addedAt: now.toISOString(),
      categories: ["weak", "memorize"],
    });
  });

  it("分類をすべて外すとブックマーク解除になる", () => {
    const added = setBookmarkCategories(createBookmarksStore(), "52-101", [
      "unknown",
    ]);
    const removed = setBookmarkCategories(added, "52-101", []);

    expect(hasBookmark(removed, "52-101")).toBe(false);
  });

  it("ブックマーク削除は存在しないIDでも安全", () => {
    expect(removeBookmark(createBookmarksStore(), "52-101")).toEqual({
      version: 1,
      items: {},
    });
  });

  it("ノートは空白だけなら削除扱い", () => {
    const now = new Date("2026-05-08T00:00:00.000Z");
    const added = setNote(createNotesStore(), "52-1", "覚える", now);
    const removed = setNote(added, "52-1", "   ", now);

    expect(added.items["52-1"]).toEqual({
      text: "覚える",
      updatedAt: now.toISOString(),
    });
    expect(removed.items["52-1"]).toBeUndefined();
  });

  it("ノートを明示的に削除できる", () => {
    const added = setNote(createNotesStore(), "52-1", "メモ");
    expect(removeNote(added, "52-1").items["52-1"]).toBeUndefined();
  });

  it("壊れた保存値は空ストアに戻す", () => {
    expect(parseBookmarksStore("{invalid")).toEqual(createBookmarksStore());
    expect(parseNotesStore("{invalid")).toEqual(createNotesStore());
  });

  it("不正なIDや空ノートを正規化で落とす", () => {
    expect(
      normalizeBookmarksStore({
        version: 1,
        items: {
          "52-1": { addedAt: "2026-05-08T00:00:00.000Z" },
          bad: { addedAt: "2026-05-08T00:00:00.000Z" },
          "52-2": {
            addedAt: "2026-05-08T00:00:00.000Z",
            categories: ["bad"],
          },
        },
      }),
    ).toEqual({
      version: 1,
      items: {
        "52-1": {
          addedAt: "2026-05-08T00:00:00.000Z",
          categories: ["unknown"],
        },
      },
    });

    expect(
      normalizeNotesStore({
        version: 1,
        items: {
          "52-1": { text: "メモ", updatedAt: "2026-05-08T00:00:00.000Z" },
          "52-2": { text: "   ", updatedAt: "2026-05-08T00:00:00.000Z" },
        },
      }),
    ).toEqual({
      version: 1,
      items: {
        "52-1": { text: "メモ", updatedAt: "2026-05-08T00:00:00.000Z" },
      },
    });
  });

  it("一覧は新しい順に並ぶ", () => {
    const bookmarks = normalizeBookmarksStore({
      version: 1,
      items: {
        "52-1": {
          addedAt: "2026-05-07T00:00:00.000Z",
          categories: ["unknown"],
        },
        "52-2": {
          addedAt: "2026-05-08T00:00:00.000Z",
          categories: ["weak"],
        },
      },
    });
    const notes = normalizeNotesStore({
      version: 1,
      items: {
        "52-1": { text: "古い", updatedAt: "2026-05-07T00:00:00.000Z" },
        "52-2": { text: "新しい", updatedAt: "2026-05-08T00:00:00.000Z" },
      },
    });

    expect(getSortedBookmarkEntries(bookmarks).map((item) => item.id)).toEqual([
      "52-2",
      "52-1",
    ]);
    expect(getSortedNoteEntries(notes).map((item) => item.id)).toEqual([
      "52-2",
      "52-1",
    ]);
  });

  it("保存形式を version と items に統一する", () => {
    expect(
      serializeBookmarksStore({
        version: 1,
        items: {
          "52-1": {
            addedAt: "2026-05-08T00:00:00.000Z",
            categories: ["memorize"],
          },
        },
      }),
    ).toBe(
      '{"version":1,"items":{"52-1":{"addedAt":"2026-05-08T00:00:00.000Z","categories":["memorize"]}}}',
    );

    expect(
      serializeNotesStore({
        version: 1,
        items: {
          "52-1": { text: "メモ", updatedAt: "2026-05-08T00:00:00.000Z" },
        },
      }),
    ).toBe(
      '{"version":1,"items":{"52-1":{"text":"メモ","updatedAt":"2026-05-08T00:00:00.000Z"}}}',
    );
  });

  it("旧ブックマーク分類を新しい4タグに読み替える", () => {
    expect(
      normalizeBookmarksStore({
        version: 1,
        items: {
          "52-1": {
            addedAt: "2026-05-08T00:00:00.000Z",
            categories: ["later", "retry", "research", "important", "weak"],
          },
        },
      }).items["52-1"].categories,
    ).toEqual(["unknown", "weak", "memorize"]);
  });
});
