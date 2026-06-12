import { ShieldCheck, PackageCheck, Repeat2 } from "lucide-react";

/**
 * 合格サポート保証 + 7日返金保証 + 自動更新なしの安心訴求。
 * 課金前の不安を取り除くためのセクション。Pricing と FAQ の間に置く。
 */
const GUARANTEE_CARDS = [
  {
    icon: ShieldCheck,
    eyebrow: "合格サポート保証",
    title: "もし届かなかったとしても、もう1年。",
    body: "受験年度の国試対策パックを利用して不合格だった場合、合格発表から30日以内のお申し込みで、翌年度の利用料を免除します。",
    fineprint: "対象：国試対策パックを購入し、直近3ヶ月で20日以上学習したユーザー。",
  },
  {
    icon: Repeat2,
    eyebrow: "7日返金保証",
    title: "合わなかったら、戻れます。",
    body: "有料プランのご購入から7日以内かつ実質未使用（10問以下）の場合、ご申請により全額を返金します。",
    fineprint: "お申し込みは info@ortace.jp までご連絡ください。",
  },
  {
    icon: PackageCheck,
    eyebrow: "期間終了後・自動更新なし",
    title: "追加の延長課金は、ありません。",
    body: "有料プランは初回14日間無料トライアル後に1回だけ決済されます。基礎定着パスは選択した期間まで、国試対策パックは受験年度の3月31日まで利用でき、その後の自動更新はありません。",
    fineprint: "無料トライアルは1アカウントにつき1回限り。無料期間中にキャンセルした場合、料金は発生しません。",
  },
] as const;

export function LandingGuarantee() {
  return (
    <section
      className="space-y-8 py-14"
      aria-labelledby="landing-guarantee-heading"
    >
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
          ASSURANCE
        </p>
        <h2
          id="landing-guarantee-heading"
          className="text-[24px] font-extrabold text-[var(--text-1)] md:text-[30px]"
        >
          安心して、はじめてください。
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          国試の結果は、いつも100%ではない。だからORT ACEは、はじめる前の不安にも、終わったあとの不安にも、ちゃんと答えを用意しています。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {GUARANTEE_CARDS.map(({ icon: Icon, eyebrow, title, body, fineprint }) => (
          <article
            key={eyebrow}
            className="relative flex flex-col overflow-hidden rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_14px_36px_rgba(44,62,93,0.07)]"
          >
            <div className="absolute -right-12 -top-14 size-36 rounded-full bg-[#d8fff6]/45 blur-3xl" />
            <div className="relative flex flex-1 flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#e8f7f5] text-[#16717c]">
                  <Icon className="size-4.5" strokeWidth={2.4} aria-hidden />
                </span>
                <p className="text-[11px] font-extrabold tracking-[0.1em] text-[#16717c]">
                  {eyebrow}
                </p>
              </div>
              <h3 className="text-[16px] font-extrabold leading-[1.45] text-[var(--text-1)] md:text-[17px]">
                {title}
              </h3>
              <p className="flex-1 text-[13px] font-medium leading-[1.85] text-[var(--text-2)]">
                {body}
              </p>
              {fineprint ? (
                <p className="border-t border-border/60 pt-2 text-[11px] leading-relaxed text-[var(--text-3)]">
                  {fineprint}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <p className="text-center text-[11px] text-[var(--text-3)] md:text-left">
        各保証には適用条件があります。詳細はページ下部をご確認ください。
      </p>
    </section>
  );
}
