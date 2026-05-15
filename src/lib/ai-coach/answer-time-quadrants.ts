import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { classifyAnswerDuration } from "./recommendation";

export type QuadrantId =
  | "correct-fast"
  | "correct-deliberate"
  | "incorrect-fast"
  | "incorrect-deliberate";

export type AnswerTimeQuadrant = {
  id: QuadrantId;
  label: string;
  description: string;
  count: number;
};

export type AnswerTimeQuadrantSummary = {
  quadrants: AnswerTimeQuadrant[];
  /** 4象限のいずれにも属さない（解答時間が「標準」だった）件数 */
  standardCount: number;
  /** 正答なし（無回答）件数 */
  noAnswerCount: number;
  /** 解答時間が記録されていなかった件数 */
  unknownCount: number;
};

/**
 * 解答履歴を「正誤 × 解答時間（速い/じっくり）」の4象限に分けて集計する。
 * 「標準」と「無回答」「解答時間未記録」は4象限から外して別カウント。
 */
export function analyzeAnswerTimeQuadrants(
  entries: readonly AnswerHistoryEntry[],
): AnswerTimeQuadrantSummary {
  const counts: Record<QuadrantId, number> = {
    "correct-fast": 0,
    "correct-deliberate": 0,
    "incorrect-fast": 0,
    "incorrect-deliberate": 0,
  };
  let standardCount = 0;
  let noAnswerCount = 0;
  let unknownCount = 0;

  for (const entry of entries) {
    if (entry.result === "no_answer") {
      noAnswerCount += 1;
      continue;
    }
    const bucket = classifyAnswerDuration(entry.durationMs);
    if (bucket === null) {
      unknownCount += 1;
      continue;
    }
    if (bucket === "standard") {
      standardCount += 1;
      continue;
    }
    if (entry.result === "correct" && bucket === "fast") counts["correct-fast"] += 1;
    else if (entry.result === "correct" && bucket === "deliberate") counts["correct-deliberate"] += 1;
    else if (entry.result === "incorrect" && bucket === "fast") counts["incorrect-fast"] += 1;
    else if (entry.result === "incorrect" && bucket === "deliberate") counts["incorrect-deliberate"] += 1;
  }

  return {
    quadrants: [
      {
        id: "correct-fast",
        label: "定着",
        description: "正解 × 速い。安定して取れている問題群です。",
        count: counts["correct-fast"],
      },
      {
        id: "correct-deliberate",
        label: "迷いあり",
        description: "正解 × じっくり。取れているが時間がかかっています。",
        count: counts["correct-deliberate"],
      },
      {
        id: "incorrect-fast",
        label: "思い込み",
        description: "不正解 × 速い。読み違い・覚え違いの可能性。",
        count: counts["incorrect-fast"],
      },
      {
        id: "incorrect-deliberate",
        label: "理解不足",
        description: "不正解 × じっくり。知識・理解の整理が必要。",
        count: counts["incorrect-deliberate"],
      },
    ],
    standardCount,
    noAnswerCount,
    unknownCount,
  };
}
