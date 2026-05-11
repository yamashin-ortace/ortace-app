import Link from "next/link";
import { Compass, Sparkles, Target, Timer } from "lucide-react";
import { BackLink } from "@/components/study/back-link";
import { DiagnosticIntroActions } from "@/components/onboarding/diagnostic-intro-actions";
import { DIAGNOSTIC_QUESTION_COUNT } from "@/lib/onboarding/diagnostic";

export default function DiagnosticIntroPage() {
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1">
        <BackLink href="/" label="ホーム" />
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <Compass className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[var(--text-1)]">
            初回診断（任意）
          </h1>
        </div>
        <p className="text-[12px] text-[var(--text-3)]">
          今の自分の位置を27問でつかみ、毎日の優先度を決めます
        </p>
      </div>

      <section className="space-y-3 rounded-[16px] border border-border bg-[var(--bg-card)] p-4">
        <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
          ORT ACE は「自分の弱点を見える化して、合格まで最短ルートを案内する」アプリです。最初に診断を受けると、次のことが分かります。
        </p>
        <ul className="space-y-2 text-[12px] text-[var(--text-2)]">
          <BenefitItem icon={Target}>
            <strong className="font-bold text-[var(--text-1)]">分野別の正答率</strong>{" "}
            が一気に揃い、ホームに「苦手」「推定スコア」が表示されます。
          </BenefitItem>
          <BenefitItem icon={Sparkles}>
            今日のおすすめが <strong className="font-bold text-[var(--text-1)]">あなた専用</strong>{" "}
            に切り替わります（復習や苦手の比重が上がる）。
          </BenefitItem>
          <BenefitItem icon={Timer}>
            所要時間は <strong className="font-bold text-[var(--text-1)]">15〜25分</strong>{" "}
            。途中で離脱しても解いた分は記録されます。
          </BenefitItem>
        </ul>
        <div className="rounded-[12px] border border-border bg-[var(--bg-muted)]/45 px-3 py-2 text-[11px] leading-relaxed text-[var(--text-2)]">
          ・出題は <strong className="font-bold text-[var(--text-1)]">9分野×3問＝{DIAGNOSTIC_QUESTION_COUNT}問</strong>{" "}
          。同じ問題は出ません。
          <br />
          ・診断分の {DIAGNOSTIC_QUESTION_COUNT}問は <strong className="font-bold text-[var(--text-1)]">1日20問の制限の対象外</strong>{" "}
          です（初回特典）。
          <br />
          ・診断は何度でもスキップ／再開できます。
        </div>
      </section>

      <DiagnosticIntroActions />

      <p className="text-center text-[11px] text-[var(--text-3)]">
        診断を受けないとアプリが使えない、ということはありません。
        <Link
          href="/"
          className="ml-1 font-bold text-[var(--primary-dark)] underline"
        >
          ホームへ戻る
        </Link>
      </p>
    </div>
  );
}

function BenefitItem({
  icon: Icon,
  children,
}: {
  icon: typeof Target;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

export const dynamic = "force-static";
