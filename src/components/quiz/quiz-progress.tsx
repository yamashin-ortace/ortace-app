type Props = {
  current: number;
  total: number;
};

/** 進捗バー（カウントを右にインライン表示） */
export function QuizProgress({ current, total }: Props) {
  const percent = total === 0 ? 0 : Math.min(100, (current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[var(--text-3)]">
        {current} / {total}
      </span>
    </div>
  );
}
