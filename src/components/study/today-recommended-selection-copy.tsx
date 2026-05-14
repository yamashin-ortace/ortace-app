/**
 * 「今日のおすすめ」の出題ルール
 */
export function TodayRecommendedSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        その日の20問をAIコーチが自動で組み立てます。目安の配合は次のとおりです。
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong className="font-bold text-[var(--text-1)]">復習</strong>
          ：最大8問
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">弱点</strong>
          ：最大6問
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">思い込み</strong>
          ：最大3問
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">未回答</strong>
          ：最大3問
        </li>
      </ol>
      <p>
        履歴が少ないうちは未回答を多めにして、学習データを集めながら精度を上げます。
      </p>
    </div>
  );
}
