/**
 * ナビゲーション中・サーバー処理中に表示されるグローバルなローディング UI。
 * AppHeader / BottomNav は既に描画されているので、main エリアだけスケルトン化される。
 * 体感速度を上げる目的で、実速度を変えるわけではない。
 */
export default function Loading() {
  return (
    <div className="space-y-6 pt-2" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-muted)]" />
        <div className="h-7 w-3/4 animate-pulse rounded bg-[var(--bg-muted)]" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-[var(--bg-muted)]"
          />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
    </div>
  );
}
