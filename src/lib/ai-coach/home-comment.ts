import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import { classifyAnswerDuration } from "./recommendation";
import {
  analyzeClusterWeakness,
  type QuestionClusterLookup,
} from "./cluster-weakness";

export type HomeAiCoachComment = {
  kind:
    | "onboarding"
    | "collecting"
    | "high_confidence_miss"
    | "fast_miss"
    | "cluster_focus"
    | "quadrant_focus"
    | "accuracy_up"
    | "accuracy_down"
    | "streak_steady"
    | "default";
  /** AIコーチの一言。2文構成を許容 */
  message: string;
  /** 任意の補助 CTA（メイン CTA はカード本体側で扱う） */
  cta?: { href: string; label: string };
};

const DATA_READINESS_THRESHOLD = 30;

export type BuildHomeCommentOptions = {
  /** 弱点クラスタ判定に使う問題ID→クラスタの辞書（あれば固有名で言及できる） */
  clusterLookup?: QuestionClusterLookup;
};

/**
 * ホームに置く一言コメント。学習データの状態から、その時点で
 * もっとも伝える価値が高いメッセージを1つだけ選んで返す。
 * clusterLookup を渡すと、弱点クラスタを文章に織り込んでより具体的になる。
 */
export function buildHomeAiCoachComment(
  entries: readonly AnswerHistoryEntry[],
  now: Date = new Date(),
  options: BuildHomeCommentOptions = {},
): HomeAiCoachComment {
  if (entries.length === 0) {
    return {
      kind: "onboarding",
      message:
        "問題を解くと、AIコーチが回答履歴・正答率・自信度・解答時間を分析して、今日のおすすめを組み立て始めます。まずは数問から。",
    };
  }

  const uniqueAnswered = new Set(entries.map((entry) => entry.id)).size;
  if (uniqueAnswered < DATA_READINESS_THRESHOLD) {
    const remaining = DATA_READINESS_THRESHOLD - uniqueAnswered;
    return {
      kind: "collecting",
      message: `今は学習データを集めている段階です。あと${remaining}問解くと、AIコーチがあなた専用の分析を本格的に動かし始めます。`,
    };
  }

  const latest = getLatestEntryByQuestionId(entries);
  const recent = filterWithinDays(entries, now, 7);
  const previous = filterBetweenDays(entries, now, 14, 7);

  const recentHighIncorrect = countHighConfidenceIncorrect(recent, latest);
  const recentFastIncorrect = countFastIncorrect(recent, latest);

  if (recentHighIncorrect >= 3) {
    return {
      kind: "high_confidence_miss",
      message: `直近1週間で自信ありの誤答が${recentHighIncorrect}問。本番で危ない覚え違いが残っているサインです。今日は思い込みチェックから始めて、要点を解説で拾い直しましょう。`,
      cta: { href: "/study/misconception", label: "思い込みチェック" },
    };
  }

  if (recentFastIncorrect >= 3) {
    return {
      kind: "fast_miss",
      message: `直近1週間で急ぎ気味の誤答が${recentFastIncorrect}問あります。条件の取り違えが起きやすいので、今日は問題文を読むペースを意識しながら進めましょう。`,
    };
  }

  // 弱点クラスタへの言及（具体テーマで定型文化を防ぐ）
  if (options.clusterLookup) {
    const weakness = analyzeClusterWeakness(entries, options.clusterLookup, {
      minJudged: 5,
      topN: 1,
    });
    const top = weakness[0];
    if (top && top.accuracy < 60) {
      return {
        kind: "cluster_focus",
        message: `今のあなたが伸ばせる余地が大きいテーマは「${top.clusterLabel}」（正答率 ${top.accuracy}% / ${top.judged}問中${top.correct}問正解）。AIコーチが今日のおすすめに、このテーマを優先的に入れています。`,
      };
    }
  }

  const recentAccuracy = calculateAccuracy(recent);
  const previousAccuracy = calculateAccuracy(previous);
  if (recentAccuracy !== null && previousAccuracy !== null) {
    const delta = recentAccuracy - previousAccuracy;
    if (delta >= 5) {
      return {
        kind: "accuracy_up",
        message: `直近1週間の正答率が${Math.round(delta)}ポイント上昇中（${previousAccuracy}% → ${recentAccuracy}%）。今日はスピードより安定を優先して、調子をそのまま固めましょう。`,
      };
    }
    if (delta <= -5) {
      return {
        kind: "accuracy_down",
        message: `直近1週間の正答率がやや低下しています（${previousAccuracy}% → ${recentAccuracy}%）。今日は復習と弱点リペアで基本に戻る回がおすすめ。`,
        cta: { href: "/study/weak", label: "弱点リペア" },
      };
    }
  }

  // 4象限の最頻パターンを言及
  const quadrantHighlight = pickQuadrantHighlight(recent);
  if (quadrantHighlight) {
    return {
      kind: "quadrant_focus",
      message: quadrantHighlight,
    };
  }

  const streak = countConsecutiveLearningDays(entries, now);
  if (streak >= 3) {
    return {
      kind: "streak_steady",
      message: `${streak}日連続で学習中。今日もAIコーチが復習・弱点・思い込み・未回答をバランスよく20問にまとめています。同じペースで続けましょう。`,
    };
  }

  return {
    kind: "default",
    message:
      "今日のおすすめは、復習・弱点・思い込みチェック・未回答をAIコーチがバランスよく20問にまとめています。20問解き終わると、明日のおすすめに今日の結果が反映されます。",
  };
}

