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
  themesCorrect: Map<string, number>;
  themesIncorrect: Map<string, number>;
  total: number;
  correct: number;
  incorrect: number;
  fastIncorrect: number;
  deliberateIncorrect: number;
  highConfidenceIncorrect: number;
  uncertainIncorrect: number;
  confidentCorrect: number;
  uncertainCorrect: number;
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
      themesCorrect: new Map<string, number>(),
      themesIncorrect: new Map<string, number>(),
      total: 0,
      correct: 0,
      incorrect: 0,
      fastIncorrect: 0,
      deliberateIncorrect: 0,
      highConfidenceIncorrect: 0,
      uncertainIncorrect: 0,
      confidentCorrect: 0,
      uncertainCorrect: 0,
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
      summary.themesIncorrect.set(
        themeLabel,
        (summary.themesIncorrect.get(themeLabel) ?? 0) + 1,
      );
      summary.score += 100;
      if (duration === "fast") {
        summary.fastIncorrect += 1;
        summary.score += 12;
      }
      if (duration === "deliberate") {
        summary.deliberateIncorrect += 1;
        summary.score += 35;
      }
      if (entry?.confidence === "high") {
        summary.highConfidenceIncorrect += 1;
        summary.score += 45;
      }
      if (entry?.confidence === "mid" || entry?.confidence === "guess") {
        summary.uncertainIncorrect += 1;
        summary.score += 15;
      }
    } else {
      summary.correct += 1;
      summary.themesCorrect.set(
        themeLabel,
        (summary.themesCorrect.get(themeLabel) ?? 0) + 1,
      );
      summary.score += 8;
      if (duration === "deliberate") {
        summary.deliberateCorrect += 1;
        summary.score += 18;
      }
      if (entry?.confidence === "high") {
        summary.confidentCorrect += 1;
        summary.score += 10;
      }
      if (entry?.confidence === "mid" || entry?.confidence === "guess") {
        summary.uncertainCorrect += 1;
        summary.score += 16;
      }
    }
    summaries.set(cluster.id, summary);
  }

  const ranked = [...summaries.values()]
    .map(applyThemeConcentrationScore)
    .sort(compareSummary);
  const selected = ranked[0];
  if (!selected) {
    return {
      status: "collecting",
      clusterId: null,
      clusterLabel: null,
      message:
        "まだ分析材料を集めている段階です。数問解くと、AIコーチMiLu先生の提案が具体的になります。",
      details: [],
      actionHref: "/study/unanswered?count=3",
      actionLabel: "未回答から3問解く",
    };
  }

  const questionIds = questions.map((question) => question.id).join(",");
  const focusTheme = getPrimaryTheme(selected);
  return {
    status: "ready",
    clusterId: selected.id,
    clusterLabel: selected.label,
    message: buildAnalysisMessage(selected, ranked),
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

function applyThemeConcentrationScore(summary: ClusterSummary): ClusterSummary {
  const topIncorrectTheme = getTopIncorrectTheme(summary);
  if (!topIncorrectTheme || topIncorrectTheme.count < 2) return summary;
  return {
    ...summary,
    score: summary.score + (topIncorrectTheme.count - 1) * 30,
  };
}

function buildAnalysisMessage(
  summary: ClusterSummary,
  ranked: readonly ClusterSummary[],
): string {
  if (summary.incorrect === 0) return buildFocusSentence(summary);

  const strength = buildStrengthSentence(ranked, summary);
  const focus = buildFocusSentence(summary);
  return strength ? `${strength} ${focus}` : focus;
}

function buildStrengthSentence(
  ranked: readonly ClusterSummary[],
  focus: ClusterSummary,
): string | null {
  const strength = [...ranked]
    .filter((summary) => summary.correct > 0)
    .sort((a, b) => {
      const aFocusPenalty = a.id === focus.id ? 1 : 0;
      const bFocusPenalty = b.id === focus.id ? 1 : 0;
      if (aFocusPenalty !== bFocusPenalty) return aFocusPenalty - bFocusPenalty;
      if (a.incorrect !== b.incorrect) return a.incorrect - b.incorrect;
      if (a.correct !== b.correct) return b.correct - a.correct;
      if (a.confidentCorrect !== b.confidentCorrect) {
        return b.confidentCorrect - a.confidentCorrect;
      }
      return a.label.localeCompare(b.label, "ja");
    })[0];

  if (!strength) return null;

  const themePhrase = getThemePhrase(strength, "correct");
  if (strength.incorrect === 0 && strength.correct >= 2) {
    return `「${themePhrase}」は${strength.correct}問とも安定して取れています。`;
  }
  if (strength.confidentCorrect > 0) {
    return `「${themePhrase}」は自信を持って正解できています。`;
  }
  if (strength.deliberateCorrect > 0) {
    return `「${themePhrase}」は考える時間を使いながら正解まで届いています。`;
  }
  return `「${themePhrase}」は取れています。`;
}

function buildFocusSentence(summary: ClusterSummary): string {
  const themePhrase = getThemePhrase(summary);
  const clusterLabel = summary.label;
  const high = summary.highConfidenceIncorrect;
  const fast = summary.fastIncorrect;
  const deliberateIncorrect = summary.deliberateIncorrect;
  const uncertainIncorrect = summary.uncertainIncorrect;
  const wrong = summary.incorrect;
  const deliberate = summary.deliberateCorrect;
  const correct = summary.correct;
  const topIncorrectTheme = getTopIncorrectTheme(summary);

  if (wrong >= 2 && topIncorrectTheme && topIncorrectTheme.count >= 2) {
    const breakdown = buildIncorrectBreakdown(summary);
    const suffix = breakdown ? `（${breakdown}）` : "";
    return `${clusterLabel}では「${topIncorrectTheme.label}」の誤答が重なっています${suffix}。ここは用語や所見の結びつきをもう一度そろえると、次の類題で判断しやすくなりそうです。`;
  }
  if (high >= 2) {
    const others = wrong - high;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}では「${themePhrase}」を${high}問、自信ありで外しています${suffix}。知識が抜けているというより、覚えている内容の一部が入れ替わっていないかを確認したいところです。`;
  }
  if (high === 1) {
    const others = wrong - high;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}では「${themePhrase}」に自信ありの誤答が1問あります${suffix}。覚えたつもりの要点が少しずれていないか、軽く解説で根拠を確認しておきましょう。`;
  }
  if (deliberateIncorrect >= 2 || (deliberateIncorrect > 0 && wrong >= 2)) {
    return `${clusterLabel}では「${themePhrase}」で考える時間を使っても誤答が残っています。暗記だけで押すより、どの条件を根拠に選ぶかを解説で整理しておきましょう。`;
  }
  if (uncertainIncorrect >= 2) {
    return `${clusterLabel}では「${themePhrase}」で迷いが出やすくなっています。まずは選択肢を切る根拠をひとつずつ言えるか、短く確認しておきましょう。`;
  }
  if (wrong >= 3) {
    return `${clusterLabel}では「${themePhrase}」を中心に誤答が${wrong}問あります。細かいミスというより、テーマ全体の土台を一度整えると伸びやすいところです。`;
  }
  if (fast >= 2) {
    return `${clusterLabel}では「${themePhrase}」で短い時間に選んだ誤答が目立ちます。速さそのものより、問題文の条件を拾ってから選択肢に入る流れを確認しましょう。`;
  }
  if (fast === 1) {
    return `${clusterLabel}では「${themePhrase}」に確認したい誤答があります。短い時間で選んだ1問なので、条件をひとつ拾い直すだけで取り戻せる可能性があります。`;
  }
  if (wrong > 0) {
    return `${clusterLabel}では「${themePhrase}」に確認したい誤答があります。似た問題を3問だけ解いて、判断の根拠を軽くそろえておきましょう。`;
  }
  if (deliberate >= 2) {
    return `「${themePhrase}」は${correct}問とも正解できています。少し考える時間を使っているので、短い類題で判断の根拠を固めると本番でも安定しそうです。`;
  }
  if (deliberate === 1) {
    return `「${themePhrase}」は正解できています。少し迷った跡があるので、軽く類題で確認しておくと本番でも揺れにくくなります。`;
  }
  return `「${themePhrase}」は${correct}問とも安定して取れています。類題を3問だけ解いて、得意テーマとしてそのまま固めておきましょう。`;
}

