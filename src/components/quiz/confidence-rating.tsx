"use client";

import { useMemo } from "react";
import { AlertTriangle, Brain, HelpCircle, Lightbulb, ShieldCheck } from "lucide-react";
import type { AnswerFeeling, ConfidenceLevel } from "@/lib/answer-history";
import {
  useAnswerHistory,
  useAnswerHistoryList,
} from "@/lib/answer-history/use-answer-history";
import { cn } from "@/lib/utils";

type Props = {
  questionId: string;
};

const OPTIONS: {
  feeling: AnswerFeeling;
  results: Array<"correct" | "incorrect">;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    feeling: "confident",
    results: ["correct", "incorrect"],
    label: "自信あり",
    hint: "根拠を持って選べた",
    icon: ShieldCheck,
  },
  {
    feeling: "unsure",
    results: ["correct", "incorrect"],
    label: "迷った",
    hint: "候補で迷い、不安が残った",
    icon: Brain,
  },
  {
    feeling: "no_basis",
    results: ["correct"],
    label: "根拠なし",
    hint: "正解したが、根拠は薄かった",
    icon: Lightbulb,
  },
  {
    feeling: "careless",
    results: ["incorrect"],
    label: "ケアレス",
    hint: "読み違い・選択ミス・条件の見落とし",
    icon: AlertTriangle,
  },
  {
    feeling: "stuck",
    results: ["incorrect"],
    label: "お手上げ",
    hint: "何を選ぶべきか見当がつかなかった",
    icon: HelpCircle,
  },
];

function getConfidenceFeedbackMessage({
  answerFeeling,
  result,
}: {
  answerFeeling: AnswerFeeling | null;
  result: "correct" | "incorrect" | "no_answer";
}): string | null {
  if (answerFeeling === "no_basis") {
    return "根拠なしで当たった問題として、少し早めに確認します。";
  }
  if (answerFeeling === "unsure") {
    return result === "correct"
      ? "迷って正解した問題は、低めの優先度で後日確認します。"
      : "迷って外した問題として、復習で確認します。";
  }
  if (answerFeeling === "confident") {
    return result === "correct"
      ? "自信ありで正解した問題は、復習対象から外します。"
      : "自信ありで間違えた問題は、思い込みチェックの優先度を上げます。";
  }
  if (answerFeeling === "careless") {
    return "ケアレスミスとして、知識の弱点とは分けて確認します。";
  }
  if (answerFeeling === "stuck") {
    return "お手上げだった問題として、基礎確認や苦手克服で扱います。";
  }
  return null;
}

/**
 * 解答後に「解いた感覚」をワンタップで入力する任意UI。
 * 同じボタンをもう一度押すと選択解除になる。
 */
export function ConfidenceRating({ questionId }: Props) {
  const { entries } = useAnswerHistoryList();
  const { setAnswerFeeling } = useAnswerHistory();

  const currentEntry = useMemo(() => {
    return [...entries]
      .filter((entry) => entry.id === questionId)
      .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))[0];
  }, [entries, questionId]);

  if (!currentEntry) return null;
  if (currentEntry.result === "no_answer") return null;

  const currentAnswerFeeling =
    currentEntry.answerFeeling ??
    mapLegacyConfidenceToFeeling(currentEntry.confidence ?? null, currentEntry.result);
  const feedbackMessage = getConfidenceFeedbackMessage({
    answerFeeling: currentAnswerFeeling,
    result: currentEntry.result,
  });
  const handleClick = (answerFeeling: AnswerFeeling) => {
    const next: AnswerFeeling | null =
      currentAnswerFeeling === answerFeeling ? null : answerFeeling;
    setAnswerFeeling({
      questionId,
      answeredAt: currentEntry.answeredAt,
      answerFeeling: next,
    });
  };
  const visibleOptions = OPTIONS.filter((option) =>
    option.results.includes(currentEntry.result as "correct" | "incorrect"),
  );

  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] p-3">
      <p className="text-[12px] font-bold text-[var(--text-2)]">
        解いた感覚は？
        <span className="ml-1 text-[10px] font-normal text-[var(--text-3)]">
          （任意・あとから変更OK）
        </span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visibleOptions.map(({ feeling, label, hint, icon: Icon }) => {
          const isActive = currentAnswerFeeling === feeling;
          return (
            <button
              key={feeling}
              type="button"
              onClick={() => handleClick(feeling)}
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

function mapLegacyConfidenceToFeeling(
  confidence: ConfidenceLevel | null,
  result: "correct" | "incorrect" | "no_answer",
): AnswerFeeling | null {
  if (confidence === "high") return "confident";
  if (confidence === "mid") return "unsure";
  if (confidence === "guess") {
    return result === "correct" ? "no_basis" : "stuck";
  }
  return null;
}
