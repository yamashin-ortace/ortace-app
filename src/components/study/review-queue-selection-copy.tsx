/**
 * 「復習／未復習」キューの出題ルール
 */
export function ReviewQueueSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        一度つまずいた問題をもう一度解き、確実に得点へ戻すためのモードです。
        「わかったつもり」を残さないことを目的にしています。
      </p>
      <p>
        対象は
        <strong className="font-bold text-[var(--text-1)]">
          今日が復習日に到来した問題
        </strong>
        です。誤答した問題は翌日、その後は正解するたびに{" "}
        <strong className="font-bold text-[var(--text-1)]">
          1日 → 3日 → 7日 → 21日 → 60日
        </strong>{" "}
        と間隔を伸ばしてスケジュールします（間隔反復学習）。
      </p>
      <p>
        5回連続で正解した問題は復習対象から「卒業」させ、過剰な再出題を避けます。
        出題順はランダムです。早めに復習日のものを片付けると、本番で落としやすい問題を得点源に戻しやすくなります。
      </p>
    </div>
  );
}
