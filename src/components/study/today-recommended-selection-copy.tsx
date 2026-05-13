/**
 * 「今日のおすすめ」の出題ルール
 */
export function TodayRecommendedSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        その日の最初の問題を自動で組み立てます。優先順は次のとおりです。
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong className="font-bold text-[var(--text-1)]">復習対象</strong>
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">苦手分野の未着手</strong>
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">それ以外の未着手</strong>
        </li>
      </ol>
    </div>
  );
}
