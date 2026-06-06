import {
  isCarelessAnswer,
  isConfidentAnswer,
  isUncertainAnswer,
  type AnswerHistoryEntry,
} from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import {
  analyzeClusterWeakness,
  type QuestionClusterLookup,
} from "./cluster-weakness";

export type HomeAiCoachFocusReason =
  | "weak_cluster"
  | "misconception"
  | "knowledge_gap"
  | "condition_check";

export type HomeAiCoachFocus = {
  clusterId: string;
  clusterLabel: string;
  reason: HomeAiCoachFocusReason;
  evidenceCount: number;
};

type FocusScore = {
  clusterId: string;
  clusterLabel: string;
  score: number;
  highConfidenceIncorrect: number;
  deliberateIncorrect: number;
  fastIncorrect: number;
  uncertainIncorrect: number;
  incorrect: number;
};

const RECENT_DAYS = 7;

export function pickHomeAiCoachFocus(
  entries: readonly AnswerHistoryEntry[],
  lookup: QuestionClusterLookup,
  now: Date = new Date(),
): HomeAiCoachFocus | null {
  const latest = getLatestEntryByQuestionId(entries);
  const recentThreshold = now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const scores = new Map<string, FocusScore>();

  for (const entry of latest.values()) {
    if (entry.result !== "incorrect") continue;
    const answeredAt = new Date(entry.answeredAt).getTime();
    if (!Number.isFinite(answeredAt) || answeredAt < recentThreshold) continue;

    const cluster = lookup.byId.get(entry.id);
    if (!cluster) continue;

    const current = scores.get(cluster.id) ?? {
      clusterId: cluster.id,
      clusterLabel: cluster.label,
      score: 0,
      highConfidenceIncorrect: 0,
      deliberateIncorrect: 0,
      fastIncorrect: 0,
      uncertainIncorrect: 0,
      incorrect: 0,
    };

    current.incorrect += 1;
    current.score += 100;

    if (isConfidentAnswer(entry)) {
      current.highConfidenceIncorrect += 1;
      current.score += 55;
    } else if (isUncertainAnswer(entry)) {
      current.uncertainIncorrect += 1;
      current.score += 20;
    }

    if (isDeliberate(entry.durationMs)) {
      current.deliberateIncorrect += 1;
      current.score += 45;
    } else if (isFast(entry.durationMs) && !isCarelessAnswer(entry)) {
      current.fastIncorrect += 1;
      current.score += 14;
    }

    scores.set(cluster.id, current);
  }

  for (const weak of analyzeClusterWeakness(entries, lookup, {
    minJudged: 5,
    topN: 3,
  })) {
    if (weak.accuracy >= 65) continue;

    const current = scores.get(weak.clusterId) ?? {
      clusterId: weak.clusterId,
      clusterLabel: weak.clusterLabel,
      score: 0,
      highConfidenceIncorrect: 0,
      deliberateIncorrect: 0,
      fastIncorrect: 0,
      uncertainIncorrect: 0,
      incorrect: 0,
    };
    current.score += (65 - weak.accuracy) * 3 + Math.min(weak.judged, 12);
    scores.set(weak.clusterId, current);
  }

  const top = [...scores.values()].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.incorrect !== b.incorrect) return b.incorrect - a.incorrect;
    return a.clusterLabel.localeCompare(b.clusterLabel, "ja");
  })[0];

  if (!top || top.score < 40) return null;

  return {
    clusterId: top.clusterId,
    clusterLabel: top.clusterLabel,
    reason: getFocusReason(top),
    evidenceCount: getEvidenceCount(top),
  };
}

function getFocusReason(score: FocusScore): HomeAiCoachFocusReason {
  if (score.highConfidenceIncorrect > 0) return "misconception";
  if (score.deliberateIncorrect > 0) return "knowledge_gap";
  if (score.incorrect > 0 && score.fastIncorrect >= score.incorrect) {
    return "condition_check";
  }
  return "weak_cluster";
}

function getEvidenceCount(score: FocusScore): number {
  if (score.highConfidenceIncorrect > 0) return score.highConfidenceIncorrect;
  if (score.deliberateIncorrect > 0) return score.deliberateIncorrect;
  if (score.fastIncorrect > 0) return score.fastIncorrect;
  if (score.uncertainIncorrect > 0) return score.uncertainIncorrect;
  return score.incorrect;
}

function isFast(durationMs: number | null | undefined): boolean {
  return typeof durationMs === "number" && durationMs < 15_000;
}

function isDeliberate(durationMs: number | null | undefined): boolean {
  return typeof durationMs === "number" && durationMs >= 60_000;
}
