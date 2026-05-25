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
      <p>
        受験生プランでは、30問以上の履歴をもとに
        <strong className="font-bold text-[var(--text-1)]">中分類</strong>
        まで掘り下げ、基礎問題、自信あり誤答、類題の順で出題します。
      </p>
    </div>
  );
}
