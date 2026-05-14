/**
 * 「復習／未復習」キューの出題ルール
 */
export function ReviewQueueSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        間違えた／無回答だった問題が、その日の復習対象になります。その後、正解が続くと次回復習が{" "}
        <strong className="font-bold text-[var(--text-1)]">
          1→3→7日後
        </strong>
        に延び、7日後の復習にも正解すると
        <strong className="font-bold text-[var(--text-1)]">
          卒業
        </strong>
        します。
      </p>
    </div>
  );
}
