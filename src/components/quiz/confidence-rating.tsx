"use client";

import { useMemo } from "react";
import { Brain, Lightbulb, ShieldCheck } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/answer-history";
import {
  useAnswerHistory,
  useAnswerHistoryList,
} from "@/lib/answer-history/use-answer-history";
import { cn } from "@/lib/utils";

type Props = {
  questionId: string;
};

const OPTIONS: {
  level: ConfidenceLevel;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    level: "high",
    label: "自信あり",
    hint: "次に出ても確実に正解できる",
    icon: ShieldCheck,
  },
  {
    level: "mid",
    label: "迷った",
    hint: "解けたが少し不安が残る",
    icon: Brain,
  },
  {
    level: "guess",
    label: "勘かも",
    hint: "根拠が薄く、当てた感覚がある",
    icon: Lightbulb,
  },
];

function getConfidenceFeedbackMessage({
  confidence,
  result,
}: {
  confidence: ConfidenceLevel | null;
  result: "correct" | "incorrect" | "no_answer";
}): string | null {
  if (confidence === "guess") {
    return result === "correct"
      ? "勘で当たった問題として、少し早めに確認します。"
      : "根拠が薄かった問題として、復習で確認します。";
  }
  if (confidence === "mid") {
    return result === "correct"
      ? "迷って正解した問題は、低めの優先度で後日確認します。"
      : "迷って外した問題として、復習で確認します。";
  }
  if (confidence === "high") {
    return result === "correct"
      ? "自信ありで正解した問題は、復習対象から外します。"
      : "自信ありで間違えた問題は、思い込みチェックの優先度を上げます。";
  }
  return null;
}

/**
 * 解答後に「自信あり / 迷った / 勘かも」をワンタップで入力する任意UI。
 * 同じボタンをもう一度押すと選択解除になる。
 */
export function ConfidenceRating({ questionId }: Props) {
  const { entries } = useAnswerHistoryList();
  const { setConfidence } = useAnswerHistory();

  const currentEntry = useMemo(() => {
    return [...entries]
      .filter((entry) => entry.id === questionId)
      .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))[0];
  }, [entries, questionId]);

  if (!currentEntry) return null;

  const currentConfidence = currentEntry.confidence ?? null;
  const feedbackMessage = getConfidenceFeedbackMessage({
    confidence: currentConfidence,
    result: currentEntry.result,
  });
  const handleClick = (level: ConfidenceLevel) => {
    const next: ConfidenceLevel | null =
      currentConfidence === level ? null : level;
    setConfidence({
      questionId,
      answeredAt: currentEntry.answeredAt,
      confidence: next,
    });
  };

  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] p-3">
      <p className="text-[12px] font-bold text-[var(--text-2)]">
        解いた感覚は？
        <span className="ml-1 text-[10px] font-normal text-[var(--text-3)]">
          （任意・あとから変更OK）
        </span>
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {OPTIONS.map(({ level, label, hint, icon: Icon }) => {
          const isActive = currentConfidence === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleClick(level)}
              aria-pressed={isActive}
              className={cn(
                "choice-pressable flex flex-col items-center gap-1 rounded-[10px] border px-2 py-2 text-center transition-colors",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:border-[var(--text-3)]",
              )}
              title={hint}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              <span className="text-[11px] font-bold leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {feedbackMessage ? (
        <p className="mt-2 text-[11px] leading-snug text-[var(--text-3)]">
          {feedbackMessage}
        </p>
      ) : null}
    </div>
  );
}
