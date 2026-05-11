"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { AnswerHistoryEntry, ConfidenceLevel } from "@/lib/answer-history";
import {
  ATTEMPT_HISTORY_RECENT_LIMIT,
  getAttemptHistory,
} from "@/lib/answer-history/attempt-history";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { cn } from "@/lib/utils";

type Props = {
  questionId: string;
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "自信あり",
  mid: "微妙",
  guess: "勘",
};

/**
 * 解答後に「この問題の挑戦履歴」を表示する。
 * - 直近5件を一覧で、それ以前があれば展開ボタンで全件閲覧。
 * - 注意喚起（同じ選択肢で連続ミス・全件ミス・連続正解）はバナーで添える。
 */
export function AttemptHistory({ questionId }: Props) {
  const { entries } = useAnswerHistoryList();
  const [expanded, setExpanded] = useState(false);

  const summary = useMemo(
    () => getAttemptHistory(entries, questionId),
    [entries, questionId],
  );

  if (summary.totalAttempts === 0) return null;

  const visibleEntries = expanded ? summary.all : summary.recent;
  const hasMore = summary.all.length > summary.recent.length;
  const currentEntry = summary.all[0];

  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] p-3">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-2)]">
          <History className="h-3.5 w-3.5" strokeWidth={2.5} />
          この問題の挑戦履歴（{summary.totalAttempts}回目）
        </p>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
          >
            {expanded ? (
              <>
                折りたたむ <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              </>
            ) : (
              <>
                すべて見る <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              </>
            )}
          </button>
        ) : null}
      </div>

      <AttentionBanner summary={summary} />

      <ul className="mt-2 space-y-1.5">
        {visibleEntries.map((entry, index) => (
          <AttemptRow
            key={`${entry.id}-${entry.answeredAt}-${index}`}
            entry={entry}
            isLatest={entry === currentEntry}
            isRepeatedMistake={
              summary.repeatedMistake !== null &&
              entry.result === "incorrect" &&
              entry.selectedAnswers.join("+") === summary.repeatedMistake.choiceKey
            }
          />
        ))}
      </ul>

      {!expanded && hasMore ? (
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
  isRepeatedMistake,
}: {
  entry: AnswerHistoryEntry;
  isLatest: boolean;
  isRepeatedMistake: boolean;
}) {
  const dateLabel = formatShortDate(entry.answeredAt);
  const choiceLabel =
    entry.selectedAnswers.length > 0
      ? entry.selectedAnswers.length === 1
        ? `選択肢${entry.selectedAnswers[0]}`
        : `選択肢${entry.selectedAnswers.join("・")}`
      : "未選択";
  const confidence = entry.confidence
    ? `（${CONFIDENCE_LABEL[entry.confidence]}）`
    : "";

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-[12px]",
        isLatest
          ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]/40"
          : "border-border bg-[var(--bg-muted)]/35",
        isRepeatedMistake && "ring-1 ring-[var(--error)]/40",
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
      {confidence ? (
        <span className="text-[var(--text-3)]">{confidence}</span>
      ) : null}
      <span className="ml-auto text-[10px] font-medium text-[var(--text-3)]">
        {isLatest ? "今回" : dateLabel}
      </span>
    </li>
  );
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

function AttentionBanner({
  summary,
}: {
  summary: ReturnType<typeof getAttemptHistory>;
}) {
  if (summary.repeatedMistake) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-[8px] bg-[var(--error)]/10 px-2 py-1 text-[11px] font-bold text-[var(--error)]">
        <AlertTriangle className="mt-px h-3 w-3" strokeWidth={2.5} />
        同じ選択肢で{summary.repeatedMistake.count}回ミスしています。思い込みに注意。
      </p>
    );
  }
  if (summary.recentAllIncorrect) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-[8px] bg-[var(--error)]/10 px-2 py-1 text-[11px] font-bold text-[var(--error)]">
        <AlertTriangle className="mt-px h-3 w-3" strokeWidth={2.5} />
        直近{ATTEMPT_HISTORY_RECENT_LIMIT}回すべて不正解です。解説を読み直しましょう。
      </p>
    );
  }
  if (summary.recentAllCorrect) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-[8px] bg-[var(--success)]/10 px-2 py-1 text-[11px] font-bold text-[var(--success)]">
        <TrendingUp className="mt-px h-3 w-3" strokeWidth={2.5} />
        3回連続で正解しています。定着OK。
      </p>
    );
  }
  if (summary.totalAttempts === 1) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-[8px] bg-[var(--primary-soft)] px-2 py-1 text-[11px] font-bold text-[var(--primary-dark)]">
        <Sparkles className="mt-px h-3 w-3" strokeWidth={2.5} />
        初挑戦の問題です。
      </p>
    );
  }
  return null;
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "—";
  }
}
