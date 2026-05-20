import Link from "next/link";
import { Check, Library, RotateCcw, Smartphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PLANS = [
  {
    name: "無料",
    price: "¥0",
    period: "",
    description: "まずは試してフィット感を確認",
    highlight: false,
    bullets: [
      "過去問 1,500問にアクセス",
      "解答・正答の確認",
      "AIコーチMiLu先生の今日のおすすめ20問",
      "1日20問まで演習",
    ],
    ctaLabel: "無料ではじめる",
    footnote: null as string | null,
  },
  {
    name: "低学年プラン",
    price: "¥5,400",
    period: "/1年",
    description: "授業・日々の復習向け",
    highlight: false,
    bullets: [
      "1日100問まで演習",
      "苦手克服",
      "ブックマーク・ノート",
      "端末間同期",
    ],
    ctaLabel: "無料ではじめる",
    footnote:
      "月あたり¥450。決済はログイン後にStripeの決済画面で行います。アカウント作成後にプラン選択画面で購入できます。",
  },
  {
    name: "国試対策パック",
    price: "¥9,800",
    period: "/受験年度",
    description: "本気の総仕上げ・網羅に",
    highlight: true,
    bullets: [
      "過去問の演習が無制限",
      "AIコーチMiLu先生を深く活用",
      "ブックマーク・ノート",
      "成績・履歴",
    ],
    ctaLabel: "無料ではじめる",
    footnote:
      "1回限りのお支払い（買い切り）。受験年度の試験翌月までご利用いただけます。早く始めるほど、1日あたりの負担は軽くなります。サブスクリプションではないので、解約手続きや延長課金はありません。",
  },
] as const;

const VALUE_CARDS = [
  {
    icon: Library,
    headline: "書籍を何冊も、持ち歩かなくていい",
    sub: "第47〜56回・1,500問がスマホに",
  },
  {
    icon: RotateCcw,
    headline: "模試前の確認も、弱点から戻れる",
    sub: "ノート・ブックマーク・苦手から再演習",
  },
  {
    icon: Smartphone,
    headline: "演習も、記録も、復習も、スマホ1台で",
    sub: "通学・実習の合間でも続けられる",
  },
] as const;

export function LandingPricing() {
  return (
    <div className="space-y-8 py-14">
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
          PRICING
        </p>
        <h2 className="text-[20px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[30px]">
          あなたのフェーズで選ぶ料金プラン
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          まずは無料で。続けたくなったら、学習フェーズに合わせてアップグレード。
        </p>
      </div>

      <section className="relative overflow-hidden rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_18px_44px_rgba(44,62,93,0.08)] md:p-6">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[#d8fff6]/50 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-center">
          <div className="space-y-2">
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c]">
              COST VALUE
            </p>
            <h3 className="text-[21px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[25px]">
              過去問も、記録も、復習も。
              <br />
              まずはスマホ1台にまとめる。
            </h3>
            <p className="text-[13px] leading-[1.9] text-[var(--text-3)] md:text-[14px]">
              過去問書籍を複数年分そろえたり、模試を受けたりすると、対策費は数万円になることも（※当社調べ）。
              ORT ACEなら、第47〜56回・10年分の過去問1,500問を、演習・記録・復習までひとつにまとめられます。
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {VALUE_CARDS.map(({ icon: Icon, headline, sub }) => (
              <div
                key={headline}
                className="flex flex-col gap-2 rounded-[14px] border border-border bg-[var(--bg-base)] p-4 shadow-[0_10px_24px_rgba(44,62,93,0.06)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#e8f7f5] text-[#16717c]">
                  <Icon className="size-5" strokeWidth={2.4} aria-hidden />
                </span>
                <p className="text-[13.5px] font-extrabold leading-[1.5] text-[var(--text-1)]">
                  {headline}
                </p>
                <p className="text-[11px] leading-relaxed text-[var(--text-3)]">
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlight
                ? "border-[var(--primary)] shadow-[0_4px_16px_var(--primary-shadow-soft)] ring-1 ring-[var(--primary)]/25"
                : ""
            }
          >
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-[17px] font-bold text-[var(--text-1)]">
                {plan.name}
              </CardTitle>
              <p className="text-[13px] text-[var(--text-3)]">{plan.description}</p>
              <div className="flex items-baseline gap-0.5 pt-2">
                <span className="text-[26px] font-extrabold tracking-tight text-[var(--text-1)]">
                  {plan.price}
                </span>
                <span className="text-[13px] text-[var(--text-3)]">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5">
                {plan.bullets.map((line) => (
                  <li key={line} className="flex gap-2 text-[13px] text-[var(--text-2)]">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[var(--success)]"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t bg-transparent pt-4">
              <Link
                href="/login"
                className={
                  plan.highlight
                    ? "btn-pressable btn-primary-shadow inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--primary)] py-3 text-center text-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    : "inline-flex w-full items-center justify-center rounded-[12px] border border-border bg-[var(--bg-muted)] py-3 text-center text-[14px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                }
              >
                {plan.ctaLabel}
              </Link>
              {plan.footnote ? (
                <p className="text-[11px] leading-relaxed text-[var(--text-4)]">
                  {plan.footnote}
                </p>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
