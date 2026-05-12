"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Crown, LockKeyhole } from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import {
  type AnswerJudgement,
  getExpectedSelectionCount,
  judgeAnswer,
} from "@/lib/quiz";
import {
  useAnswerHistory,
  useAnswerHistoryList,
} from "@/lib/answer-history/use-answer-history";
import { useQuizSettings } from "@/lib/quiz-settings/use-quiz-settings";
import { DAILY_LIMIT, type PlanType } from "@/lib/daily-limit";
import { useDailyLimit } from "@/lib/daily-limit/use-daily-limit";
import {
  clearLastQuizProgress,
  readLastQuizProgress,
  writeLastQuizProgress,
} from "@/lib/quiz-progress";
import { AttemptCountBadge } from "./attempt-count-badge";
import { AttemptHistory } from "./attempt-history";
import { ChoiceCard, type ChoiceState } from "./choice-card";
import { QuestionView } from "./question-view";
import { QuestionStudyActions } from "./question-study-actions";
import { AnswerFeedback } from "./answer-feedback";
import { ConfidenceRating } from "./confidence-rating";
import { QuizControls } from "./quiz-controls";
import { QuizProgress } from "./quiz-progress";
import { QuizResultScreen } from "./quiz-result-screen";

type Props = {
  questions: Question[];
  /** "random" のときは各問題の出典「第X回 午前 問Y」を表示する */
  mode?: "round" | "random";
  initialStudyAction?: "note";
  plan?: PlanType;
  resumeLabel?: string;
  saveProgress?: boolean;
  /**
   * 初回診断などのオンボーディング用導線で、日次制限の消費・到達判定を
   * バイパスする。通常導線では使わない。
   */
  bypassDailyLimit?: boolean;
  /** セッションを最終画面まで終えたタイミング（未回答強制終了でも呼ばれる） */
  onSessionComplete?: () => void;
};

const SESSION_LABEL = { am: "午前", pm: "午後" } as const;

const CHOICE_KEYS: ChoiceKey[] = ["1", "2", "3", "4", "5"];

/** 問題ごとの状態：選択中の選択肢 + 解答済みなら判定 */
type QuestionState = {
  selected: ChoiceKey[];
  judgement?: AnswerJudgement;
};

