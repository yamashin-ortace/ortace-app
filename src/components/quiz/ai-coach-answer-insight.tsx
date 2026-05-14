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
  if (latestEntry.result === "no_answer") return null;

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
    return pickTemplate(question, [
      `「${getThemeLabel(question)}」は似たミスが続いています。解説で条件の見分け方を一度整理しましょう。`,
      `このテーマは前回もつまずいています。今日は「${getThemeLabel(question)}」の判断ポイントだけ押さえておきましょう。`,
      `AIコーチ上は「${getThemeLabel(question)}」が反復ミス候補です。次に同じ型が来た時の合図を確認しましょう。`,
    ]);
  }

  const duration = classifyAnswerDuration(latestEntry.durationMs);
  if (latestEntry.result === "incorrect" && duration === "fast") {
    return pickTemplate(question, [
      `「${getThemeLabel(question)}」で少し急いで選んだ可能性があります。問題文の条件をもう一度確認してみましょう。`,
      `解答時間が短めの誤答です。「${getThemeLabel(question)}」は読み飛ばしやすい条件に注意しましょう。`,
      `AIコーチは急ぎすぎのミス候補として見ています。選択肢に入る前に、問題文の限定条件を拾い直しましょう。`,
    ]);
  }
  if (latestEntry.result === "incorrect" && duration === "deliberate") {
    return pickTemplate(question, [
      `時間をかけて考えた問題です。「${getThemeLabel(question)}」の考え方の流れを解説で確認しておくと次につながります。`,
      `迷ったうえでの誤答です。今日は答えだけでなく、なぜその選択肢を外すのかを見ておきましょう。`,
      `AIコーチ上は理解整理の候補です。「${getThemeLabel(question)}」の判断手順を短く言えるか確認しましょう。`,
    ]);
  }
  if (latestEntry.result === "correct" && duration === "deliberate") {
    return pickTemplate(question, [
      `正解できています。「${getThemeLabel(question)}」は少し迷いがありそうなので、あとで類題でもう一度確認すると安定しそうです。`,
      `取れている問題です。ただ、解答時間は長めなので、次は判断を少しだけ速くできるか試してみましょう。`,
      `AIコーチは定着途中の正解として見ています。「${getThemeLabel(question)}」は復習で安定化しやすいです。`,
    ]);
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

function getThemeLabel(question: Question): string {
  return question.minorCategory || question.theme || question.majorCategory;
}

function pickTemplate(question: Question, templates: readonly string[]): string {
  if (templates.length === 0) return "";
  const index = hashString(question.id) % templates.length;
  return templates[index] ?? templates[0] ?? "";
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
