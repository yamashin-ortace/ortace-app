import { ShieldCheck, PackageCheck, Repeat2 } from "lucide-react";

/**
 * 合格サポート保証 + 7日返金保証 + 国試対策パック自動解約の安心訴求。
 * 課金前の不安を取り除くためのセクション。Pricing と FAQ の間に置く。
 */
const GUARANTEE_CARDS = [
  {
    icon: ShieldCheck,
    eyebrow: "合格サポート保証",
    title: "もし届かなかったとしても、もう1年。",
    body: "受験年度の国試対策パックを利用して不合格だった場合、合格発表から30日以内のお申し込みで、翌年度の利用料を免除します。",
    fineprint: "対象：直近3ヶ月以上の継続課金、または買い切り購入のユーザー。",
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
    eyebrow: "買い切り型・延長課金なし",
    title: "1回の購入で、受験本番まで。",
    body: "国試対策パックは1回限りのお支払い（買い切り）。サブスクリプションではないので、解約手続きや延長課金の心配はありません。受験年度の試験翌月までご利用いただけます。",
    fineprint: "クレジットカードの分割払いには対応しています。",
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
            className="relative overflow-hidden rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_14px_36px_rgba(44,62,93,0.07)]"
          >
            <div className="absolute -right-12 -top-14 size-36 rounded-full bg-[#d8fff6]/45 blur-3xl" />
            <div className="relative space-y-2.5">
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
              <p className="text-[13px] font-medium leading-[1.85] text-[var(--text-2)]">
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
        各保証の詳細は
        <a
          href="/legal/terms"
          className="ml-1 text-[var(--primary-dark)] underline underline-offset-2 hover:text-[var(--primary)]"
        >
          利用規約
        </a>
        ・
        <a
          href="/legal/tokushoho"
          className="text-[var(--primary-dark)] underline underline-offset-2 hover:text-[var(--primary)]"
        >
          特定商取引法に基づく表記
        </a>
        をご覧ください。
      </p>
    </section>
  );
}
