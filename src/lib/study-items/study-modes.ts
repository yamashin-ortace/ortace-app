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
    label: "「わかんない」を解く",
    summary: "記録の「わかんない」に保存した問題を出題。理解できるまで繰り返し挑戦。",
    href: "/study/bookmark/unknown",
  },
  {
    id: "weak",
    kind: "bookmark",
    category: "weak",
    label: "「ニガテ」を解く",
    summary: "記録の「ニガテ」に保存した問題を出題。失点しやすい問題を集中的に克服。",
    href: "/study/bookmark/weak",
  },
  {
    id: "memorize",
    kind: "bookmark",
    category: "memorize",
    label: "「覚える」を解く",
    summary: "記録の「覚える」に保存した問題を出題。暗記事項の定着を確認。",
    href: "/study/bookmark/memorize",
  },
  {
    id: "class_note",
    kind: "bookmark",
    category: "class_note",
    label: "「授業メモ」を解く",
    summary: "記録の「授業メモ」に保存した問題を出題。授業前後の予習・復習に。",
    href: "/study/bookmark/class_note",
  },
  {
    id: "notes",
    kind: "notes",
    label: "「ノート」付きを解く",
    summary: "記録でノートを書いた問題を出題。書いたメモを見返しながら総復習に。",
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
