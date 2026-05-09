"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { BackLink } from "@/components/study/back-link";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { cn } from "@/lib/utils";

const COUNT_OPTIONS = [10, 20, 50, 100] as const;
type Count = (typeof COUNT_OPTIONS)[number];

export default function RandomModePage() {
  const router = useRouter();
  const [count, setCount] = useState<Count>(20);

  const handleStart = () => {
    router.push(`/study/random/play?count=${count}`);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          ランダム出題
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          全10回・1,500問からシャッフルして出題します
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          問題数
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {COUNT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setCount(opt)}
              className={cn(
                "rounded-[12px] border-2 px-4 py-4 text-[15px] font-bold tracking-tight transition-colors",
                count === opt
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-border bg-[var(--bg-card)] text-[var(--text-1)] hover:border-[var(--text-3)]",
              )}
              aria-pressed={count === opt}
            >
              {opt}問
            </button>
          ))}
        </div>
      </section>

      <PrimaryCta onClick={handleStart}>
        <Shuffle className="h-4 w-4" strokeWidth={2.5} />
        出題開始
      </PrimaryCta>
    </div>
  );
}
