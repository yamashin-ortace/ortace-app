"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCcw,
  Send,
  Target,
  Trophy,
} from "lucide-react";
import { ChoiceCard } from "@/components/quiz/choice-card";
import { QuestionView } from "@/components/quiz/question-view";
import type { ChoiceKey, Question } from "@/lib/questions";
import {
  type AnswerJudgement,
  getExpectedSelectionCount,
  judgeAnswer,
  shuffle,
} from "@/lib/quiz";
import { useAnswerHistory } from "@/lib/answer-history/use-answer-history";

const CHOICE_KEYS: ChoiceKey[] = ["1", "2", "3", "4", "5"];
const SESSION_LABEL = { am: "午前", pm: "午後" } as const;

type Props = {
  questions: Question[];
  questionCount?: number;
  timeLimitSec?: number;
};

type AnswerMap = Record<string, ChoiceKey[]>;

export function MockPlayer({
  questions,
  questionCount = 150,
  timeLimitSec = 7200,
}: Props) {
  const [pickedQuestions, setPickedQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSec, setRemainingSec] = useState(timeLimitSec);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const startTimestampRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const { recordAnswer } = useAnswerHistory();

  useEffect(() => {
    const limit = Math.min(questionCount, questions.length);
    const picked = shuffle(questions).slice(0, limit);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時にだけ実行されるシャッフル＋開始時刻記録
    setPickedQuestions(picked);
    startTimestampRef.current = Date.now();
  }, [questionCount, questions]);

  const forceSubmit = useCallback(() => {
    if (submittedRef.current || !pickedQuestions) return;
    submittedRef.current = true;
    for (const question of pickedQuestions) {
      const selected = answers[question.id] ?? [];
      const judgement: AnswerJudgement =
        selected.length === 0 ? "no_answer" : judgeAnswer(question, selected);
      recordAnswer({
        question,
        result: judgement,
        selectedAnswers: selected,
      });
    }
    setPendingSubmit(false);
    setIsSubmitted(true);
  }, [answers, pickedQuestions, recordAnswer]);

  const requestSubmit = useCallback(() => {
    if (!pickedQuestions) return;
    const unansweredCount = pickedQuestions.filter(
      (q) => (answers[q.id]?.length ?? 0) === 0,
    ).length;
    if (unansweredCount > 0) {
      setPendingSubmit(true);
      return;
    }
    forceSubmit();
  }, [answers, forceSubmit, pickedQuestions]);

  const gotoFirstUnanswered = useCallback(() => {
    if (!pickedQuestions) return;
    const idx = pickedQuestions.findIndex(
      (q) => (answers[q.id]?.length ?? 0) === 0,
    );
    if (idx >= 0) {
      setCurrentIndex(idx);
    }
    setPendingSubmit(false);
  }, [answers, pickedQuestions]);

  // タイマー切れの自動提出は確認なし
  const handleSubmit = requestSubmit;

  useEffect(() => {
    if (!pickedQuestions || isSubmitted) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      const remaining = Math.max(0, timeLimitSec - elapsed);
      setRemainingSec(remaining);
      if (remaining === 0) {
        forceSubmit();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [forceSubmit, isSubmitted, pickedQuestions, timeLimitSec]);

  if (!pickedQuestions) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        模試の準備中…
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <MockResultScreen
        questions={pickedQuestions}
        answers={answers}
        elapsedSec={timeLimitSec - remainingSec}
      />
    );
  }

  const current = pickedQuestions[currentIndex];
  if (!current) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        問題がありません
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((arr) => arr.length > 0).length;
  const expectedCount = getExpectedSelectionCount(current);
  const currentSelection = answers[current.id] ?? [];

  const handleSelect = (key: ChoiceKey) => {
    setAnswers((prev) => {
      const cur = prev[current.id] ?? [];
      let next: ChoiceKey[];
      if (cur.includes(key)) {
        next = cur.filter((k) => k !== key);
      } else if (cur.length < expectedCount) {
        next = [...cur, key];
      } else if (expectedCount === 1) {
        next = [key];
      } else {
        return prev;
      }
      return { ...prev, [current.id]: next };
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <MockTopBar
        currentIndex={currentIndex}
        total={pickedQuestions.length}
        answered={answeredCount}
        remainingSec={remainingSec}
      />

      <p className="text-[11px] font-medium tabular-nums text-[var(--text-3)]">
        第{current.round}回 {SESSION_LABEL[current.session]} {current.displayNumber}
      </p>

      <QuestionView question={current} />

      <div className="space-y-2">
        {CHOICE_KEYS.map((key) => {
          const text = current.choices[key];
          if (!text) return null;
          return (
            <ChoiceCard
              key={key}
              choiceKey={key}
              text={text}
              state={currentSelection.includes(key) ? "selected" : "default"}
              onClick={() => handleSelect(key)}
            />
          );
        })}
      </div>

      <MockBottomBar
        canPrev={currentIndex > 0}
        canNext={currentIndex < pickedQuestions.length - 1}
        onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(pickedQuestions.length - 1, i + 1))}
        onSubmit={handleSubmit}
      />

      {pendingSubmit ? (
        <MockUnansweredDialog
          remaining={pickedQuestions.filter(
            (q) => (answers[q.id]?.length ?? 0) === 0,
          ).length}
          onCancel={() => setPendingSubmit(false)}
          onGoto={gotoFirstUnanswered}
          onForceFinish={forceSubmit}
        />
      ) : null}
    </div>
  );
}

