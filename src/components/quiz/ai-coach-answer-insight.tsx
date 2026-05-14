import { Sparkles } from "lucide-react";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { classifyAnswerDuration } from "@/lib/ai-coach/recommendation";
import type { Question } from "@/lib/questions";

type Props = {
  question: Question;
  questions: readonly Question[];
  entries: readonly AnswerHistoryEntry[];
};

export function AiCoachAnswerInsight({ question, questions, entries }: Props) {
  const latestEntry = entries
    .filter((entry) => entry.id === question.id)
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))[0];
  if (!latestEntry) return null;

  const message = pickInsightMessage(question, questions, entries, latestEntry);
  if (!message) return null;

  return (
    <div className="flex gap-2 rounded-[12px] border border-[var(--primary)]/25 bg-[var(--primary-soft)]/55 p-3 text-[12px] leading-relaxed text-[var(--text-2)]">
      <Sparkles
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]"
        strokeWidth={2.4}
        aria-hidden
      />
      <div>
        <p className="font-bold text-[var(--text-1)]">AIコーチメモ</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}

function pickInsightMessage(
  question: Question,
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  latestEntry: AnswerHistoryEntry,
): string | null {
  if (hasSimilarThemeMistake(question, questions, entries, latestEntry)) {
    return "このテーマは前回もつまずいています。解説で条件の見分け方を確認しておきましょう。";
  }

  const duration = classifyAnswerDuration(latestEntry.durationMs);
  if (latestEntry.result === "incorrect" && duration === "fast") {
    return "少し急いで選んだ可能性があります。問題文の条件をもう一度確認してみましょう。";
  }
  if (latestEntry.result === "incorrect" && duration === "deliberate") {
    return "時間をかけて考えた問題です。解説で考え方の流れを確認しておくと次につながります。";
  }
  if (latestEntry.result === "correct" && duration === "deliberate") {
    return "正解できています。少し迷いがありそうなので、あとで類題でもう一度確認すると安定しそうです。";
  }
  return null;
}

function hasSimilarThemeMistake(
  question: Question,
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  latestEntry: AnswerHistoryEntry,
): boolean {
  if (latestEntry.result === "correct") return false;
  const questionById = new Map(questions.map((item) => [item.id, item]));
  const themeKey = makeThemeKey(question);
  return entries.some((entry) => {
    if (entry.id === latestEntry.id && entry.answeredAt === latestEntry.answeredAt) {
      return false;
    }
    if (entry.result === "correct") return false;
    const previousQuestion = questionById.get(entry.id);
    return previousQuestion ? makeThemeKey(previousQuestion) === themeKey : false;
  });
}

function makeThemeKey(question: Question): string {
  return [
    question.majorCategory,
    question.minorCategory || question.theme || "",
  ].join("|");
}
