import Link from "next/link";
import { Check } from "lucide-react";
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
      "1日20問まで演習",
      "基本成績",
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
      "ブックマーク・ノート",
      "基本成績",
      "端末間同期",
    ],
    ctaLabel: "アカウントを作成",
    footnote:
      "月あたり¥450。決済はログイン後にStripeの安全な画面で行います。",
  },
  {
    name: "国試対策パック",
    price: "¥9,800",
    period: "/受験年度",
    description: "本気の総仕上げ・網羅に",
    highlight: true,
    bullets: [
      "過去問の演習が無制限",
      "ブックマーク・ノート",
      "成績・履歴",
      "端末間同期",
    ],
    ctaLabel: "アカウントを作成",
    footnote:
      "月あたり約¥817。模試モード、苦手復習、弱点診断、直前チェックは順次追加予定です。",
  },
] as const;

export function LandingPricing() {
  return (
    <div className="space-y-8 py-14">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-1)] md:text-[24px]">
          シンプルな料金プラン
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          無料でスタートし、学習フェーズに合わせてステップアップ。購入はアカウント作成後に案内します。
        </p>
      </div>
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
