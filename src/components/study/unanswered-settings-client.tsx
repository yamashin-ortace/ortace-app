"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Shuffle } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";
import {
  ALLOWED_COUNTS,
  type AllowedCount,
} from "@/components/study/question-count-selector";
import { startNavigationPending } from "@/lib/navigation-pending";
import { useAnswerHistoryList } from "@/lib/answer-history/use-answer-history";
import { getUntouchedQuestions } from "@/lib/answer-history/status";
import type { Field, Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

type SelectionMode = "selected" | "random";

const DEFAULT_COUNT: AllowedCount = 20;

type Props = {
  questions: Question[];
  fields: readonly Field[];
};

/**
 * 「未着手から解く」の設定画面。
 * - 出題方法：選んだ分野から / 全分野からランダム
 * - 分野は複数選択可。初期状態は未選択。
 * - 出題数：10/15/20
 */
export function UnansweredSettingsClient({ questions, fields }: Props) {
  const router = useRouter();
  const { entries } = useAnswerHistoryList();
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<SelectionMode>("selected");
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [count, setCount] = useState<AllowedCount>(DEFAULT_COUNT);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LocalStorage 由来の値を SSR と分離するための hydration ガード
    setHydrated(true);
  }, []);

  const untouched = useMemo(() => {
    if (!hydrated) return [] as Question[];
    return getUntouchedQuestions(questions, entries);
  }, [hydrated, questions, entries]);

  const untouchedByField = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of untouched) {
      map.set(q.majorCategory, (map.get(q.majorCategory) ?? 0) + 1);
    }
    return map;
  }, [untouched]);

  const selectedUntouchedCount = useMemo(() => {
    if (mode === "random") return untouched.length;
    const fieldSet = new Set(selectedFields);
    return untouched.filter((q) => fieldSet.has(q.majorCategory as Field)).length;
  }, [mode, selectedFields, untouched]);

  const canStart =
    hydrated &&
    selectedUntouchedCount > 0 &&
    (mode === "random" || selectedFields.length > 0);

  const handleStart = () => {
    if (!canStart) return;
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (mode === "selected") {
      params.set("fields", selectedFields.join("|"));
    }
    if (count !== DEFAULT_COUNT) {
      params.set("count", String(count));
    }
    startNavigationPending();
    router.push(`/study/unanswered/play?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-[12px] font-bold text-[var(--text-2)]">出題方法</p>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            selected={mode === "selected"}
            onClick={() => setMode("selected")}
            title="選んだ分野から"
            description="自分で分野を選んで出題"
          />
          <ModeButton
            selected={mode === "random"}
            onClick={() => setMode("random")}
            icon={<Shuffle className="h-4 w-4" strokeWidth={2.5} />}
            title="全分野からランダム"
            description="未着手の中からランダム抽出"
          />
        </div>
      </section>

      {mode === "selected" ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-[var(--text-2)]">分野</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[var(--text-3)]">
                {selectedFields.length}件選択中
              </span>
              <button
                type="button"
                onClick={() => setSelectedFields([...fields])}
                className="choice-pressable rounded-full border border-border bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
              >
                全選択
              </button>
              <button
                type="button"
                onClick={() => setSelectedFields([])}
                className="choice-pressable rounded-full border border-border bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
              >
                全解除
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            {fields.map((field) => {
              const selected = selectedFields.includes(field);
              const remaining = hydrated
                ? (untouchedByField.get(field) ?? 0)
                : null;
              const disabled = hydrated && remaining === 0;
              return (
                <button
                  key={field}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedFields((prev) =>
                      prev.includes(field)
                        ? prev.filter((f) => f !== field)
                        : [...prev, field],
                    );
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "choice-pressable flex min-h-11 items-center gap-2 rounded-[12px] border px-3 py-2 text-left text-[13px] font-bold",
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                      : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:border-[var(--text-3)]",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="flex-1">{field}</span>
                  <span className="text-[10px] text-[var(--text-3)]">
                    {remaining === null
                      ? "計算中…"
                      : remaining === 0
                        ? "未着手なし"
                        : `未着手 ${remaining}問`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="text-[12px] font-bold text-[var(--text-2)]">出題数</p>
        <div className="grid grid-cols-3 gap-2">
          {ALLOWED_COUNTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCount(option)}
              aria-pressed={count === option}
              className={cn(
                "choice-pressable flex min-h-11 items-center justify-center rounded-[12px] border px-3 py-2 text-[13px] font-bold",
                count === option
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:border-[var(--text-3)]",
              )}
            >
              {option}問
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3">
        <p className="text-[11px] font-semibold text-[var(--text-3)]">
          {mode === "random"
            ? "全分野の未着手"
            : selectedFields.length > 0
              ? "選択中の未着手"
              : "分野を選んでください"}
        </p>
        <p className="mt-1 text-[24px] font-extrabold text-[var(--text-1)]">
          {hydrated ? selectedUntouchedCount.toLocaleString() : "--"}
          <span className="ml-1 text-[13px] font-bold text-[var(--text-3)]">
            問
          </span>
        </p>
        {hydrated && selectedUntouchedCount > 0 && selectedUntouchedCount < count ? (
          <p className="mt-1 text-[11px] text-[var(--text-3)]">
            足りない分は表示できないため、最大 {selectedUntouchedCount}問の出題になります。
          </p>
        ) : null}
      </div>

      <PrimaryCta onClick={handleStart} disabled={!canStart}>
        <Play className="h-4 w-4" strokeWidth={2.5} />
        出題開始
      </PrimaryCta>
    </div>
  );
}

function ModeButton({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "choice-pressable flex min-h-[64px] flex-col items-start justify-center gap-1 rounded-[12px] border px-3 py-2 text-left",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
          : "border-border bg-[var(--bg-card)] hover:border-[var(--text-3)]",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1 text-[13px] font-bold",
          selected ? "text-[var(--primary-dark)]" : "text-[var(--text-1)]",
        )}
      >
        {icon}
        {title}
      </span>
      <span className="text-[11px] leading-snug text-[var(--text-3)]">
        {description}
      </span>
    </button>
  );
}
