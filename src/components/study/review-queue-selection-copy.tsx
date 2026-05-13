/**
 * 「復習／未復習」キューの出題ルール
 */
export function ReviewQueueSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        間違えた／無回答だった問題が、その日の復習対象になります。連続正解で出題間隔が{" "}
        <strong className="font-bold text-[var(--text-1)]">
          1→3→7日
        </strong>
        と延び、
        <strong className="font-bold text-[var(--text-1)]">
          4回連続正解で卒業
        </strong>
        します。
      </p>
    </div>
  );
}
