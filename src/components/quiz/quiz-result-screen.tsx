"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Home,
  Lightbulb,
  LoaderCircle,
  RefreshCcw,
  RotateCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { ChoiceKey, Question } from "@/lib/questions";
import type { AnswerJudgement } from "@/lib/quiz";
import { AiCoachResultAnalysis } from "./ai-coach-result-analysis";
import { QuestionReviewItem } from "./question-review-item";

type Props = {
  questions: Question[];
  judgements: Record<string, AnswerJudgement>;
  selectedAnswers: Record<string, ChoiceKey[]>;
  /** 未指定時は「もう一度」ボタンを表示しない */
  onRestart?: () => void;
  /** 結果画面下部の戻り先リンク。既定は学習タブ */
  backHref?: string;
  backLabel?: string;
  /** 指定時は下部の戻る操作をリンクではなくボタンとして扱う */
  onBack?: () => void;
  showAiCoachAnalysis?: boolean;
  canUseAiThemeCheck?: boolean;
  /** 苦手克服の集中演習で、専用フィードバックを表示するテーマ名 */
  weakPracticeTheme?: string;
};

export function QuizResultScreen({
  questions,
  judgements,
  selectedAnswers,
  onRestart,
  backHref = "/study",
  backLabel = "学習タブへ戻る",
  onBack,
  showAiCoachAnalysis = true,
  canUseAiThemeCheck = false,
  weakPracticeTheme,
}: Props) {
  const [reviewOpen, setReviewOpen] = useState(true);
  const [showToast, setShowToast] = useState(true);
  const [toastPhase, setToastPhase] = useState<"saving" | "ready">("saving");
  const total = questions.length;
  const correct = questions.filter(
    (q) => judgements[q.id] === "correct",
  ).length;
  const incorrect = questions.filter(
    (q) => judgements[q.id] === "incorrect",
  ).length;
  const noAnswer = questions.filter(
    (q) => judgements[q.id] === "no_answer",
  ).length;
  const ratio = total === 0 ? 0 : Math.round((correct / total) * 100);

  useEffect(() => {
    const phaseTimer = window.setTimeout(() => setToastPhase("ready"), 1800);
    const hideTimer = window.setTimeout(() => setShowToast(false), 4400);
    return () => {
      window.clearTimeout(phaseTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {showToast ? (
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-40 grid w-[min(calc(100vw-48px),360px)] animate-result-toast place-items-center overflow-hidden rounded-[22px] border border-[var(--primary)] bg-linear-to-br from-[var(--primary-soft)] via-[var(--bg-card)] to-[var(--primary-soft)] px-6 py-4 text-center text-[var(--primary-dark)] shadow-[0_22px_52px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-[var(--primary)] to-transparent opacity-45" />
          <span className="pointer-events-none absolute -top-12 right-8 h-24 w-24 rounded-full bg-[var(--primary)] opacity-15 blur-2xl" />
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--primary)] bg-[var(--bg-card)] text-[var(--primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            {toastPhase === "saving" ? (
              <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
            )}
          </span>
          <span className="relative mt-2 text-[16px] font-extrabold tracking-tight">
            おつかれさまでした
          </span>
          <span className="relative mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--text-2)]">
            {toastPhase === "saving" ? (
              <>
                <span>回答を保存中</span>
                <span className="inline-flex gap-0.5">
                  <span className="animate-saving-dot">.</span>
                  <span className="animate-saving-dot [animation-delay:160ms]">.</span>
                  <span className="animate-saving-dot [animation-delay:320ms]">.</span>
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>AIコーチMiLu先生が次の提案に反映しました</span>
              </>
            )}
          </span>
        </div>
      ) : null}

      <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="border-b border-border pb-3 text-center">
          <p className="text-[11px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
            正答率
          </p>
          <div className="mt-1 flex items-center justify-center gap-2 text-[var(--text-1)]">
            <CheckCircle2
              className="h-5 w-5 text-[#4CAF7A]"
              strokeWidth={2.5}
              aria-hidden
            />
            <p className="text-[40px] font-extrabold tracking-tight tabular-nums">
              {ratio}
              <span className="ml-1 text-[17px] font-bold text-[var(--text-3)]">%</span>
            </p>
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--text-2)] tabular-nums">
            {correct} / {total}問正解
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile
            label="正解"
            value={correct}
            icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-[#1F5E3F]"
            bgClass="bg-[#EAF7EF]"
          />
          <StatTile
            label="不正解"
            value={incorrect}
            icon={<XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-[#9B1E1E]"
            bgClass="bg-[#FDECEC]"
          />
          <StatTile
            label="正答なし"
            value={noAnswer}
            icon={<CircleSlash className="h-3.5 w-3.5" strokeWidth={2.5} />}
            colorClass="text-amber-700 dark:text-amber-400"
            bgClass="bg-amber-50 dark:bg-amber-950/30"
          />
        </div>
      </div>

      {weakPracticeTheme ? (
        <WeakPracticeOutcome theme={weakPracticeTheme} ratio={ratio} />
      ) : null}

      {showAiCoachAnalysis ? (
        <AiCoachResultAnalysis
          questions={questions}
          judgements={judgements}
          selectedAnswers={selectedAnswers}
          canUseAiThemeCheck={canUseAiThemeCheck}
        />
      ) : null}

      <ResultNextActions incorrect={incorrect} onRestart={onRestart} />

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setReviewOpen((v) => !v)}
          aria-expanded={reviewOpen}
          className="flex w-full items-center justify-between rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-2.5 text-left"
        >
          <span className="text-[13px] font-semibold text-[var(--text-2)]">
            問題ごとに見直す（{total}問）
          </span>
          <span className="text-[var(--text-3)]">
            {reviewOpen ? (
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            )}
          </span>
        </button>
        {reviewOpen ? (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <QuestionReviewItem
                key={question.id}
                index={index}
                total={total}
                question={question}
                judgement={judgements[question.id]}
                selected={selectedAnswers[question.id] ?? []}
              />
            ))}
          </div>
        ) : null}
      </section>

      <div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-6 py-3 text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
            {backLabel}
          </button>
        ) : (
          <Link
            href={backHref}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-[var(--bg-card)] px-6 py-3 text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function WeakPracticeOutcome({ theme, ratio }: { theme: string; ratio: number }) {
  const outcome =
    ratio >= 80
      ? {
          title: "克服に近づきました",
          message:
            "今回の演習では安定して正解できました。数日後に類題でもう一度確認できると、さらに安心です。",
          colorClass:
            "border-[#76B991]/45 bg-[#EFF9F3] dark:border-[#76B991]/30 dark:bg-[#163124]",
          iconClass:
            "bg-[#CDEBD8] text-[#287148] dark:bg-[#28543A] dark:text-[#BCE9CC]",
          icon: CheckCircle2,
        }
      : ratio >= 60
        ? {
            title: "もう一度確認しましょう",
            message:
              "理解は進んでいますが、まだ迷いやすい部分があります。間違えた問題の解説を読み、復習キューで確認しましょう。",
            colorClass:
              "border-[#F0B45C]/55 bg-[#FFF6E5] dark:border-[#F0B45C]/35 dark:bg-[#3A2A12]",
            iconClass:
              "bg-[#F0B45C]/35 text-[#8A5A18] dark:text-[#FFD58A]",
            icon: Lightbulb,
          }
        : {
            title: "基礎から戻りましょう",
            message:
              "このテーマは、基礎事項から整理すると伸びやすい状態です。今回の解説と間違えた問題を丁寧に見直しましょう。",
            colorClass:
              "border-[#E68A8A]/50 bg-[#FFF1F1] dark:border-[#E68A8A]/30 dark:bg-[#3B1D1D]",
            iconClass:
              "bg-[#F7CDCD] text-[#9B1E1E] dark:bg-[#5A2B2B] dark:text-[#F8BABA]",
            icon: RefreshCcw,
          };
  const Icon = outcome.icon;

  return (
    <section className={`rounded-[14px] border px-4 py-4 ${outcome.colorClass}`}>
      <div className="flex gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${outcome.iconClass}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-bold text-[var(--text-3)]">
            苦手克服: {theme}
          </p>
          <p className="text-[15px] font-extrabold text-[var(--text-1)]">
            {outcome.title}
          </p>
          <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
            {outcome.message}
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultNextActions({
  incorrect,
  onRestart,
}: {
  incorrect: number;
  onRestart?: () => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
        次にやること
      </h2>
      <div className="space-y-2">
        {incorrect > 0 ? (
          <ResultActionLink
            href="/study/review"
            icon={<RefreshCcw className="h-4 w-4" strokeWidth={2.5} />}
            title="間違えた問題を復習"
            detail={`${incorrect}問を復習キューに反映済み`}
            primary
          />
        ) : (
          <ResultActionLink
            href="/study/today"
            icon={<Sparkles className="h-4 w-4" strokeWidth={2.5} />}
            title="今日のおすすめをもう1セット"
            detail="今の結果を次の20問に反映"
            primary
          />
        )}
        {incorrect > 0 || onRestart ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {incorrect > 0 ? (
              <ResultActionLink
                href="/study/today"
                icon={<Sparkles className="h-4 w-4" strokeWidth={2.5} />}
                title="今日のおすすめへ"
                detail="復習・弱点・未着手をまとめて解く"
              />
            ) : null}
            {onRestart ? (
              <button
                type="button"
                onClick={onRestart}
                className="choice-pressable flex min-h-[3.75rem] items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 text-left text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--bg-muted)] text-[var(--text-2)]">
                  <RotateCw className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold">
                    同じ問題をもう一度
                  </span>
                  <span className="block text-[11px] text-[var(--text-3)]">
                    解き直して確認
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ResultActionLink({
  href,
  icon,
  title,
  detail,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "choice-pressable flex min-h-[3.75rem] items-center gap-3 rounded-[12px] bg-[var(--primary)] px-3 text-white shadow-[0_4px_14px_var(--primary-shadow-soft)]"
          : "choice-pressable flex min-h-[3.75rem] items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 text-[var(--text-1)] transition-colors hover:bg-[var(--bg-muted)]"
      }
    >
      <span
        className={
          primary
            ? "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white/18 text-white"
            : "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--bg-muted)] text-[var(--text-2)]"
        }
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{title}</span>
        <span
          className={
            primary
              ? "block text-[11px] text-white/80"
              : "block text-[11px] text-[var(--text-3)]"
          }
        >
          {detail}
        </span>
      </span>
    </Link>
  );
}

function StatTile({
  label,
  value,
  icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={`rounded-[12px] px-2.5 py-2.5 text-center ${bgClass}`}>
      <p
        className={`mx-auto grid h-6 w-6 place-items-center rounded-full bg-white/75 ${colorClass} dark:bg-white/10`}
      >
        {icon}
      </p>
      <p className="mt-1 text-[10px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
        {label}
      </p>
      <p className={`mt-0.5 text-[22px] font-extrabold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
