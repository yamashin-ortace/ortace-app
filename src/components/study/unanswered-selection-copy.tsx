/**
 * 「未着手から解く」の出題ルール
 */
export function UnansweredSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        まだ触れていない問題を増やし、国家試験の出題範囲を広く見ていくためのモードです。
        まず全体像をつかみたいときに向いています。
      </p>
      <p>
        タップすると設定画面が開き、
        <strong className="font-bold text-[var(--text-1)]">分野（複数選択可）</strong>
        と
        <strong className="font-bold text-[var(--text-1)]">出題数（10／15／20問）</strong>
        を選べます。「全分野からランダム」を選ぶと、未着手の中からランダム抽出して出題します。
      </p>
      <p>
        分野を選んだ場合は、古い年度の午前→午後、問題番号順に出題します。
        未着手を減らすほど、苦手分野の判定やおすすめ問題の精度も上がります。
      </p>
    </div>
  );
}
