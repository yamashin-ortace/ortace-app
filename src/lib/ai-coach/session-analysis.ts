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
  details: string[];
  actionHref: string | null;
  actionLabel: string | null;
};

type ClusterSummary = {
  id: string;
  label: string;
  themes: Map<string, number>;
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
      themes: new Map<string, number>(),
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
    const themeLabel = getThemeLabel(question);
    summary.themes.set(themeLabel, (summary.themes.get(themeLabel) ?? 0) + 1);

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
      details: [],
      actionHref: "/study/unanswered?count=3",
      actionLabel: "未回答から3問解く",
    };
  }

  const ranked = [...summaries.values()].sort(compareSummary);
  const questionIds = questions.map((question) => question.id).join(",");
  const focusTheme = getPrimaryTheme(selected);
  return {
    status: "ready",
    clusterId: selected.id,
    clusterLabel: selected.label,
    message: buildAnalysisMessage(selected),
    details: buildAnalysisDetails(ranked, questions.length),
    actionHref: buildActionHref(selected.id, questionIds, focusTheme),
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
  const themePhrase = getThemePhrase(summary);
  if (summary.highConfidenceIncorrect > 0) {
    return `今回の解答では「${themePhrase}」を少し確認しておくと、判断が安定しそうです。`;
  }
  if (summary.fastIncorrect > 0) {
    return `今回の解答では「${themePhrase}」を短く確認して、問題文の条件を拾う流れを整えましょう。`;
  }
  if (summary.incorrect > 0) {
    return `今回の解答では「${themePhrase}」に確認しておきたい点があります。似た問題を3問だけ解いて、判断の流れを整理しましょう。`;
  }
  if (summary.deliberateCorrect > 0) {
    return `「${themePhrase}」は正解できていますが、少し時間をかけて判断した問題があります。短く確認しておくと、次はもっと安定しそうです。`;
  }
  return `今回の解答は安定しています。「${themePhrase}」を短く確認して、取れているテーマをそのまま固めておきましょう。`;
}

function buildAnalysisDetails(
  ranked: readonly ClusterSummary[],
  questionCount: number,
): string[] {
  const maxDetails = questionCount >= 50 ? 4 : questionCount >= 20 ? 2 : 0;
  if (maxDetails === 0) return [];

  return ranked.slice(0, maxDetails).map((summary) => {
    const themePhrase = getThemePhrase(summary);
    if (summary.incorrect > 0) {
      return `${summary.label}: ${themePhrase}で確認したい問題が${summary.incorrect}問あります。`;
    }
    if (summary.deliberateCorrect > 0) {
      return `${summary.label}: ${themePhrase}は正解できていますが、少し時間をかけて判断しています。`;
    }
    return `${summary.label}: ${themePhrase}は安定して取れています。`;
  });
}

function buildActionHref(
  clusterId: string,
  excludeQuestionIds: string,
  focusTheme: string,
): string {
  const params = new URLSearchParams({
    count: "3",
    exclude: excludeQuestionIds,
    focus: focusTheme,
  });
  return `/study/ai-theme/${encodeURIComponent(clusterId)}?${params.toString()}`;
}

function getThemeLabel(question: Question): string {
  const theme = question.theme.trim();
  if (theme.length > 0) return theme;
  const minor = question.minorCategory.trim();
  if (minor.length > 0) return minor;
  return question.majorCategory;
}

function getPrimaryTheme(summary: ClusterSummary): string {
  return [...summary.themes.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "ja");
  })[0]?.[0] ?? summary.label;
}

function getThemePhrase(summary: ClusterSummary): string {
  const themes = [...summary.themes.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], "ja");
    })
    .slice(0, 2)
    .map(([label]) => label);
  if (themes.length === 0) return summary.label;
  if (themes.length === 1) return themes[0];
  return `${themes[0]}・${themes[1]}`;
}
