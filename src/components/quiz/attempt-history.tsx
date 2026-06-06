"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, History, XCircle } from "lucide-react";
import type {
  AnswerFeeling,
  AnswerHistoryEntry,
  ConfidenceLevel,
} from "@/lib/answer-history";
import {
  ATTEMPT_HISTORY_RECENT_LIMIT,
  getAttemptHistory,
} from "@/lib/answer-history/attempt-history";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { cn } from "@/lib/utils";

type Props = {
  questionId: string;
};

const ANSWER_FEELING_LABEL: Record<AnswerFeeling, string> = {
  confident: "自信あり",
  unsure: "迷った",
  no_basis: "根拠なし",
  careless: "ケアレス",
  stuck: "お手上げ",
};

/**
 * 解答後に「この問題の挑戦履歴」を表示する。
 * - 直近3件だけを淡々と表示する。注意喚起は出さない。
 */
export function AttemptHistory({ questionId }: Props) {
  const { entries } = useAnswerHistoryList();

  const summary = useMemo(
    () => getAttemptHistory(entries, questionId),
    [entries, questionId],
  );

  if (summary.totalAttempts === 0) return null;

  const visibleEntries = summary.recent;
  const hasMore = summary.all.length > summary.recent.length;
  const currentEntry = summary.all[0];

  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] p-3">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-2)]">
        <History className="h-3.5 w-3.5" strokeWidth={2.5} />
        この問題の挑戦履歴（{summary.totalAttempts}回目）
      </p>

      <ul className="mt-2 space-y-1.5">
        {visibleEntries.map((entry, index) => (
          <AttemptRow
            key={`${entry.id}-${entry.answeredAt}-${index}`}
            entry={entry}
            isLatest={entry === currentEntry}
          />
        ))}
      </ul>

      {hasMore ? (
        <p className="mt-2 text-[10px] text-[var(--text-3)]">
          ※ 直近{ATTEMPT_HISTORY_RECENT_LIMIT}件を表示しています。
        </p>
      ) : null}
    </div>
  );
}

function AttemptRow({
  entry,
  isLatest,
}: {
  entry: AnswerHistoryEntry;
  isLatest: boolean;
}) {
  const dateLabel = formatShortDate(entry.answeredAt);
  const choiceLabel =
    entry.selectedAnswers.length > 0
      ? entry.selectedAnswers.length === 1
        ? `選択肢${entry.selectedAnswers[0]}`
        : `選択肢${entry.selectedAnswers.join("・")}`
      : "未選択";
  const feelingLabel = entry.answerFeeling
    ? `（${ANSWER_FEELING_LABEL[entry.answerFeeling]}）`
    : entry.confidence
      ? `（${getLegacyConfidenceLabel(entry.confidence, entry.result)}）`
      : "";

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-[12px]",
        isLatest
          ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]/40"
          : "border-border bg-[var(--bg-muted)]/35",
      )}
    >
      <ResultIcon result={entry.result} />
      <span className="font-bold text-[var(--text-1)]">
        {entry.result === "correct"
          ? "正解"
          : entry.result === "incorrect"
            ? "不正解"
            : "未確定"}
      </span>
      <span className="text-[var(--text-2)]">{choiceLabel}</span>
      {feelingLabel ? (
        <span className="text-[var(--text-3)]">{feelingLabel}</span>
      ) : null}
      <span className="ml-auto text-[10px] font-medium text-[var(--text-3)]">
        {isLatest ? "今回" : dateLabel}
      </span>
    </li>
  );
}

function getLegacyConfidenceLabel(
  confidence: ConfidenceLevel,
  result: AnswerHistoryEntry["result"],
): string {
  if (confidence === "high") return "自信あり";
  if (confidence === "mid") return "迷った";
  return result === "correct" ? "根拠なし" : "お手上げ";
}

function ResultIcon({ result }: { result: AnswerHistoryEntry["result"] }) {
  if (result === "correct") {
    return (
      <CheckCircle2
        className="h-3.5 w-3.5 text-[var(--success)]"
        strokeWidth={2.5}
      />
    );
  }
  if (result === "incorrect") {
    return (
      <XCircle
        className="h-3.5 w-3.5 text-[var(--error)]"
        strokeWidth={2.5}
      />
    );
  }
  return (
    <AlertTriangle
      className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
      strokeWidth={2.5}
    />
  );
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "—";
  }
}
