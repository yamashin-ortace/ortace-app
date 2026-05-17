import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "無料プランでできることは？",
    a: "過去問1,500問へのアクセス、解答と正誤の確認、AIコーチMiLu先生の今日のおすすめ20問を試せます。1日あたりの演習は20問までです。",
  },
  {
    q: "対応している過去問の範囲は？",
    a: "第47回から最新の第56回までの過去問をカバーしています（1,500問）。画像つき問題もアプリ用に最適化しています。",
  },
  {
    q: "AIコーチMiLu先生はチャットAIですか？",
    a: "チャットで会話する機能ではなく、回答履歴・正答率・自信度・解答時間をもとに、今日やるべき問題や確認テーマを提案する学習コーチ機能です。",
  },
  {
    q: "スマートフォンだけで使えますか？",
    a: "はい。モバイルファーストで設計しており、外出先でも続けやすいレイアウトです。PCのブラウザからも同じデータでご利用いただけます。",
  },
  {
    q: "課金はどこから行いますか？",
    a: "アカウント作成後にプラン選択画面で購入手続きへ進みます。決済はStripeの決済画面で行われ、ORT ACEはカード番号を保持しません。",
  },
  {
    q: "使える決済方法は？",
    a: "クレジットカード（Visa／Mastercard／JCB／American Express／Diners／Discover）、Apple Pay、Google Pay、PayPay、コンビニ払い、カード分割払いに対応しています。",
  },
  {
    q: "もし不合格になった場合はどうなりますか？",
    a: "受験年度の国試対策パックを利用して不合格となった場合、合格発表から30日以内にお申し込みいただくと、翌年度の利用料を免除します（合格サポート保証）。対象は、直近3ヶ月以上の継続課金または買い切り購入をされたユーザーです。",
  },
  {
    q: "途中で解約や返金はできますか？",
    a: "有料プランの購入から7日以内かつ実質未使用（10問以下）の場合、ご申請により全額を返金します。それ以外の場合の途中解約・日割り返金は原則承っておりません。",
  },
  {
    q: "受験が終わったら、自動で課金が止まりますか？",
    a: "はい。国試対策パックは、受験年度の国家試験翌月に自動で解約されます。延長課金はありません。試験約2週間前にもお知らせが届きます。",
  },
  {
    q: "年度の途中から国試対策パックを購入できますか？",
    a: "はい。いつご購入いただいても、その年度の試験翌月まで何度でも・何問でも演習いただけます。早く始めるほど、1日あたりのコストは下がります。",
  },
  {
    q: "卒業後もデータは見られますか？",
    a: "学習履歴・ノート・ブックマークなどのご自身のデータは、無期限で保管されます。臨床業務での再参照などで使いたくなったときは、再度サブスクリプションを開始することで、過去のデータと一緒に解説機能も復活します。",
  },
  {
    q: "アカウントは共有できますか？",
    a: "アカウントの第三者への譲渡・貸与・共有は利用規約で禁止しています。学習履歴・ブックマーク・ノートはご本人の学習データなので、ご本人専用としてご利用ください。",
  },
] as const;

export function LandingFaq() {
  return (
    <section className="space-y-8 py-14" aria-labelledby="landing-faq-heading">
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
          FAQ
        </p>
        <h2
          id="landing-faq-heading"
          className="text-[24px] font-extrabold text-[var(--text-1)] md:text-[30px]"
        >
          よくある質問
        </h2>
        <p className="text-[14px] text-[var(--text-3)] md:text-[15px]">
          ひと目でわかるようにまとめました。
        </p>
      </div>
      <div className="space-y-2">
        {FAQ_ITEMS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-[14px] border border-border bg-[var(--bg-card)] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] open:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[14px] font-semibold text-[var(--text-1)] outline-none marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{q}</span>
              <ChevronDown
                className="size-5 shrink-0 text-[var(--text-3)] transition-transform duration-300 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-t border-border pb-4 pt-1">
              <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