function MockUnansweredDialog({
  remaining,
  onCancel,
  onGoto,
  onForceFinish,
}: {
  remaining: number;
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
          このまま提出すると、未回答の問題は無回答として採点されます。最初の未回答に戻って解きますか？
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onForceFinish}
            className="choice-pressable rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            このまま提出
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

function MockTopBar({
  currentIndex,
  total,
  answered,
  remainingSec,
}: {
  currentIndex: number;
  total: number;
  answered: number;
  remainingSec: number;
}) {
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const isTight = remainingSec < 600;

  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-[var(--bg-base)]/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-extrabold tabular-nums text-[var(--text-1)]">
            {currentIndex + 1}
          </span>
          <span className="text-[12px] text-[var(--text-3)]">/ {total}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-3)]">
            解答済 {answered}
          </span>
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums",
              isTight
                ? "bg-[#FDECEC] text-[#9B1E1E] dark:bg-[#3A1F1F] dark:text-[#FF9999]"
                : "bg-[var(--bg-muted)] text-[var(--text-1)]",
            ].join(" ")}
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

function MockBottomBar({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSubmit,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 pt-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="choice-pressable inline-flex items-center justify-center gap-1 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)] disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        前へ
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="choice-pressable inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[var(--primary)] px-3 py-3 text-[13px] font-bold text-white"
      >
        <Send className="h-4 w-4" strokeWidth={2.5} />
        提出
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="choice-pressable inline-flex items-center justify-center gap-1 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)] disabled:opacity-40"
      >
        次へ
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function MockResultScreen({
  questions,
  answers,
  elapsedSec,
}: {
  questions: Question[];
  answers: AnswerMap;
  elapsedSec: number;
}) {
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let noAnswer = 0;
    const byField = new Map<string, { correct: number; total: number }>();
    for (const question of questions) {
      const selected = answers[question.id] ?? [];
      const judgement: AnswerJudgement =
        selected.length === 0 ? "no_answer" : judgeAnswer(question, selected);
      const bucket = byField.get(question.majorCategory) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (judgement === "correct") {
        correct += 1;
        bucket.correct += 1;
      } else if (judgement === "incorrect") {
        incorrect += 1;
      } else {
        noAnswer += 1;
      }
      byField.set(question.majorCategory, bucket);
    }
    const fields = Array.from(byField.entries())
      .map(([name, b]) => ({
        name,
        correct: b.correct,
        total: b.total,
        rate: b.total === 0 ? 0 : Math.round((b.correct / b.total) * 100),
      }))
      .sort((a, b) => a.rate - b.rate);
    const total = questions.length;
    const overallRate = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { correct, incorrect, noAnswer, total, overallRate, fields };
  }, [answers, questions]);

  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  return (
    <div className="space-y-5 pt-2">
      <div className="rounded-[16px] border border-[var(--primary)]/35 bg-[var(--primary-soft)] p-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--primary-dark)]" strokeWidth={2.5} />
          <p className="text-[13px] font-bold text-[var(--text-2)]">模試の結果</p>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[44px] font-extrabold leading-none tracking-tight tabular-nums text-[var(--text-1)]">
            {stats.overallRate}
          </span>
          <span className="text-[18px] font-bold text-[var(--text-3)]">%</span>
        </div>
        <p className="mt-1 text-[12px] text-[var(--text-3)]">
          正解 {stats.correct} / {stats.total}問（不正解 {stats.incorrect}・無回答 {stats.noAnswer}）
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-3)]">
          所要時間 {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-3)]">
          <Target className="h-4 w-4" strokeWidth={2.5} />
          分野別正答率
        </h2>
        <div className="space-y-2">
          {stats.fields.map((field) => (
            <FieldResultRow key={field.name} field={field} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/study/review"
          className="choice-pressable inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-[13px] font-bold text-[var(--text-1)]"
        >
          <RefreshCcw className="h-4 w-4" strokeWidth={2.5} />
          復習する
        </Link>
        <Link
          href="/study/mock"
          className="choice-pressable inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[var(--primary)] px-3 py-3 text-[13px] font-bold text-white"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
          もう一度
        </Link>
      </div>
    </div>
  );
}

function FieldResultRow({
  field,
}: {
  field: { name: string; correct: number; total: number; rate: number };
}) {
  return (
    <div className="rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-bold text-[var(--text-1)]">
          {field.name}
        </p>
        <p className="shrink-0 text-[11px] font-medium text-[var(--text-3)]">
          {field.correct} / {field.total}問
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)]"
            style={{ width: `${Math.max(0, Math.min(100, field.rate))}%` }}
          />
        </div>
        <span className="w-10 text-right text-[11px] font-bold text-[var(--text-2)] tabular-nums">
          {field.rate}%
        </span>
      </div>
    </div>
  );
}

