"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { startNavigationPending } from "@/lib/navigation-pending";
import { cn } from "@/lib/utils";
import type { ExamRound, Field, Session } from "@/lib/questions";

const COUNT_OPTIONS = [10, 20, 50, "all"] as const;
const FILTER_HISTORY_KEY = "ortace.filterHistory";
const SESSION_OPTIONS: { id: Session; label: string }[] = [
  { id: "am", label: "午前" },
  { id: "pm", label: "午後" },
];

type Count = (typeof COUNT_OPTIONS)[number];

function formatCount(value: Count): string {
  return value === "all" ? "すべて" : String(value);
}
type FilterQuestionSummary = {
  round: ExamRound;
  session: Session;
  field: Field;
};
type FilterSelection = {
  rounds: ExamRound[];
  sessions: Session[];
  fields: Field[];
  count: Count;
};
type FilterHistoryItem = FilterSelection & {
  label: string;
  savedAt: string;
};

type LegacyFilterHistoryItem = {
  round?: "all" | ExamRound;
  session?: "all" | Session;
  field?: "all" | Field;
  count?: Count;
  label?: string;
  savedAt?: string;
};

type Props = {
  rounds: readonly ExamRound[];
  fields: readonly Field[];
  questions: readonly FilterQuestionSummary[];
};

