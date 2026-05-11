"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useQuizSettings } from "@/lib/quiz-settings/use-quiz-settings";
import { cn } from "@/lib/utils";

/**
 * 「解答前に Try #N バッジを表示する」トグル
 * デフォルトは ON。詳細（過去の選んだ選択肢など）は解答後にしか出ない。
 */
export function AttemptBadgeSetting() {
  const [hydrated, setHydrated] = useState(false);
  const { showAttemptCountBeforeAnswer, setShowAttemptCountBeforeAnswer } =
    useQuizSettings();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション後に最新値を反映
    setHydrated(true);
  }, []);

  const enabled = hydrated ? showAttemptCountBeforeAnswer : true;

  return (
    <button
      type="button"
      onClick={() => setShowAttemptCountBeforeAnswer(!enabled)}
      aria-pressed={enabled}
      className={cn(
        "flex w-full items-start gap-3 rounded-[12px] border border-border bg-[var(--bg-card)] px-3 py-3 text-left transition-colors",
        "hover:bg-[var(--bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[10px]",
          enabled
            ? "bg-[var(--primary-soft)] text-[var(--primary-dark)]"
            : "bg-[var(--bg-muted)] text-[var(--text-3)]",
        )}
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="flex-1 space-y-0.5">
        <p className="text-[13px] font-bold text-[var(--text-1)]">
          解答前に「Try #N」バッジを表示する
        </p>
        <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
          何回目の挑戦かを問題ページの上に小さく表示します。詳細（前回選んだ選択肢や正誤）は解答後にしか出ません。
        </p>
      </div>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-[var(--primary)]" : "bg-[var(--bg-muted)]",
        )}
      >
        <span
          className={cn(
            "absolute h-5 w-5 rounded-full bg-white shadow transition-[left]",
            enabled ? "left-5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
