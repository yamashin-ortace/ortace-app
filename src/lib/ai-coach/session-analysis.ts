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
  themesIncorrect: Map<string, number>;
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
      themesIncorrect: new Map<string, number>(),
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
      summary.themesIncorrect.set(
        themeLabel,
        (summary.themesIncorrect.get(themeLabel) ?? 0) + 1,
      );
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
        "まだ分析材料を集めている段階です。数問解くと、AIコーチMiLu先生の提案が具体的になります。",
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
  const clusterLabel = summary.label;
  const high = summary.highConfidenceIncorrect;
  const fast = summary.fastIncorrect;
  const wrong = summary.incorrect;
  const deliberate = summary.deliberateCorrect;
  const correct = summary.correct;
  const topIncorrectTheme = getTopIncorrectTheme(summary);

  // 1. 重症複合: 誤答3問以上 + 自信あり + 急ぎ
  if (wrong >= 3 && high > 0 && fast > 0) {
    return `${clusterLabel}は今回少し荒れています。「${themePhrase}」で誤答${wrong}問（自信あり${high}・急ぎすぎ${fast}）。要点の取り違えと判断スピードの両方を、解説を見ながら整え直しておきましょう。`;
  }
  // 2. 自信×急ぎ複合（軽め）
  if (high > 0 && fast > 0) {
    return `${clusterLabel}では「${themePhrase}」で自信ありの誤答が${high}問、急ぎ気味の誤答が${fast}問。問題文の条件を拾う流れと、覚え違いがないかの確認を両方やっておきましょう。`;
  }
  // 3. 自信あり多発
  if (high >= 2) {
    const others = wrong - high;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}で「${themePhrase}」を${high}問、自信ありで落としています${suffix}。覚え違いが連続しているサイン。解説で要点を1つずつ拾い直しておきましょう。`;
  }
  // 4. 自信あり単発
  if (high === 1) {
    const others = wrong - high;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}で「${themePhrase}」を1問、自信ありで落としています${suffix}。本番で危ない覚え違いになりやすいので、軽く解説で確認しておきましょう。`;
  }
  // 5. 急ぎ多発
  if (fast >= 2) {
    const others = wrong - fast;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}で「${themePhrase}」を${fast}問、急ぎ気味に誤答しています${suffix}。問題文を読むペースが少し速め。条件を拾う流れを整えるところから整えましょう。`;
  }
  // 6. 急ぎ単発
  if (fast === 1) {
    const others = wrong - fast;
    const suffix = others > 0 ? `（ほか誤答${others}問）` : "";
    return `${clusterLabel}で「${themePhrase}」を1問、急ぎ気味に誤答しています${suffix}。ひと呼吸置いて条件を拾う流れを意識できれば取れた問題かも。軽く確認しておきましょう。`;
  }
  // 7. 同テーマ集中ミス（誤答2問以上、上位テーマが2問以上）
  if (wrong >= 2 && topIncorrectTheme && topIncorrectTheme.count >= 2) {
    return `${clusterLabel}は「${topIncorrectTheme.label}」で${topIncorrectTheme.count}問続けて落としています。同じテーマで繰り返しつまずいているので、ピンポイントで解説と類題を見直しましょう。`;
  }
  // 8. 広く取りこぼし（誤答3問以上、テーマ分散）
  if (wrong >= 3) {
    return `${clusterLabel}は今回「${themePhrase}」を中心に誤答${wrong}問と幅広く取りこぼしています。クラスタのベースを固め直す価値あり。3問だけ解いて土台を整えましょう。`;
  }
  // 9. 誤答少数（1〜2問、その他条件には当てはまらない）
  if (wrong > 0) {
    return `${clusterLabel}で「${themePhrase}」を${wrong}問、確認したい誤答があります。似た問題を3問だけ解いて、判断の流れを軽く整理しておきましょう。`;
  }
  // 10. じっくり正解多数
  if (deliberate >= 2) {
    return `「${themePhrase}」は${correct}問とも正解できていますが、${deliberate}問でやや時間をかけて判断しています。短い類題で流れを固めると、本番でも安定しそうです。`;
  }
  // 11. じっくり正解1問
  if (deliberate === 1) {
    return `「${themePhrase}」は正解できていますが、1問だけ時間をかけて判断しています。軽く確認しておくと、迷いが残らず本番でも揺れにくくなります。`;
  }
  // 12. 全問安定（じっくりもなし）
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
      return `${summary.label}: 「${themePhrase}」は正解${summary.correct}問中、${summary.deliberateCorrect}問でやや時間がかかっています。`;
    }
    return `${summary.label}: 「${themePhrase}」は${summary.correct}問とも安定して正解できています。`;
  });
}

function buildIncorrectBreakdown(summary: ClusterSummary): string {
  const parts: string[] = [];
  if (summary.highConfidenceIncorrect > 0) {
    parts.push(`自信あり${summary.highConfidenceIncorrect}問`);
  }
  if (summary.fastIncorrect > 0) {
    parts.push(`急ぎすぎ${summary.fastIncorrect}問`);
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

function getThemePhrase(summary: ClusterSummary): string {
  const source =
    summary.themesIncorrect.size > 0 ? summary.themesIncorrect : summary.themes;
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
