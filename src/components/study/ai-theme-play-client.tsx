"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Inbox } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";

type Props = {
  questions: Question[];
  clusterLabel: string;
  count: number;
  plan: PlanType;
};

export function AiThemePlayClient({
  questions,
  clusterLabel,
  count,
  plan,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const [frozenPool, setFrozenPool] = useState<Question[] | null>(null);

  useEffect(() => {
    if (frozenPool !== null) return;
    const ordered = orderAiThemeQuestions(questions, entries);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回に3問の出題プールを固定する
    setFrozenPool(ordered.slice(0, count));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ pool を凍結する
  }, []);

  if (frozenPool === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (frozenPool.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-muted)] text-[var(--text-3)]">
          <Inbox className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="text-[16px] font-bold text-[var(--text-1)]">
            このテーマの問題が見つかりませんでした
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
            AIコーチのおすすめに戻って、別のテーマを確認してください。
          </p>
        </div>
        <Link
          href="/study"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          学習トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <QuizPlayer
      questions={frozenPool}
      mode="random"
      plan={plan}
      resumeLabel={`${clusterLabel} 3問確認`}
      resultBackHref="/study"
      resultBackLabel="学習タブへ戻る"
    />
  );
}

function orderAiThemeQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
): Question[] {
  const latest = getLatestEntryByQuestionId(entries);
  return [...questions].sort((a, b) => {
    const scoreDiff = scoreQuestion(b, latest) - scoreQuestion(a, latest);
    if (scoreDiff !== 0) return scoreDiff;
    return compareQuestionSource(a, b);
  });
}

function scoreQuestion(
  question: Question,
  latest: Map<string, AnswerHistoryEntry>,
): number {
  const entry = latest.get(question.id);
  if (!entry) return 70;
  if (entry.result === "incorrect") return 100;
  if (entry.result === "no_answer") return 0;
  if (entry.result === "correct" && (entry.durationMs ?? 0) >= 60_000) return 45;
  return 20;
}

function getLatestEntryByQuestionId(
  entries: readonly AnswerHistoryEntry[],
): Map<string, AnswerHistoryEntry> {
  const latest = new Map<string, AnswerHistoryEntry>();
  for (const entry of entries) {
    const existing = latest.get(entry.id);
    if (!existing || entry.answeredAt > existing.answeredAt) {
      latest.set(entry.id, entry);
    }
  }
  return latest;
}

function compareQuestionSource(a: Question, b: Question): number {
  if (a.round !== b.round) return a.round - b.round;
  if (a.session !== b.session) return a.session === "am" ? -1 : 1;
  return a.displayNumber - b.displayNumber;
}
