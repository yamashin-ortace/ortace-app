/**
 * 「未着手から解く」の出題ルール
 */
export function UnansweredSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        まだ解いていない問題から出題。分野指定時は
        <strong className="font-bold text-[var(--text-1)]">年度の古い順（午前→午後・番号順）</strong>
        、全分野ランダム時は未着手からシャッフルします。
      </p>
    </div>
  );
}
