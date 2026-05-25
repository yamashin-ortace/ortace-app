import Link from "next/link";
import { Mail, ShieldCheck, UserRoundCheck, type LucideIcon } from "lucide-react";

const LINKS = [
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/privacy", label: "プライバシーポリシー" },
  { href: "/legal/terms", label: "利用規約" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function LandingForParents() {
  return (
    <section
      className="border-t border-border/70 py-10"
      aria-labelledby="landing-for-parents-heading"
    >
      <div className="grid gap-5 md:grid-cols-[0.92fr_1.08fr] md:items-start">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold tracking-[0.12em] text-[var(--text-4)]">
            FOR PARENTS
          </p>
          <h2
            id="landing-for-parents-heading"
            className="text-[20px] font-extrabold text-[var(--text-1)]"
          >
            保護者の方へ
          </h2>
          <p className="max-w-[560px] text-[13px] leading-[1.9] text-[var(--text-3)]">
            ORT ACEは、視能訓練士国家試験を受ける学生の過去問演習と復習を支えるWebアプリです。決済、個人情報、保証条件について確認できるページをまとめています。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoPanel
            icon={UserRoundCheck}
            title="運営者情報"
            body="運営者名・所在地・連絡先は、特定商取引法に基づく表記で確認できます。所在地・電話番号は請求があった場合に遅滞なく開示します。"
          />
          <InfoPanel
            icon={ShieldCheck}
            title="返金・保証"
            body="有料プラン購入から7日以内かつ実質未使用の場合の返金保証と、不合格時の合格サポート保証を用意しています。"
          />
          <div className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-[var(--primary-dark)]" strokeWidth={2.5} />
              <p className="text-[13px] font-extrabold text-[var(--text-1)]">
                確認先
              </p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-3)]">
              連絡先メール:{" "}
              <a
                href="mailto:info@ortace.jp"
                className="font-bold text-[var(--primary-dark)] underline underline-offset-2"
              >
                info@ortace.jp
              </a>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--bg-muted)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
          <Icon className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <h3 className="text-[13px] font-extrabold text-[var(--text-1)]">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-3)]">
        {body}
      </p>
    </div>
  );
}
