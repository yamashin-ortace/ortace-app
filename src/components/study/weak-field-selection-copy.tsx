/**
 * 「苦手分野から解く」の出題ルール
 */
export function WeakFieldSelectionCopy() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
      <p>
        正答率が低い分野に絞って、失点しやすいところを集中的に補強するモードです。
        得点の穴をはっきりさせたいときに使います。
      </p>
      <p>
        分野ごとに「最新の解答が正解だった割合」を計算し、
        <strong className="font-bold text-[var(--text-1)]">
          正答率の低い順に上位3分野
        </strong>
        を「苦手」と判定します。同じ問題は最新の解答だけを集計します。
      </p>
      <p>
        判定の信頼度を2段階で扱います。
      </p>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong className="font-bold text-[var(--text-1)]">確定苦手</strong>
          ：その分野で <strong className="font-bold text-[var(--text-1)]">10問以上</strong>{" "}
          解答済み。データが十分で精度が高い判定です。
        </li>
        <li>
          <strong className="font-bold text-[var(--text-1)]">暫定苦手</strong>
          ：その分野で <strong className="font-bold text-[var(--text-1)]">5問以上 10問未満</strong>{" "}
          解答済み。傾向はつかめますが、まだ揺れがあります。
        </li>
      </ul>
      <p>
        確定苦手を優先しつつ、足りなければ暫定苦手で補って出題します。
        5問未満の分野はデータ不足のため対象外です。まずは未着手や今日のおすすめで少しずつ解いて、判定材料を増やしましょう。
      </p>
      <p>
        苦手を後回しにしないことで、本番で点を落としやすい分野を早めに立て直せます。
      </p>
    </div>
  );
}
