/**
 * 「復習／未復習」キューの出題ルール
 */
export function ReviewQueueSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        復習は、間違えた問題と、正解していても「迷った」「勘かも」と記録した問題を中心に選びます。自信ありで正解した問題は原則として復習対象に積みません。
      </p>
      <p>
        間違えた問題は少し間を空けて戻し、勘かもは{" "}
        <strong className="font-bold text-[var(--text-1)]">
          7日後
        </strong>
        、迷った正解は
        <strong className="font-bold text-[var(--text-1)]">
          14日後
        </strong>
        を目安に軽く確認します。
      </p>
    </div>
  );
}
