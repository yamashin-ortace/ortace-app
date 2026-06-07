import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "お問い合わせ｜ORT ACE",
  description:
    "ORT ACE（オルトエース）へのお問い合わせ。問題・解説の不備、表示不具合、ご要望、料金についてのご質問などを受け付けています。",
};

export default function ContactPage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  return (
    <LegalPageLayout
      title="お問い合わせ"
      lastUpdated="2026-05-15"
      intro="問題・解説の不備、表示不具合、ご要望などをお寄せください。いただいた指摘をもとに、ORT ACEの内容と使いやすさを継続的に改善します。通常、3営業日以内にご返信します。"
    >
      <p>
        <strong>※返信は登録いただいたメールアドレス宛にお送りします。</strong>
        ドメイン <code className="legal-code">@ortace.jp</code> からのメールを受信できるようご設定ください。
      </p>
      <ContactForm turnstileSiteKey={turnstileSiteKey} />
      <p style={{ marginTop: "32px", fontSize: "12px", color: "var(--text-3)" }}>
        フォームから送信できない場合は、直接{" "}
        <code className="legal-code">info@ortace.jp</code>{" "}
        までメールでご連絡ください。
      </p>
    </LegalPageLayout>
  );
}
