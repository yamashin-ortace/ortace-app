import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import { classifyAnswerDuration } from "./recommendation";

export type HomeAiCoachComment = {
  kind:
    | "onboarding"
    | "collecting"
    | "high_confidence_miss"
    | "fast_miss"
    | "accuracy_up"
    | "accuracy_down"
    | "streak_steady"
    | "default";
  /** AIコーチの一言。120字以内を目安 */
  message: string;
  /** 任意の CTA。たとえば「弱点リペアへ」など */
  cta?: { href: string; label: string };
};

const DATA_READINESS_THRESHOLD = 30;

/**
 * ホームに置く一言コメント。学習データの状態から、その時点で
 * もっとも伝える価値が高いメッセージを1つだけ選んで返す。
 */
export function buildHomeAiCoachComment(
  entries: readonly AnswerHistoryEntry[],
  now: Date = new Date(),
): HomeAiCoachComment {
  if (entries.length === 0) {
    return {
      kind: "onboarding",
      message:
        "問題を解くと、AIコーチが回答履歴を整理して今日のおすすめを作っていきます。",
    };
  }

  const uniqueAnswered = new Set(entries.map((entry) => entry.id)).size;
  if (uniqueAnswered < DATA_READINESS_THRESHOLD) {
    const remaining = DATA_READINESS_THRESHOLD - uniqueAnswered;
    return {
      kind: "collecting",
      message: `あと${remaining}問解くと、AIコーチがあなた専用の分析を本格的に動かし始めます。`,
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
      message: `直近1週間で自信ありの誤答が${recentHighIncorrect}問。本番で危ない覚え違いが残っているサイン。今日は思い込みチェックから始めましょう。`,
      cta: { href: "/study/misconception", label: "思い込みチェックへ" },
    };
  }

  if (recentFastIncorrect >= 3) {
    return {
      kind: "fast_miss",
      message: `直近1週間で急ぎ気味の誤答が${recentFastIncorrect}問。問題文の条件を拾う流れを意識しながら、今日のおすすめを進めましょう。`,
      cta: { href: "/study/today", label: "今日のおすすめへ" },
    };
  }

  const recentAccuracy = calculateAccuracy(recent);
  const previousAccuracy = calculateAccuracy(previous);
  if (recentAccuracy !== null && previousAccuracy !== null) {
    const delta = recentAccuracy - previousAccuracy;
    if (delta >= 5) {
      return {
        kind: "accuracy_up",
        message: `直近1週間の正答率が${Math.round(delta)}ポイント上昇中。今日はスピードより安定を優先して、いまの調子を固めましょう。`,
      };
    }
    if (delta <= -5) {
      return {
        kind: "accuracy_down",
        message: `直近1週間の正答率がやや低下しています。今日は復習と弱点リペアで基本に戻る回がおすすめ。`,
        cta: { href: "/study/weak", label: "弱点リペアへ" },
      };
    }
  }

  const streak = countConsecutiveLearningDays(entries, now);
  if (streak >= 3) {
    return {
      kind: "streak_steady",
      message: `${streak}日連続で学習中。AIコーチが今日も20問を整えています。一緒に進めましょう。`,
    };
  }

  return {
    kind: "default",
    message:
      "AIコーチが、今日のおすすめに復習・弱点・思い込み・未回答をバランスよく組み込んでいます。",
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