export function QuizPlayer({
  questions,
  mode = "round",
  initialStudyAction,
  plan = "free",
  resumeLabel,
  saveProgress = questions.length > 1,
  bypassDailyLimit = false,
  onSessionComplete,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [states, setStates] = useState<Record<string, QuestionState>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [pendingFinish, setPendingFinish] = useState(false);
  const [unansweredSweepMode, setUnansweredSweepMode] = useState(false);
  const consumingQuestionIdsRef = useRef<Set<string>>(new Set());
  const quizTopRef = useRef<HTMLDivElement | null>(null);
  const feedbackAnchorRef = useRef<HTMLDivElement | null>(null);
  const allowAutoResultRef = useRef(true);
  const sessionCompleteOnceRef = useRef(false);
  const realDailyLimit = useDailyLimit(plan);
  const dailyLimit = useMemo(
    () =>
      bypassDailyLimit
        ? {
            ...realDailyLimit,
            isLoaded: true,
            isLimitReached: false,
            consumeQuestion: () => true,
          }
        : realDailyLimit,
    [bypassDailyLimit, realDailyLimit],
  );
  const { recordAnswer } = useAnswerHistory();
  const { entries: historyEntries } = useAnswerHistoryList();
  const { showAttemptCountBeforeAnswer } = useQuizSettings();
  const quizHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const current = questions[currentIndex];
  const currentState: QuestionState = useMemo(
    () =>
      current ? (states[current.id] ?? { selected: [] }) : { selected: [] },
    [current, states],
  );
  const isAnswered = currentState.judgement !== undefined;
  const expectedCount = current ? getExpectedSelectionCount(current) : 1;

  // Try #N の N を、解答前は「履歴件数 + 1（今回分）」、解答後は履歴件数で表示。
  // 解答後は recordAnswer により履歴が +1 されるため、引き算しないと番号が進んでしまう。
  const pastAttemptCount = useMemo(() => {
    if (!current) return 0;
    return historyEntries.filter((entry) => entry.id === current.id).length;
  }, [current, historyEntries]);
  const attemptNumber = isAnswered ? pastAttemptCount : pastAttemptCount + 1;

  const scrollToQuestionTop = useCallback(() => {
    requestAnimationFrame(() => {
      quizTopRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  }, []);

  const handleSelect = useCallback(
    (key: ChoiceKey) => {
      if (!current || isAnswered) return;
      if (!dailyLimit.isLoaded || dailyLimit.isLimitReached) return;

      const cur = currentState;
      let next: ChoiceKey[];

      // 既選択ならトグルで解除
      if (cur.selected.includes(key)) {
        next = cur.selected.filter((k) => k !== key);
      } else if (cur.selected.length < expectedCount) {
        next = [...cur.selected, key];
      } else {
        // 必要数に達した瞬間に判定するため、通常ここには来ない。
        return;
      }

      const reachedExpected = next.length === expectedCount;
      if (!reachedExpected) {
        setStates((prev) => ({
          ...prev,
          [current.id]: { selected: next },
        }));
        return;
      }

      if (consumingQuestionIdsRef.current.has(current.id)) return;
      consumingQuestionIdsRef.current.add(current.id);

      const consumed = dailyLimit.consumeQuestion();
      if (!consumed) {
        consumingQuestionIdsRef.current.delete(current.id);
        return;
      }

      // 必要数に達した瞬間に判定
      const judgement = judgeAnswer(current, next);
      recordAnswer({
        question: current,
        result: judgement,
        selectedAnswers: next,
      });
      setStates((prev) => ({
        ...prev,
        [current.id]: { selected: next, judgement },
      }));
    },
    [
      current,
      currentState,
      dailyLimit,
      isAnswered,
      expectedCount,
      recordAnswer,
    ],
  );

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) return;
    const allAnswered = questions.every(
      (question) => states[question.id]?.judgement !== undefined,
    );
    if (allAnswered) {
      allowAutoResultRef.current = false;
    }
    setCurrentIndex((i) => i - 1);
    scrollToQuestionTop();
  }, [currentIndex, questions, scrollToQuestionTop, states]);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex((i) => i + 1);
    scrollToQuestionTop();
  }, [currentIndex, questions.length, scrollToQuestionTop]);

  const unansweredQuestionIndexes = useMemo(
    () =>
      questions
        .map((q, index) => ({ index, judgement: states[q.id]?.judgement }))
        .filter(({ judgement }) => judgement === undefined)
        .map(({ index }) => index),
    [questions, states],
  );

  const handleFinish = useCallback(() => {
    if (unansweredQuestionIndexes.length > 0) {
      setPendingFinish(true);
      return;
    }
    setUnansweredSweepMode(false);
    setIsFinished(true);
  }, [unansweredQuestionIndexes.length]);

  const handleConfirmFinish = useCallback(() => {
    setPendingFinish(false);
    setUnansweredSweepMode(false);
    setIsFinished(true);
  }, []);

  const handleGotoFirstUnanswered = useCallback(() => {
    setPendingFinish(false);
    setUnansweredSweepMode(true);
    const first = unansweredQuestionIndexes[0];
    if (typeof first === "number") {
      setCurrentIndex(first);
      scrollToQuestionTop();
    }
  }, [scrollToQuestionTop, unansweredQuestionIndexes]);

  const handleNextUnansweredInSweep = useCallback(() => {
    const next = pickNextUnansweredIndex(questions, states, currentIndex);
    if (typeof next === "number") {
      setCurrentIndex(next);
      scrollToQuestionTop();
    }
  }, [currentIndex, questions, scrollToQuestionTop, states]);

  const handleFinishSweepToResult = useCallback(() => {
    setUnansweredSweepMode(false);
    setIsFinished(true);
  }, []);

  const handleRestart = useCallback(() => {
    allowAutoResultRef.current = true;
    sessionCompleteOnceRef.current = false;
    setUnansweredSweepMode(false);
    setCurrentIndex(0);
    setStates({});
    setIsFinished(false);
    consumingQuestionIdsRef.current.clear();
    scrollToQuestionTop();
  }, [scrollToQuestionTop]);

  useEffect(() => {
    if (!isFinished) {
      sessionCompleteOnceRef.current = false;
      return;
    }
    if (sessionCompleteOnceRef.current) return;
    sessionCompleteOnceRef.current = true;
    onSessionComplete?.();
  }, [isFinished, onSessionComplete]);

  useEffect(() => {
    if (!isAnswered || currentState.judgement === undefined) return;
    const id = requestAnimationFrame(() => {
      feedbackAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [current?.id, currentIndex, currentState.judgement, isAnswered]);

  useEffect(() => {
    if (!allowAutoResultRef.current) return;
    if (unansweredSweepMode) return;
    if (isFinished) return;
    if (questions.length === 0) return;
    const allAnswered = questions.every(
      (question) => states[question.id]?.judgement !== undefined,
    );
    if (!allAnswered) return;
    const timeoutId = window.setTimeout(() => {
      setIsFinished(true);
    }, 1400);
    return () => window.clearTimeout(timeoutId);
  }, [states, questions, isFinished, unansweredSweepMode]);

  useEffect(() => {
    if (!saveProgress) return;
    const progress = readLastQuizProgress();
    if (!progress || progress.href !== quizHref) return;
    const nextIndex = Math.min(
      Math.max(progress.index, 0),
      Math.max(questions.length - 1, 0),
    );
    const timer = setTimeout(() => setCurrentIndex(nextIndex), 0);
    return () => clearTimeout(timer);
  }, [questions.length, quizHref, saveProgress]);

  useEffect(() => {
    if (!saveProgress || isFinished || !current) return;
    writeLastQuizProgress({
      href: quizHref,
      label: resumeLabel ?? "前回の演習",
      index: currentIndex,
      total: questions.length,
      savedAt: new Date().toISOString(),
    });
  }, [
    current,
    currentIndex,
    isFinished,
    questions.length,
    quizHref,
    resumeLabel,
    saveProgress,
  ]);

  useEffect(() => {
    if (!isFinished || !saveProgress) return;
    const progress = readLastQuizProgress();
    if (progress?.href === quizHref) {
      clearLastQuizProgress();
    }
  }, [isFinished, quizHref, saveProgress]);

  useEffect(() => {
    if (!isFinished) return;
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => cancelAnimationFrame(id);
  }, [isFinished]);

  if (isFinished) {
    return (
      <QuizResultScreen
        questions={questions}
        judgements={Object.fromEntries(
          Object.entries(states)
            .filter(([, s]) => s.judgement !== undefined)
            .map(([id, s]) => [id, s.judgement as AnswerJudgement]),
        )}
        selectedAnswers={Object.fromEntries(
          Object.entries(states).map(([id, s]) => [id, s.selected]),
        )}
        onRestart={handleRestart}
      />
    );
  }

  if (!current) {
    return (
      <div className="py-12 text-center text-[14px] text-[var(--text-3)]">
        問題がありません
      </div>
    );
  }

  const isLast = currentIndex === questions.length - 1;
  const correctSet = new Set(current.correctAnswers);
  const isNewAnswerBlocked =
    !isAnswered && (!dailyLimit.isLoaded || dailyLimit.isLimitReached);

  return (
    <div ref={quizTopRef} className="scroll-mt-20 space-y-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {mode === "random" ? (
            <p className="text-[11px] font-medium tabular-nums text-[var(--text-3)]">
              第{current.round}回 {SESSION_LABEL[current.session]} {current.displayNumber}
            </p>
          ) : null}
          {/* 解答前のバッジは設定で OFF にできる。解答後は履歴の確認のため常に表示。 */}
          {(isAnswered || showAttemptCountBeforeAnswer) && attemptNumber >= 1 ? (
            <AttemptCountBadge attemptNumber={attemptNumber} />
          ) : null}
        </div>
        <QuizProgress current={currentIndex + 1} total={questions.length} />
      </div>

      <div className="space-y-1.5">
        <QuestionView question={current} />
        <QuestionStudyActions
          question={current}
          initialOpen={currentIndex === 0 ? initialStudyAction : undefined}
        />
      </div>

      {dailyLimit.isLoaded && dailyLimit.isLimitReached && !isAnswered ? (
        <DailyLimitReachedNotice limit={dailyLimit.limit} plan={plan} />
      ) : null}

      <div className="space-y-2">
        {CHOICE_KEYS.map((key) => {
          const text = current.choices[key];
          if (!text) return null;
          return (
            <ChoiceCard
              key={key}
              choiceKey={key}
              text={text}
              state={getChoiceState({
                key,
                selected: currentState.selected,
                isAnswered,
                correctSet,
              })}
              onClick={() => handleSelect(key)}
              disabled={isAnswered || isNewAnswerBlocked}
            />
          );
        })}
      </div>

      <div ref={feedbackAnchorRef} className="space-y-3">
        {isAnswered && currentState.judgement ? (
          <AnswerFeedback
            question={current}
            judgement={currentState.judgement}
            variant="banner"
          />
        ) : null}

        {isAnswered ? (
          <AnswerFeedback
            question={current}
            judgement={currentState.judgement!}
            variant="explanation"
          />
        ) : null}

        {isAnswered && currentState.judgement !== "no_answer" ? (
          <ConfidenceRating questionId={current.id} />
        ) : null}

        {isAnswered ? <AttemptHistory questionId={current.id} /> : null}
      </div>

      {unansweredSweepMode &&
      isAnswered &&
      currentState.judgement !== undefined ? (
        <div className="space-y-2 pt-1">
          {unansweredQuestionIndexes.length > 0 ? (
            <button
              type="button"
              onClick={handleNextUnansweredInSweep}
              className="choice-pressable flex min-h-[3.25rem] w-full items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 text-[15px] font-bold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
            >
              解説を読んだら次の未回答へ
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishSweepToResult}
              className="choice-pressable flex min-h-[3.25rem] w-full items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 text-[15px] font-bold text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
            >
              最終画面へ進む
            </button>
          )}
        </div>
      ) : null}

      <QuizControls
        canPrev={currentIndex > 0}
        canNext={currentIndex < questions.length - 1}
        isLast={isLast}
        onPrev={handlePrev}
        onNext={handleNext}
        onFinish={handleFinish}
      />

      {pendingFinish ? (
        <UnansweredDialog
          remaining={unansweredQuestionIndexes.length}
          firstIndex={unansweredQuestionIndexes[0] ?? 0}
          onCancel={() => setPendingFinish(false)}
          onGoto={handleGotoFirstUnanswered}
          onForceFinish={handleConfirmFinish}
        />
      ) : null}
    </div>
  );
}

