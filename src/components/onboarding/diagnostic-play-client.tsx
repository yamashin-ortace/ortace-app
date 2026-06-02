"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import {
  hasDiagnosticBaseline,
  selectDiagnosticQuestions,
} from "@/lib/onboarding/diagnostic";
import { useDiagnosticStatus } from "@/lib/onboarding/use-diagnostic-status";

type Props = {
  questions: Question[];
  plan: PlanType;
};

/**
 * 初回診断パッケージのプレイクライアント。
 * - 全問題から各分野3問を抽出し、QuizPlayer に渡す。
 * - 最初に開始した診断セッションだけ日次制限をバイパス（初日特典）。
 * - すべて解答し終えたら自動的に `completed` 状態にする。
 */
export function DiagnosticPlayClient({ questions, plan }: Props) {
  const { status, setStatus } = useDiagnosticStatus();
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);
  const [bypassDailyLimit, setBypassDailyLimit] = useState<boolean | null>(null);

  const handleComplete = useCallback(() => {
    setStatus("completed");
  }, [setStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || bypassDailyLimit !== null) return;
    const canUseInitialBonus =
      status !== "started" &&
      status !== "completed" &&
      !hasDiagnosticBaseline(entries);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage と同期済み履歴を hydration 後に一度だけ評価し、この診断セッション中は値を固定する。
    setBypassDailyLimit(canUseInitialBonus);
    if (canUseInitialBonus) setStatus("started");
  }, [bypassDailyLimit, entries, hydrated, setStatus, status]);

  const sessionQuestions = useMemo(() => {
    if (!hydrated) return null;
    return selectDiagnosticQuestions(questions);
    // 一度確定したら入れ替えない（同じセッション内で並び替えが起きないように）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 上記
  }, [hydrated]);

  if (!hydrated || sessionQuestions === null || bypassDailyLimit === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (sessionQuestions.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        診断問題を用意できませんでした。少し時間を空けてもう一度お試しください。
      </div>
    );
  }

  return (
    <QuizPlayer
      questions={sessionQuestions}
      mode="random"
      plan={plan}
      resumeLabel="初回診断"
      bypassDailyLimit={bypassDailyLimit}
      onSessionComplete={handleComplete}
      hideRestartOnResult
      resultBackHref="/"
      resultBackLabel="ホームへ戻る"
    />
  );
}
