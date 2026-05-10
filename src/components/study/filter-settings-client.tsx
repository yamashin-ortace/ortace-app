"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Play, SlidersHorizontal } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { cn } from "@/lib/utils";
import type { ExamRound, Field, Session } from "@/lib/questions";

const COUNT_OPTIONS = [10, 20, 50, 100] as const;
type Count = (typeof COUNT_OPTIONS)[number];
type RoundOption = "all" | ExamRound;
type SessionOption = "all" | Session;
type FieldOption = "all" | Field;

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

  const selectedFieldCount = useMemo(() => {
    if (field === "all") return null;
    return countsByField[field];
  }, [countsByField, field]);

  const handleStart = () => {
    const params = new URLSearchParams({
      count: String(count),
      round: String(round),
      session,
      field,
    });
    router.push(`/study/filter/play?${params.toString()}`);
  };

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

      <PrimaryCta onClick={handleStart}>
        <Play className="h-4 w-4" strokeWidth={2.5} />
        出題開始
      </PrimaryCta>
    </div>
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
