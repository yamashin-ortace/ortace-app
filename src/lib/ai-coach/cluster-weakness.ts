import type { AnswerHistoryEntry } from "@/lib/answer-history";

export type ClusterWeaknessRow = {
  clusterId: string;
  clusterLabel: string;
  judged: number;
  correct: number;
  accuracy: number;
};

export type QuestionClusterLookup = {
  /** 問題ID → AIテーマクラスタID */
  byId: Map<string, { id: string; label: string }>;
};

export type ClusterWeaknessOptions = {
  /** 集計に含めるための最低判定数（無回答を除く解答数）。既定 3。 */
  minJudged?: number;
  /** 上位何件まで返すか。既定 5。 */
  topN?: number;
};

/**
 * AIテーマクラスタごとの正答率を計算し、低いものから返す。
 * 「判定数が少ない（minJudged 未満）」クラスタは安定値が出ないため除外。
 */
export function analyzeClusterWeakness(
  entries: readonly AnswerHistoryEntry[],
  lookup: QuestionClusterLookup,
  options: ClusterWeaknessOptions = {},
): ClusterWeaknessRow[] {
  const minJudged = options.minJudged ?? 3;
  const topN = options.topN ?? 5;

  const stats = new Map<
    string,
    { label: string; judged: number; correct: number }
  >();

  for (const entry of entries) {
    if (entry.result === "no_answer") continue;
    const meta = lookup.byId.get(entry.id);
    if (!meta) continue;
    const current = stats.get(meta.id) ?? {
      label: meta.label,
      judged: 0,
      correct: 0,
    };
    current.judged += 1;
    if (entry.result === "correct") current.correct += 1;
    stats.set(meta.id, current);
  }

  const rows: ClusterWeaknessRow[] = [];
  for (const [clusterId, s] of stats.entries()) {
    if (s.judged < minJudged) continue;
    rows.push({
      clusterId,
      clusterLabel: s.label,
      judged: s.judged,
      correct: s.correct,
      accuracy: Math.round((s.correct / s.judged) * 100),
    });
  }

  return rows
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      // 正答率同点なら、判定数が多い方を優先（精度が高い）
      if (a.judged !== b.judged) return b.judged - a.judged;
      return a.clusterLabel.localeCompare(b.clusterLabel, "ja");
    })
    .slice(0, topN);
}
