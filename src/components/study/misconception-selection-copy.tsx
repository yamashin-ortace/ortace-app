/**
 * 「思い込みチェック」の出題ルール
 */
export function MisconceptionSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        最新解答が誤答の問題から、
        <strong className="font-bold text-[var(--text-1)]">自信ありで外した問題</strong>
        と
        <strong className="font-bold text-[var(--text-1)]">急いで選んで外した問題</strong>
        を優先して拾います。
      </p>
      <p>
        同じテーマで誤答が重なっている問題も候補に入れます。知識不足というより、思い込みや早とちりで落としやすい問題を先に見つけるためのモードです。
      </p>
    </div>
  );
}
