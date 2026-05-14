import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import type { Question } from "@/lib/questions";
import { isScorableQuestion } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { classifyAnswerDuration } from "./recommendation";
import { getAiThemeCluster } from "./theme-cluster";

export type AiCoachSessionAnalysis = {
  status: "ready" | "collecting";
  clusterId: string | null;
  clusterLabel: string | null;
  message: string;
  actionHref: string | null;
  actionLabel: string | null;
};

type ClusterSummary = {
  id: string;
  label: string;
  total: number;
  correct: number;
  incorrect: number;
  fastIncorrect: number;
  highConfidenceIncorrect: number;
  deliberateCorrect: number;
  score: number;
};

export function analyzeAiCoachSession(
  questions: readonly Question[],
  judgements: Readonly<Record<string, AnswerJudgement | undefined>>,
  entries: readonly AnswerHistoryEntry[],
): AiCoachSessionAnalysis {
  const latest = getLatestEntryByQuestionId(entries);
  const summaries = new Map<string, ClusterSummary>();

  for (const question of questions) {
    if (!isScorableQuestion(question)) continue;
    const judgement = judgements[question.id];
    if (!judgement || judgement === "no_answer") continue;

    const cluster = getAiThemeCluster(question);
    const summary = summaries.get(cluster.id) ?? {
      id: cluster.id,
      label: cluster.label,
      total: 0,
      correct: 0,
      incorrect: 0,
      fastIncorrect: 0,
      highConfidenceIncorrect: 0,
      deliberateCorrect: 0,
      score: 0,
    };
    const entry = latest.get(question.id);
    const duration = classifyAnswerDuration(entry?.durationMs);
    summary.total += 1;

    if (judgement === "incorrect") {
      summary.incorrect += 1;
      summary.score += 100;
      if (duration === "fast") {
        summary.fastIncorrect += 1;
        summary.score += 35;
      }
      if (entry?.confidence === "high") {
        summary.highConfidenceIncorrect += 1;
        summary.score += 45;
      }
    } else {
      summary.correct += 1;
      summary.score += 8;
      if (duration === "deliberate") {
        summary.deliberateCorrect += 1;
        summary.score += 30;
      }
    }
    summaries.set(cluster.id, summary);
  }

  const selected = [...summaries.values()].sort(compareSummary)[0];
  if (!selected) {
    return {
      status: "collecting",
      clusterId: null,
      clusterLabel: null,
      message:
        "まだ分析材料を集めている段階です。数問解くと、AIコーチの提案が具体的になります。",
      actionHref: "/study/unanswered?count=3",
      actionLabel: "未回答から3問解く",
    };
  }

  return {
    status: "ready",
    clusterId: selected.id,
    clusterLabel: selected.label,
    message: buildAnalysisMessage(selected),
    actionHref: `/study/ai-theme/${encodeURIComponent(selected.id)}?count=3`,
    actionLabel: "このテーマを3問だけ確認",
  };
}

function compareSummary(a: ClusterSummary, b: ClusterSummary): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.incorrect !== b.incorrect) return b.incorrect - a.incorrect;
  if (a.total !== b.total) return b.total - a.total;
  return a.label.localeCompare(b.label, "ja");
}

function buildAnalysisMessage(summary: ClusterSummary): string {
  if (summary.highConfidenceIncorrect > 0) {
    return `今回の解答では「${summary.label}」に、自信があったミスが含まれています。覚え違いが残っていないか、似た問題で確認しておくと安定しそうです。`;
  }
  if (summary.fastIncorrect > 0) {
    return `今回の解答では「${summary.label}」で、少し急いだミスが出ています。似た問題を少し確認して、問題文の条件を拾う流れを整えましょう。`;
  }
  if (summary.incorrect > 0) {
    return `今回の解答では「${summary.label}」に確認しておきたい点があります。似た問題を3問だけ解いて、判断の流れを整理しましょう。`;
  }
  if (summary.deliberateCorrect > 0) {
    return `「${summary.label}」は正解できていますが、少し時間をかけて判断した問題があります。短く確認しておくと、次はもっと安定しそうです。`;
  }
  return `今回の解答は安定しています。「${summary.label}」を短く確認して、取れているテーマをそのまま固めておきましょう。`;
}