function UnansweredDialog({
  remaining,
  firstIndex,
  onCancel,
  onGoto,
  onForceFinish,
}: {
  remaining: number;
  firstIndex: number;
  onCancel: () => void;
  onGoto: () => void;
  onForceFinish: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="未回答の問題があります"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-[16px] border border-border bg-[var(--bg-base)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[16px] font-extrabold tracking-tight text-[var(--text-1)]">
          未回答が {remaining}問 あります
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
          このまま終了すると、未回答の問題は採点されません。最初の未回答（{firstIndex + 1}問目）に進み、解説後に次の未回答へ移れます。
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onForceFinish}
            className="choice-pressable rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            このまま終了
          </button>
          <button
            type="button"
            onClick={onGoto}
            className="choice-pressable rounded-[12px] bg-[var(--primary)] px-3 py-3 text-[13px] font-bold text-white"
          >
            未回答へ戻る
          </button>
        </div>
      </div>
    </div>
  );
}

function DailyLimitReachedNotice({
  limit,
  plan,
}: {
  limit: number;
  plan: PlanType;
}) {
  const label = plan === "low" ? "低学年プラン" : "無料分";
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 py-3">
      <LockKeyhole
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary-dark)]"
        strokeWidth={2.5}
      />
      <div className="space-y-1">
        <p className="text-[13px] font-bold text-[var(--text-1)]">
          今日の{label}（{limit || DAILY_LIMIT}問）を使い切りました
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
          解答済みの問題は、この画面内で見直せます。新しい解答は明日0時に再開できます。
        </p>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--primary-dark)] underline-offset-2 hover:underline"
        >
          <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />
          無制限プランの詳細
        </Link>
      </div>
    </div>
  );
}

function pickNextUnansweredIndex(
  questions: Question[],
  states: Record<string, QuestionState>,
  currentIndex: number,
): number | null {
  const sortedIdx = questions
    .map((question, idx) => ({
      idx,
      judgement: states[question.id]?.judgement,
    }))
    .filter(({ judgement }) => judgement === undefined)
    .map(({ idx }) => idx)
    .sort((a, b) => a - b);

  const forward = sortedIdx.find((i) => i > currentIndex);
  if (typeof forward === "number") return forward;
  return sortedIdx[0] ?? null;
}

function getChoiceState({
  key,
  selected,
  isAnswered,
  correctSet,
}: {
  key: ChoiceKey;
  selected: ChoiceKey[];
  isAnswered: boolean;
  correctSet: Set<ChoiceKey>;
}): ChoiceState {
  const isSelected = selected.includes(key);

  if (!isAnswered) {
    return isSelected ? "selected" : "default";
  }

  // 解答後
  const isCorrect = correctSet.has(key);
  if (isSelected && isCorrect) return "correct";
  if (isSelected && !isCorrect) return "incorrect";
  if (!isSelected && isCorrect) return "revealed";
  return "dimmed";
}
