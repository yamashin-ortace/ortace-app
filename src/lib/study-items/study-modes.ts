import type { BookmarkCategory } from ".";

/**
 * 学習タブの「ブックマーク・ノートから出題」セクションに並ぶ追加モード。
 * 既存の「演習モード」より控えめな見せ方にする想定で、ID／表示名／導線をここで一元管理する。
 */
export type BookmarkStudyMode =
  | {
      id: "unknown" | "weak" | "memorize" | "class_note";
      kind: "bookmark";
      category: BookmarkCategory;
      label: string;
      summary: string;
      href: string;
    }
  | {
      id: "notes";
      kind: "notes";
      label: string;
      summary: string;
      href: string;
    };

export const BOOKMARK_STUDY_MODES: readonly BookmarkStudyMode[] = [
  {
    id: "unknown",
    kind: "bookmark",
    category: "unknown",
    label: "「わかんない」を解消",
    summary: "わかんないマーク済みを集中復習。わかったらマークを外して終わらせる。",
    href: "/study/bookmark/unknown",
  },
  {
    id: "weak",
    kind: "bookmark",
    category: "weak",
    label: "「ニガテ」を集中演習",
    summary: "ニガテマーク済みだけを出題。出題範囲が狭くて回しやすい。",
    href: "/study/bookmark/weak",
  },
  {
    id: "memorize",
    kind: "bookmark",
    category: "memorize",
    label: "暗記リスト確認テスト",
    summary: "覚えるマーク済みをランダム出題。短期記憶の定着を確認できる。",
    href: "/study/bookmark/memorize",
  },
  {
    id: "class_note",
    kind: "bookmark",
    category: "class_note",
    label: "授業メモ問題集",
    summary: "授業メモマーク済みを順に解く。ゼミ・授業前の予習に。",
    href: "/study/bookmark/class_note",
  },
  {
    id: "notes",
    kind: "notes",
    label: "ノート付き問題の総復習",
    summary: "自分で書いたノートを読みながら解く。試験前の総まとめ用。",
    href: "/study/notes",
  },
];

export function isBookmarkCategoryId(value: string): value is BookmarkCategory {
  return (
    value === "unknown" ||
    value === "weak" ||
    value === "memorize" ||
    value === "class_note"
  );
}

export function getBookmarkStudyMode(
  id: BookmarkStudyMode["id"],
): BookmarkStudyMode | undefined {
  return BOOKMARK_STUDY_MODES.find((m) => m.id === id);
}
