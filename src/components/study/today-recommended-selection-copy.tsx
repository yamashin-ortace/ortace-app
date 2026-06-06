/**
 * 「今日のおすすめ」の出題ルール
 */
export function TodayRecommendedSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        回答履歴・正答率・解いた感覚・解答時間をもとに、その日の20問を自動で組み立てます。固定の内訳ではなく、今の履歴に合わせて次の優先度で調整します。
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong className="font-bold text-[var(--text-1)]">復習</strong>
          ：まず4〜6問ほど
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">弱点</strong>
          ：4〜6問ほど
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">思い込み</strong>
          ：2〜3問ほど
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">未回答</strong>
          ：残り枠で補充
        </li>
      </ol>
      <p>
        復習は大切にしつつ、多すぎて新しい問題に進めなくならないように調整します。自信ありで正解した問題と、正答がない問題は実力判定に使いません。
      </p>
    </div>
  );
}