export function FilterSettingsClient({ rounds, fields, questions }: Props) {
  const router = useRouter();
  const allRounds = useMemo(() => [...rounds], [rounds]);
  const allFields = useMemo(() => [...fields], [fields]);
  const allSessions = useMemo<Session[]>(() => ["am", "pm"], []);
  const [selectedRounds, setSelectedRounds] = useState<ExamRound[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [count, setCount] = useState<Count | null>(null);
  const [history, setHistory] = useState<FilterHistoryItem[]>([]);

  const effectiveRounds = selectedRounds.length > 0 ? selectedRounds : allRounds;
  const effectiveSessions = selectedSessions.length > 0 ? selectedSessions : allSessions;
  const effectiveFields = selectedFields.length > 0 ? selectedFields : allFields;

  const matchingCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          effectiveRounds.includes(question.round) &&
          effectiveSessions.includes(question.session) &&
          effectiveFields.includes(question.field),
      ).length,
    [questions, effectiveFields, effectiveRounds, effectiveSessions],
  );

  const fieldCounts = useMemo(() => {
    return Object.fromEntries(
      fields.map((field) => [
        field,
        questions.filter((question) => question.field === field).length,
      ]),
    ) as Record<Field, number>;
  }, [fields, questions]);

  const canStart = matchingCount > 0 && count !== null;

  const handleStart = () => {
    if (!canStart || count === null) return;
    const selection: FilterSelection = {
      rounds: effectiveRounds,
      sessions: effectiveSessions,
      fields: effectiveFields,
      count,
    };
    const item = createHistoryItem(selection, allRounds.length, allFields.length);
    const nextHistory = saveFilterHistory(item, allRounds, allFields);
    setHistory(nextHistory);
    const params = buildParams(item);
    startNavigationPending();
    router.push(`/study/filter/play?${params.toString()}`);
  };

  const handleHistoryStart = (item: FilterHistoryItem) => {
    setSelectedRounds(item.rounds);
    setSelectedSessions(item.sessions);
    setSelectedFields(item.fields);
    setCount(item.count);
    const nextHistory = saveFilterHistory(item, allRounds, allFields);
    setHistory(nextHistory);
    startNavigationPending();
    router.push(`/study/filter/play?${buildParams(item).toString()}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      setHistory(readFilterHistory(allRounds, allFields));
    }, 0);
    return () => clearTimeout(timer);
  }, [allFields, allRounds]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <ControlGroup
          label="回"
          hint={`${selectedRounds.length}件選択中`}
          actions={
            <SelectionActions
              onSelectAll={() => setSelectedRounds(allRounds)}
              onClear={() => setSelectedRounds([])}
            />
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {allRounds.map((item) => (
              <OptionButton
                key={item}
                selected={selectedRounds.includes(item)}
                onClick={() => setSelectedRounds(toggleSelected(selectedRounds, item))}
              >
                第{item}回
              </OptionButton>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="午前/午後">
          <div className="grid grid-cols-2 gap-2">
            {SESSION_OPTIONS.map((item) => (
              <OptionButton
                key={item.id}
                selected={selectedSessions.includes(item.id)}
                onClick={() => setSelectedSessions(toggleSelected(selectedSessions, item.id))}
              >
                {item.label}
              </OptionButton>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup
          label="分野"
          hint={`${selectedFields.length}件選択中`}
          actions={
            <SelectionActions
              onSelectAll={() => setSelectedFields(allFields)}
              onClear={() => setSelectedFields([])}
            />
          }
        >
          <div className="grid gap-2">
            {allFields.map((item) => (
              <OptionButton
                key={item}
                selected={selectedFields.includes(item)}
                onClick={() => setSelectedFields(toggleSelected(selectedFields, item))}
              >
                <span className="flex-1 text-left">{item}</span>
                <span className="text-[10px] text-[var(--text-3)]">
                  {fieldCounts[item]}問
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
                {formatCount(item)}
              </OptionButton>
            ))}
          </div>
        </ControlGroup>
      </section>

      <div className="rounded-[14px] border border-border bg-[var(--bg-card)] px-4 py-3">
        <p className="text-[11px] font-semibold text-[var(--text-3)]">
          条件に合う問題
        </p>
        <p className="mt-1 text-[24px] font-extrabold text-[var(--text-1)]">
          {matchingCount.toLocaleString()}
          <span className="ml-1 text-[13px] font-bold text-[var(--text-3)]">
            問
          </span>
        </p>
      </div>

      {history.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
            最近の条件
          </h2>
          <div className="grid gap-2">
            {history.map((item) => (
              <button
                key={getHistorySignature(item)}
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

      <PrimaryCta onClick={handleStart} disabled={!canStart}>
        <Play className="h-4 w-4" strokeWidth={2.5} />
        出題開始
      </PrimaryCta>
    </div>
  );
}

function toggleSelected<T>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function buildParams(item: FilterSelection) {
  return new URLSearchParams({
    count: String(item.count),
    rounds: item.rounds.join(","),
    sessions: item.sessions.join(","),
    fields: item.fields.join("|"),
  });
}

function createHistoryItem(
  selection: FilterSelection,
  totalRoundCount: number,
  totalFieldCount: number,
): FilterHistoryItem {
  return {
    ...selection,
    label: `${formatRoundsSummary(selection.rounds, totalRoundCount)} / ${formatSessionSummary(
      selection.sessions,
    )} / ${formatFieldsSummary(selection.fields, totalFieldCount)} / ${formatCount(selection.count)}${
      selection.count === "all" ? "" : "問"
    }`,
    savedAt: new Date().toISOString(),
  };
}

function readFilterHistory(
  allRounds: ExamRound[],
  allFields: Field[],
): FilterHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FILTER_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed)
      ? parsed
          .map((item) => normalizeHistoryItem(item, allRounds, allFields))
          .filter((item): item is FilterHistoryItem => item !== null)
          .slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function saveFilterHistory(
  item: FilterHistoryItem,
  allRounds: ExamRound[],
  allFields: Field[],
): FilterHistoryItem[] {
  const current = readFilterHistory(allRounds, allFields);
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

function normalizeHistoryItem(
  value: unknown,
  allRounds: ExamRound[],
  allFields: Field[],
): FilterHistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<FilterHistoryItem> & LegacyFilterHistoryItem;
  const count = (COUNT_OPTIONS as readonly (number | string)[]).includes(
    item.count as number | string,
  )
    ? (item.count as Count)
    : "all";

  if (Array.isArray(item.rounds) && Array.isArray(item.sessions) && Array.isArray(item.fields)) {
    const rounds = item.rounds.filter((round): round is ExamRound =>
      allRounds.includes(round as ExamRound),
    );
    const sessions = item.sessions.filter((session): session is Session =>
      session === "am" || session === "pm",
    );
    const fields = item.fields.filter((field): field is Field =>
      allFields.includes(field as Field),
    );
    if (rounds.length === 0 || sessions.length === 0 || fields.length === 0) return null;
    return {
      rounds,
      sessions,
      fields,
      count,
      label:
        typeof item.label === "string"
          ? item.label
          : createHistoryItem({ rounds, sessions, fields, count }, allRounds.length, allFields.length)
              .label,
      savedAt: typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString(),
    };
  }

  const legacy = item as LegacyFilterHistoryItem;
  const rounds =
    legacy.round === "all" || typeof legacy.round === "undefined"
      ? allRounds
      : allRounds.includes(legacy.round)
        ? [legacy.round]
        : allRounds;
  const sessions =
    legacy.session === "all" || typeof legacy.session === "undefined"
      ? (["am", "pm"] as Session[])
      : legacy.session === "am" || legacy.session === "pm"
        ? [legacy.session]
        : (["am", "pm"] as Session[]);
  const fields =
    legacy.field === "all" || typeof legacy.field === "undefined"
      ? allFields
      : allFields.includes(legacy.field)
        ? [legacy.field]
        : allFields;

  return createHistoryItem({ rounds, sessions, fields, count }, allRounds.length, allFields.length);
}

function getHistorySignature(item: FilterSelection): string {
  return `${item.rounds.join(",")}|${item.sessions.join(",")}|${item.fields.join("|")}|${item.count}`;
}

function formatRoundsSummary(rounds: ExamRound[], totalCount: number): string {
  if (rounds.length === totalCount) return "全回";
  if (rounds.length === 1) return `第${rounds[0]}回`;
  return `第${rounds[0]}回ほか${rounds.length - 1}回`;
}

function formatSessionSummary(sessions: Session[]): string {
  if (sessions.length === 2) return "午前/午後";
  if (sessions[0] === "am") return "午前";
  if (sessions[0] === "pm") return "午後";
  return "未選択";
}

function formatFieldsSummary(fields: Field[], totalCount: number): string {
  if (fields.length === totalCount) return "全分野";
  if (fields.length === 1) return fields[0];
  return `分野${fields.length}つ`;
}

function ControlGroup({
  label,
  hint,
  actions,
  children,
}: {
  label: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-[var(--text-2)]">{label}</p>
        <div className="flex items-center gap-2">
          {hint ? (
            <p className="text-[11px] font-medium text-[var(--text-3)]">{hint}</p>
          ) : null}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

function SelectionActions({
  onSelectAll,
  onClear,
}: {
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onSelectAll}
        className="choice-pressable rounded-full border border-border bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
      >
        全選択
      </button>
      <button
        type="button"
        onClick={onClear}
        className="choice-pressable rounded-full border border-border bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
      >
        全解除
      </button>
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