function filterWithinDays(
  entries: readonly AnswerHistoryEntry[],
  now: Date,
  days: number,
): AnswerHistoryEntry[] {
  const threshold = now.getTime() - days * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const t = new Date(entry.answeredAt).getTime();
    return Number.isFinite(t) && t >= threshold;
  });
}

function filterBetweenDays(
  entries: readonly AnswerHistoryEntry[],
  now: Date,
  olderDays: number,
  newerDays: number,
): AnswerHistoryEntry[] {
  const older = now.getTime() - olderDays * 24 * 60 * 60 * 1000;
  const newer = now.getTime() - newerDays * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const t = new Date(entry.answeredAt).getTime();
    return Number.isFinite(t) && t >= older && t < newer;
  });
}

function countHighConfidenceIncorrect(
  entries: readonly AnswerHistoryEntry[],
  latest: Map<string, AnswerHistoryEntry>,
): number {
  let n = 0;
  for (const entry of entries) {
    if (entry.result !== "incorrect") continue;
    if (entry.confidence !== "high") continue;
    if (latest.get(entry.id) !== entry) continue;
    n += 1;
  }
  return n;
}

function countFastIncorrect(
  entries: readonly AnswerHistoryEntry[],
  latest: Map<string, AnswerHistoryEntry>,
): number {
  let n = 0;
  for (const entry of entries) {
    if (entry.result !== "incorrect") continue;
    if (classifyAnswerDuration(entry.durationMs) !== "fast") continue;
    if (latest.get(entry.id) !== entry) continue;
    n += 1;
  }
  return n;
}

function calculateAccuracy(entries: readonly AnswerHistoryEntry[]): number | null {
  const judged = entries.filter((entry) => entry.result !== "no_answer");
  if (judged.length === 0) return null;
  const correct = judged.filter((entry) => entry.result === "correct").length;
  return Math.round((correct / judged.length) * 100);
}

/**
 * 直近の4象限のうち、最も伝える価値が高い象限を1文に変換する。
 * 件数が少ない（最大象限が3問未満）場合は null。
 */
function pickQuadrantHighlight(
  recent: readonly AnswerHistoryEntry[],
): string | null {
  let correctFast = 0;
  let correctDeliberate = 0;
  let incorrectFast = 0;
  let incorrectDeliberate = 0;
  for (const entry of recent) {
    const bucket = classifyAnswerDuration(entry.durationMs);
    if (bucket === null || bucket === "standard") continue;
    if (entry.result === "correct" && bucket === "fast") correctFast += 1;
    else if (entry.result === "correct" && bucket === "deliberate") correctDeliberate += 1;
    else if (entry.result === "incorrect" && bucket === "fast") incorrectFast += 1;
    else if (entry.result === "incorrect" && bucket === "deliberate") incorrectDeliberate += 1;
  }
  const items = [
    { kind: "incorrect_fast", count: incorrectFast },
    { kind: "incorrect_deliberate", count: incorrectDeliberate },
    { kind: "correct_deliberate", count: correctDeliberate },
    { kind: "correct_fast", count: correctFast },
  ];
  items.sort((a, b) => b.count - a.count);
  const top = items[0];
  if (top.count < 3) return null;
  switch (top.kind) {
    case "incorrect_fast":
      return `直近で「急いで誤答」が${top.count}問。本番でも起きやすい読み違いです。今日は問題文の条件を一度声に出すつもりで進めましょう。`;
    case "incorrect_deliberate":
      return `直近で「時間をかけたのに誤答」が${top.count}問。知識・理解の整理が必要なテーマがあるサイン。今日は解説をしっかり読みながら進めましょう。`;
    case "correct_deliberate":
      return `直近は「時間をかけて正解」が${top.count}問と多めです。取れているテーマを類題で固めて、本番で揺れないペースに整えていきましょう。`;
    case "correct_fast":
      return `直近は「速く正解」が${top.count}問と多く、定着しているテーマが増えています。今日は弱点テーマに少しだけ手を伸ばすと得点効率が伸びます。`;
    default:
      return null;
  }
}

function countConsecutiveLearningDays(
  entries: readonly AnswerHistoryEntry[],
  now: Date,
): number {
  const days = new Set(
    entries
      .map((entry) => toDateKey(new Date(entry.answeredAt)))
      .filter((key): key is string => Boolean(key)),
  );
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const probe = new Date(now);
    probe.setDate(probe.getDate() - i);
    const key = toDateKey(probe);
    if (!key) break;
    if (!days.has(key)) {
      if (i === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

function toDateKey(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