function getTopIncorrectTheme(
  summary: ClusterSummary,
): { label: string; count: number } | null {
  const top = [...summary.themesIncorrect.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "ja");
  })[0];
  if (!top) return null;
  return { label: top[0], count: top[1] };
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
      const breakdown = buildIncorrectBreakdown(summary);
      const suffix = breakdown ? `（${breakdown}）` : "";
      return `${summary.label}: 「${themePhrase}」で確認したい誤答が${summary.incorrect}問${suffix}。`;
    }
    if (summary.deliberateCorrect > 0) {
      return `${summary.label}: 「${themePhrase}」は正解${summary.correct}問中、${summary.deliberateCorrect}問で考える時間を使いながら取れています。`;
    }
    return `${summary.label}: 「${themePhrase}」は${summary.correct}問とも安定して正解できています。`;
  });
}

function buildIncorrectBreakdown(summary: ClusterSummary): string {
  const parts: string[] = [];
  if (summary.highConfidenceIncorrect > 0) {
    parts.push(`自信あり${summary.highConfidenceIncorrect}問`);
  }
  if (summary.deliberateIncorrect > 0) {
    parts.push(`時間を使った誤答${summary.deliberateIncorrect}問`);
  }
  if (summary.uncertainIncorrect > 0) {
    parts.push(`迷いあり${summary.uncertainIncorrect}問`);
  }
  if (summary.fastIncorrect > 0) {
    parts.push(`短時間の誤答${summary.fastIncorrect}問`);
  }
  return parts.join("・");
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
  const source =
    summary.themesIncorrect.size > 0 ? summary.themesIncorrect : summary.themes;
  return [...source.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "ja");
  })[0]?.[0] ?? summary.label;
}

function getThemePhrase(
  summary: ClusterSummary,
  sourceType: "focus" | "correct" = "focus",
): string {
  const source =
    sourceType === "correct" && summary.themesCorrect.size > 0
      ? summary.themesCorrect
      : summary.themesIncorrect.size > 0
        ? summary.themesIncorrect
        : summary.themes;
  const themes = [...source.entries()]
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
