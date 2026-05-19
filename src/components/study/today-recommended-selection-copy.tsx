/**
 * 「今日のおすすめ」の出題ルール
 */
export function TodayRecommendedSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        回答履歴・正答率・自信度・解答時間をもとに、AIコーチMiLu先生がその日の20問を自動で組み立てます。目安の配合は次のとおりです。
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
        復習は間違えた問題や、迷った・勘かもで正解した問題を中心に扱います。自信ありで正解した問題と、正答がない問題は実力判定に使いません。
      </p>
    </div>
  );
}
