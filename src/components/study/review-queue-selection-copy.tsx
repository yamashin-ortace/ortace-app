/**
 * 「復習／未復習」キューの出題ルール
 */
export function ReviewQueueSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        復習は、間違えた問題と、正解していても「迷った」「根拠なし」と記録した問題を中心に選びます。自信ありで正解した問題は原則として復習対象に積みません。
      </p>
      <p>
        出題順は「自信ありで外した問題」「同じ問題で誤答が重なったもの」「通常の誤答」「迷い・根拠なしが残った正解」を優先します。
        期限を過ぎている問題も少しずつ前に出します。
      </p>
    </div>
  );
}
