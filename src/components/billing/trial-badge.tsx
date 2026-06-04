import { Sparkles } from "lucide-react";
export function TrialBadge() {
  return (
    <p className="relative inline-flex items-center gap-1 rounded-[999px] border border-[var(--primary)] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[var(--primary-dark)] shadow-[0_8px_18px_rgba(38,174,161,0.14)]">
      <Sparkles className="size-3.5" strokeWidth={2.5} aria-hidden />
      初回14日間無料トライアル
      <span
        aria-hidden
        className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-b border-r border-[var(--primary)] bg-white"
      />
    </p>
  );
}
