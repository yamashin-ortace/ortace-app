"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Play, SlidersHorizontal } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { cn } from "@/lib/utils";
import type { ExamRound, Field, Session } from "@/lib/questions";

const COUNT_OPTIONS = [10, 20, 50, 100] as const;
const FILTER_HISTORY_KEY = "ortace.filterHistory";
type Count = (typeof COUNT_OPTIONS)[number];
type RoundOption = "all" | ExamRound;
type SessionOption = "all" | Session;
type FieldOption = "all" | Field;
type FilterHistoryItem = {
  round: RoundOption;
  session: SessionOption;
  field: FieldOption;
  count: Count;
  label: string;
  savedAt: string;
};

const SESSION_OPTIONS: { id: SessionOption; label: string }[] = [
  { id: "all", label: "全問" },
  { id: "am", label: "午前" },
  { id: "pm", label: "午後" },
];

type Props = {
  rounds: readonly ExamRound[];
  fields: readonly Field[];
  countsByField: Record<Field, number>;
};

export function FilterSettingsClient({ rounds, fields, countsByField }: Props) {
  const router = useRouter();
  const [round, setRound] = useState<RoundOption>("all");
  const [session, setSession] = useState<SessionOption>("all");
  const [field, setField] = useState<FieldOption>("all");
  const [count, setCount] = useState<Count>(20);
  const [history, setHistory] = useState<FilterHistoryItem[]>([]);

  const selectedFieldCount = useMemo(() => {
    if (field === "all") return null;
    return countsByField[field];
  }, [countsByField, field]);

  const handleStart = () => {
    const item = createHistoryItem({ round, session, field, count });
    const nextHistory = saveFilterHistory(item);
    setHistory(nextHistory);
    const params = buildParams(item);
    router.push(`/study/filter/play?${params.toString()}`);
  };

  const handleHistoryStart = (item: FilterHistoryItem) => {
    setRound(item.round);
    setSession(item.session);
    setField(item.field);
    setCount(item.count);
    const nextHistory = saveFilterHistory(item);
    setHistory(nextHistory);
    router.push(`/study/filter/play?${buildParams(item).toString()}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      setHistory(readFilterHistory());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle icon={<SlidersHorizontal className="h-4 w-4" />}>
          条件
        </SectionTitle>

        <div className="space-y-4">
          <ControlGroup label="回">
            <div className="grid grid-cols-3 gap-2">
              <OptionButton
                selected={round === "all"}
                onClick={() => setRound("all")}
              >
                全回
              </OptionButton>
              {[...rounds].reverse().map((item) => (
                <OptionButton
                  key={item}
                  selected={round === item}
                  onClick={() => setRound(item)}
                >
                  第{item}回
                </OptionButton>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="午前・午後">
            <div className="grid grid-cols-3 gap-2">
              {SESSION_OPTIONS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={session === item.id}
                  onClick={() => setSession(item.id)}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup
            label="分野"
            hint={selectedFieldCount ? `${selectedFieldCount}問` : undefined}
          >
            <div className="grid gap-2">
              <OptionButton
                selected={field === "all"}
                onClick={() => setField("all")}
              >
                すべての分野
              </OptionButton>
              {fields.map((item) => (
                <OptionButton
                  key={item}
                  selected={field === item}
                  onClick={() => setField(item)}
                >
                  <span className="flex-1 text-left">{item}</span>
                  <span className="text-[10px] text-[var(--text-3)]">
                    {countsByField[item]}問
                  </span>
                </OptionButton>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="問題数">
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map((item) => (
                <OptionButton
                  key={item}
                  selected={count === item}
                  onClick={() => setCount(item)}
                >
                  {item}
                </OptionButton>
              ))}
            </div>
          </ControlGroup>
        </div>
      </section>

      {history.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
            最近の条件
          </h2>
          <div className="grid gap-2">
            {history.map((item) => (
              <button
                key={`${item.round}-${item.session}-${item.field}-${item.count}`}
                type="button"
                onClick={() => handleHistoryStart(item)}
                className="choice-pressable rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-left text-[13px] font-bold text-[var(--text-1)] hover:border-[var(--text-3)]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <PrimaryCta onClick={handleStart}>
        <Play className="h-4 w-4" strokeWidth={2.5} />
        出題開始
      </PrimaryCta>
    </div>
  );
}

function buildParams(item: Pick<FilterHistoryItem, "round" | "session" | "field" | "count">) {
  return new URLSearchParams({
    count: String(item.count),
    round: String(item.round),
    session: item.session,
    field: item.field,
  });
}

function createHistoryItem({
  round,
  session,
  field,
  count,
}: Pick<FilterHistoryItem, "round" | "session" | "field" | "count">): FilterHistoryItem {
  const roundLabel = round === "all" ? "全回" : `第${round}回`;
  const sessionLabel =
    SESSION_OPTIONS.find((item) => item.id === session)?.label ?? "全問";
  const fieldLabel = field === "all" ? "すべての分野" : field;
  return {
    round,
    session,
    field,
    count,
    label: `${roundLabel} / ${sessionLabel} / ${fieldLabel} / ${count}問`,
    savedAt: new Date().toISOString(),
  };
}

function readFilterHistory(): FilterHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FILTER_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FilterHistoryItem[];
    return Array.isArray(parsed) ? parsed.filter(isFilterHistoryItem).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveFilterHistory(item: FilterHistoryItem): FilterHistoryItem[] {
  const current = readFilterHistory();
  const signature = getHistorySignature(item);
  const next = [
    { ...item, savedAt: new Date().toISOString() },
    ...current.filter((entry) => getHistorySignature(entry) !== signature),
  ].slice(0, 5);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FILTER_HISTORY_KEY, JSON.stringify(next));
  }
  return next;
}

function getHistorySignature(item: FilterHistoryItem): string {
  return `${item.round}|${item.session}|${item.field}|${item.count}`;
}

function isFilterHistoryItem(value: unknown): value is FilterHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<FilterHistoryItem>;
  return (
    (item.round === "all" || typeof item.round === "number") &&
    (item.session === "all" || item.session === "am" || item.session === "pm") &&
    (item.field === "all" || typeof item.field === "string") &&
    COUNT_OPTIONS.includes(item.count as Count) &&
    typeof item.label === "string" &&
    typeof item.savedAt === "string"
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-3)]">
      {icon}
      {children}
    </h2>
  );
}

function ControlGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-[var(--text-2)]">{label}</p>
        {hint ? (
          <p className="text-[11px] font-medium text-[var(--text-3)]">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "choice-pressable flex min-h-11 items-center justify-center gap-2 rounded-[12px] border px-3 py-2 text-[13px] font-bold",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
          : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:border-[var(--text-3)]",
      )}
    >
      {children}
    </button>
  );
}
