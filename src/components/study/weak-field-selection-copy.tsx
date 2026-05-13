/**
 * 「苦手分野から解く」の出題ルール
 */
export function WeakFieldSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        最新解答の正答率が低い
        <strong className="font-bold text-[var(--text-1)]">上位3分野</strong>
        から出題します。
        <strong className="font-bold text-[var(--text-1)]">確定苦手</strong>
        ＝10問以上解答済の分野、
        <strong className="font-bold text-[var(--text-1)]">暫定苦手</strong>
        ＝5問以上10問未満の分野。5問未満は判定対象外です。
      </p>
    </div>
  );
}
