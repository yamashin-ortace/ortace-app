"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Inbox } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import {
  parseCountFromSearchParams,
  type AllowedCount,
} from "@/components/study/question-count-selector";
import type { PlanType } from "@/lib/daily-limit";
import { isScorableQuestion, type Question } from "@/lib/questions";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import type { AnswerHistoryEntry } from "@/lib/answer-history";
import {
  getReviewQuestions,
  getUntouchedQuestions,
  getStagedWeakFields,
  getFieldStats,
} from "@/lib/answer-history/status";
import {
  pickAiCoachRecommended,
  pickMisconceptionQuestions,
} from "@/lib/ai-coach/recommendation";
import { WeakAiComment } from "@/components/study/weak-ai-comment";
import {
  analyzeMidCategoryWeakness,
  pickRotatedWeaknessRow,
  type MidCategoryWeaknessRow,
} from "@/lib/weak/mid-category-analysis";
import {
  MAX_FOCUSED_WEAK_QUESTION_COUNT,
  pickOrderedWeakQuestions,
} from "@/lib/weak/ordered-question-picker";
import { getCoolingQuestionIds } from "@/lib/weak/practice-state";
import { useWeakPracticeState } from "@/lib/weak/use-weak-practice-state";
import { shuffle } from "@/lib/quiz";

export type RecommendedMode =
  | "review"
  | "unanswered"
  | "weak"
  | "misconception"
  | "today";

type Props = {
  questions: Question[];
  mode: RecommendedMode;
  /** URL に `?count=` が無いときの既定出題数 */
  limit: AllowedCount;
  resumeLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  plan: PlanType;
};

const MAX_LIMIT = 20;

/**
 * 解答のたびに entries が更新されたり、出題数を変更したりするたびに pool が
 * 作り直されると、解答済み状態が新しい並びに対してズレてしまう。それを防ぐため
 * ハイドレーション直後に「最大出題数（20問）ぶん」を1回だけ確定し、UI の出題数は
 * その固定プールを slice するだけにする。出題数を増減しても先頭からの並びは変わらず、
 * 既に解答した問題はそのままの位置にとどまる。
 */
export function RecommendedPlayClient({
  questions,
  mode,
  limit: defaultLimit,
  resumeLabel,
  emptyTitle,
  emptyMessage,
  plan,
}: Props) {
  const { entries } = useAnswerHistoryList();
  const { state: weakPracticeState, recordSession: recordWeakPracticeSession } =
    useWeakPracticeState();
  const searchParams = useSearchParams();
  const limit = parseCountFromSearchParams(
    searchParams.get("count"),
    defaultLimit,
  );
  const [frozenPool, setFrozenPool] = useState<Question[] | null>(null);
  const [selectedExamWeakCategoryKey, setSelectedExamWeakCategoryKey] =
    useState<string | null>(null);
  const [examWeakPool, setExamWeakPool] = useState<Question[] | null>(null);
  const [activeExamWeakRow, setActiveExamWeakRow] =
    useState<MidCategoryWeaknessRow | null>(null);
  const isExamWeakMode = mode === "weak" && plan === "exam";

  useEffect(() => {
    if (isExamWeakMode) return;
    if (frozenPool !== null) return;
    const pool = pickPoolByMode(mode, questions, entries, MAX_LIMIT, plan);
    const ordered = orderPoolForMode(mode, pool, plan);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション後にプールを確定する
    setFrozenPool(ordered.slice(0, MAX_LIMIT));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ pool を凍結する
  }, [isExamWeakMode]);

  const examWeakAnalysis =
    isExamWeakMode
      ? analyzeMidCategoryWeakness(questions, entries, {
          practiceState: weakPracticeState,
        })
      : null;
  const selectedExamWeakRow = examWeakAnalysis
    ? pickRotatedWeaknessRow(
        examWeakAnalysis.rows,
        weakPracticeState.lastPracticedCategoryKey,
        selectedExamWeakCategoryKey,
      )
    : null;
  const focusedExamWeakPool = selectedExamWeakRow
    ? pickOrderedWeakQuestions(
        questions.filter(isScorableQuestion),
        entries,
        [selectedExamWeakRow],
        MAX_FOCUSED_WEAK_QUESTION_COUNT,
        {
          excludedQuestionIds: getCoolingQuestionIds(
            weakPracticeState,
            selectedExamWeakRow.categoryKey,
          ),
        },
      )
    : [];
  const sessionQuestions = isExamWeakMode
    ? examWeakPool
    : frozenPool
      ? frozenPool.slice(0, Math.min(limit, frozenPool.length))
      : null;

  if (!isExamWeakMode && sessionQuestions === null) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-3)]">
        読み込み中…
      </div>
    );
  }

  if (examWeakAnalysis?.readiness === "collecting") {
    return <WeakAiComment analysis={examWeakAnalysis} />;
  }

  if (examWeakAnalysis && examWeakAnalysis.rows.length === 0) {
    return <WeakAiComment analysis={examWeakAnalysis} />;
  }

  if (examWeakAnalysis && examWeakPool === null && selectedExamWeakRow) {
    return (
      <WeakAiComment
        analysis={examWeakAnalysis}
        selectedCategoryKey={selectedExamWeakRow.categoryKey}
        practiceQuestionCount={focusedExamWeakPool.length}
        onSelectCategory={setSelectedExamWeakCategoryKey}
        onStart={() => {
          setExamWeakPool(focusedExamWeakPool);
          setActiveExamWeakRow(selectedExamWeakRow);
        }}
      />
    );
  }

  if (!sessionQuestions || sessionQuestions.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <QuizPlayer
      questions={sessionQuestions}
      mode="random"
      plan={plan}
      resumeLabel={
        activeExamWeakRow
          ? `${activeExamWeakRow.minorCategory} 苦手克服`
          : resumeLabel
      }
      saveProgress={!isExamWeakMode}
      resultBackHref={isExamWeakMode ? "/study/weak" : undefined}
      resultBackLabel={isExamWeakMode ? "ほかの苦手テーマを見る" : undefined}
      onResultBack={
        isExamWeakMode
          ? () => {
              setExamWeakPool(null);
              setActiveExamWeakRow(null);
            }
          : undefined
      }
      onSessionComplete={
        isExamWeakMode && activeExamWeakRow
          ? ({ questions: completedQuestions, judgements }) => {
              recordWeakPracticeSession({
                categoryKey: activeExamWeakRow.categoryKey,
                questionIds: completedQuestions.map((question) => question.id),
                correctCount: completedQuestions.filter(
                  (question) => judgements[question.id] === "correct",
                ).length,
              });
            }
          : undefined
      }
      showAiCoachResultAnalysis={!isExamWeakMode}
      weakPracticeTheme={activeExamWeakRow?.minorCategory}
    />
  );
}

