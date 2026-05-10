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
import { useAnswerHistory } from "@/lib/answer-history/use-answer-history";
import { DAILY_LIMIT, type PlanType } from "@/lib/daily-limit";
import { useDailyLimit } from "@/lib/daily-limit/use-daily-limit";
import {
  clearLastQuizProgress,
  readLastQuizProgress,
  writeLastQuizProgress,
} from "@/lib/quiz-progress";
import { ChoiceCard, type ChoiceState } from "./choice-card";
import { QuestionView } from "./question-view";
import { QuestionStudyActions } from "./question-study-actions";
import { AnswerFeedback } from "./answer-feedback";
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
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [states, setStates] = useState<Record<string, QuestionState>>({});
  const [isFinished, setIsFinished] = useState(false);
  const consumingQuestionIdsRef = useRef<Set<string>>(new Set());
  const quizTopRef = useRef<HTMLDivElement | null>(null);
  const dailyLimit = useDailyLimit(plan);
  const { recordAnswer } = useAnswerHistory();
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
    setCurrentIndex((i) => i - 1);
    scrollToQuestionTop();
  }, [currentIndex, scrollToQuestionTop]);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex((i) => i + 1);
    scrollToQuestionTop();
  }, [currentIndex, questions.length, scrollToQuestionTop]);

  const handleFinish = useCallback(() => {
    setIsFinished(true);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setStates({});
    setIsFinished(false);
    consumingQuestionIdsRef.current.clear();
    scrollToQuestionTop();
  }, [scrollToQuestionTop]);

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

  if (isFinished) {
    return (
      <QuizResultScreen
        questions={questions}
        judgements={Object.fromEntries(
          Object.entries(states)
            .filter(([, s]) => s.judgement !== undefined)
            .map(([id, s]) => [id, s.judgement as AnswerJudgement]),
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
        {mode === "random" ? (
          <p className="text-[11px] font-medium tabular-nums text-[var(--text-3)]">
            第{current.round}回 {SESSION_LABEL[current.session]} {current.displayNumber}
          </p>
        ) : null}
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

      <QuizControls
        canPrev={currentIndex > 0}
        canNext={currentIndex < questions.length - 1}
        isLast={isLast}
        onPrev={handlePrev}
        onNext={handleNext}
        onFinish={handleFinish}
      />
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
