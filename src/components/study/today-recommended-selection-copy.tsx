/**
 * 「今日のおすすめ」の出題ルール
 */
export function TodayRecommendedSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        何を解くか迷ったときに、その日の最初の問題を自動で決める入口です。
        復習と穴埋めを混ぜるので、短時間でも今必要な学習から始められます。
      </p>
      <p>
        出題数は <strong className="font-bold text-[var(--text-1)]">10／15／20問</strong>{" "}
        から選べます（既定は20問）。優先度の高い順に、次の3グループから組み立てます。
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong className="font-bold text-[var(--text-1)]">復習対象</strong>
          （最後に間違えた、または未回答だった問題）
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">苦手分野の未着手</strong>
          （正答率の低い分野で、まだ解いていない問題）
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">それ以外の未着手</strong>
        </li>
      </ol>
      <p>
        毎日ここから始めると、間違いの回収と新しい問題の網羅を同時に進められます。
        解答履歴が増えるほど、選ばれる問題の精度も上がります。
      </p>
    </div>
  );
}