/**
 * モードごとに pool の並びを「最終的な出題順」に整える（凍結前の1回だけ）。
 * - today/unanswered/misconception：すでに pickPoolByMode 内で並び順が確定しているのでそのまま
 * - review：今日復習すべき優先順を保つ
 * - weak：ランダム性を持たせるためここで一度だけ shuffle する
 * - examのweak：中分類ごとに基礎→自信あり誤答→類題の順に組むため、そのまま
 */
function orderPoolForMode(
  mode: RecommendedMode,
  pool: Question[],
  plan: PlanType,
): Question[] {
  if (pool.length === 0) return [];
  if (mode === "weak" && plan === "exam") return pool;
  if (
    mode === "today" ||
    mode === "review" ||
    mode === "unanswered" ||
    mode === "misconception"
  ) {
    return pool;
  }
  return shuffle(pool);
}

function pickPoolByMode(
  mode: RecommendedMode,
  questions: Question[],
  entries: AnswerHistoryEntry[],
  limit: number,
  plan: PlanType,
): Question[] {
  const scorableQuestions = questions.filter(isScorableQuestion);
  if (mode === "review") {
    return getReviewQuestions(scorableQuestions, entries);
  }
  if (mode === "unanswered") {
    return getUntouchedQuestions(scorableQuestions, entries).sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      if (a.session !== b.session) return a.session === "am" ? -1 : 1;
      return a.displayNumber - b.displayNumber;
    });
  }
  if (mode === "weak") {
    if (plan === "exam") {
      const analysis = analyzeMidCategoryWeakness(scorableQuestions, entries);
      if (analysis.readiness !== "ready") return [];
      return pickOrderedWeakQuestions(
        scorableQuestions,
        entries,
        analysis.rows,
        limit,
      );
    }
    const stats = getFieldStats(scorableQuestions, entries);
    const staged = getStagedWeakFields(stats);
    // 確定（10問以上）を優先し、足りなければ暫定（5問以上）で補う。
    // 上位3分野まで対象にする。
    const ranked = [...staged.confirmed, ...staged.provisional];
    const topWeakFields = new Set(ranked.slice(0, 3).map((s) => s.field));
    if (topWeakFields.size === 0) return [];
    return scorableQuestions.filter((q) => topWeakFields.has(q.majorCategory));
  }
  if (mode === "misconception") {
    return pickMisconceptionQuestions(scorableQuestions, entries, limit);
  }
  return pickAiCoachRecommended(scorableQuestions, entries, limit).questions;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-muted)] text-[var(--text-3)]">
        <Inbox className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-bold text-[var(--text-1)]">{title}</p>
        <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
          {message}
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
