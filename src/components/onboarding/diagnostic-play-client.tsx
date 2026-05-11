"use client";

import { useEffect, useMemo, useState } from "react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import type { PlanType } from "@/lib/daily-limit";
import type { Question } from "@/lib/questions";
import { selectDiagnosticQuestions } from "@/lib/onboarding/diagnostic";
import { useDiagnosticStatus } from "@/lib/onboarding/use-diagnostic-status";

type Props = {
  questions: Question[];
  plan: PlanType;
};

/**
 * 初回診断パッケージのプレイクライアント。
 * - 全問題から各分野3問を抽出し、QuizPlayer に渡す。
 * - 日次制限はバイパス（初日特典）。
 * - すべて解答し終えたら自動的に `completed` 状態にする。
 */
export function DiagnosticPlayClient({ questions, plan }: Props) {
  const { setStatus } = useDiagnosticStatus();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const sessionQuestions = useMemo(() => {
    if (!hydrated) return null;
    return selectDiagnosticQuestions(questions);
    // 一度確定したら入れ替えない（同じセッション内で並び替えが起きないように）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 上記
  }, [hydrated]);

  // プレイ画面に入った時点で「診断を開始した」と見なし、ホームのバナーを消す。
  // 途中離脱しても再度 `/onboarding/diagnostic` から再開できる。
  useEffect(() => {
    if (!hydrated) return;
    setStatus("completed");
  }, [hydrated, setStatus]);

  if (!hydrated || sessionQuestions === null) {
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
      bypassDailyLimit
    />
  );
}
