import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜ORT ACE",
  description:
    "ORT ACE（オルトエース）のプライバシーポリシー。取得する個人情報、利用目的、第三者提供、Cookie・分析ツールの利用について説明します。",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="プライバシーポリシー"
      lastUpdated="2026-06-11"
      intro="ORT ACE（以下「本サービス」）を運営する 山中慎也（以下「運営者」）は、ユーザーの個人情報を適切に取り扱うため、本プライバシーポリシーを定めます。"
    >
      <section>
        <h2 className="legal-h2">1. 取得する情報</h2>
        <p>運営者は、本サービスの提供にあたり、以下の情報を取得することがあります。</p>
        <ul className="legal-ul">
          <li>メールアドレス（アカウント登録時）</li>
          <li>パスワード（暗号化して保存。運営者は平文を保持しません）</li>
          <li>Googleアカウント等の外部認証で取得する基本情報（メールアドレス・表示名・プロフィール画像）</li>
          <li>学習履歴（解答した問題、正誤、解いた感覚、解答時間、ノート、ブックマーク等）</li>
          <li>決済関連情報（決済代行業者から提供される顧客ID等。クレジットカード番号自体は運営者は保持しません）</li>
          <li>端末・ブラウザ情報（OS・ブラウザの種類等の技術情報）</li>
          <li>アクセスログ（IPアドレス・アクセス日時・利用機能等）</li>
        </ul>
      </section>

      <section>
        <h2 className="legal-h2">2. 利用目的</h2>
        <p>取得した情報は、以下の目的で利用します。</p>
        <ul className="legal-ul">
          <li>本サービスの提供および機能改善</li>
          <li>ユーザーの学習履歴に基づくAIコーチの分析・提案</li>
          <li>本人確認・アカウント認証</li>
          <li>料金の決済・課金管理</li>
          <li>お問い合わせへの対応</li>
          <li>運営上の連絡（重要なお知らせ、メンテナンス通知等）</li>
          <li>不正利用の調査・防止</li>
          <li>サービス利用状況の統計分析（個人を特定しない形）</li>
        </ul>
      </section>

      <section>
        <h2 className="legal-h2">3. 第三者提供</h2>
        <p>運営者は、ユーザーの個人情報を本人の同意なく第三者に提供しません。ただし、以下の場合を除きます。</p>
        <ul className="legal-ul">
          <li>法令に基づく場合</li>
          <li>人の生命・身体または財産の保護のために必要があり、本人の同意を得ることが困難な場合</li>
          <li>本サービス運営に必要な範囲で、以下の業務委託先に情報を取り扱わせる場合</li>
        </ul>
        <h3 className="legal-h3">業務委託先</h3>
        <table className="legal-table">
          <thead>
            <tr><th>事業者</th><th>取扱内容</th></tr>
          </thead>
          <tbody>
            <tr><td>Supabase, Inc.</td><td>データベース・認証基盤の提供</td></tr>
            <tr><td>Vercel, Inc.</td><td>Webアプリのホスティング</td></tr>
            <tr><td>Stripe, Inc.</td><td>決済の代行処理</td></tr>
            <tr><td>Google LLC</td><td>外部認証（Googleログイン）・アクセス解析（Google Analytics 4）</td></tr>
            <tr><td>Cloudflare, Inc.</td><td>ドメイン管理・スパム対策</td></tr>
            <tr><td>Resend, Inc.</td><td>問い合わせメール等の送信処理</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="legal-h2">4. Cookie・アクセス解析</h2>
        <ol className="legal-ol">
          <li>本サービスは、利便性向上およびアクセス解析のためにCookie等の技術を使用することがあります。</li>
          <li>Google Analytics 4 を利用して、本サービスの利用状況を統計的に分析することがあります。取得される情報は匿名化されており、個人を特定しません。</li>
          <li>Cookieの利用を希望しない場合、ブラウザの設定で無効化できます。ただし、本サービスの一部機能が利用できなくなる場合があります。</li>
        </ol>
      </section>

      <section>
        <h2 className="legal-h2">5. 外国にある第三者への情報提供</h2>
        <p>本サービスでは、上記の業務委託先に対し、本サービスの提供に必要な範囲で個人情報を取り扱わせることがあります。外国にある主な提供先は、Supabase, Inc.、Vercel, Inc.、Stripe, Inc.、Google LLC、Cloudflare, Inc.、Resend, Inc. であり、主な所在国はいずれも米国です。</p>
        <p>米国における個人情報保護制度は日本と異なる場合がありますが、運営者は、各委託先が公表するプライバシーポリシー、データ処理契約、セキュリティ文書等を確認し、個人情報の保護に関する適切な措置が講じられている事業者を利用します。</p>
        <p>各委託先は、アクセス制御、通信の暗号化、ログ管理、権限管理等の安全管理措置を講じています。運営者は、委託先の変更や利用状況に応じて、必要な範囲でこれらの情報を確認します。</p>
      </section>

      <section>
        <h2 className="legal-h2">6. 個人情報の保管期間</h2>
        <ol className="legal-ol">
          <li>運営者は、利用目的の達成に必要な期間、個人情報を保管します。</li>
          <li>退会・アカウント削除後も、学習履歴等のデータは無期限で保管されますが、個人を特定するメールアドレス等の連絡先情報は、本人からの削除請求があった場合、合理的な範囲で速やかに削除します。</li>
          <li>法令により保存が義務付けられている情報（決済記録等）は、所定の期間保管します。</li>
        </ol>
      </section>

      <section>
        <h2 className="legal-h2">7. 開示・訂正・削除請求</h2>
        <p>ユーザーは、運営者に対し、自己の個人情報の開示・訂正・利用停止・削除を請求することができます。請求は、本サービスの<a className="legal-link" href="/contact">お問い合わせフォーム</a>または <code className="legal-code">info@ortace.jp</code> までご連絡ください。本人確認のうえ、合理的な範囲で対応します。</p>
      </section>

      <section>
        <h2 className="legal-h2">8. セキュリティ対策</h2>
        <p>運営者は、個人情報の漏えい・滅失・毀損の防止のため、合理的な技術的・組織的安全管理措置を講じます。具体的には、通信のSSL/TLS暗号化、パスワードのハッシュ化保存、アクセス権限の最小化等を行います。</p>
      </section>

      <section>
        <h2 className="legal-h2">9. 未成年の利用</h2>
        <p>18歳未満の方が本サービスを利用する場合、保護者の同意を得たうえでご利用ください。本サービスは特定の年齢層を限定的に対象とはしていませんが、視能訓練士国家試験の受験対象は通常18歳以上です。</p>
      </section>

      <section>
        <h2 className="legal-h2">10. 本ポリシーの変更</h2>
        <p>運営者は、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは、本サービス上に表示した時点から効力を生じるものとします。</p>
      </section>

      <section>
        <h2 className="legal-h2">11. お問い合わせ</h2>
        <p>本ポリシーに関するお問い合わせは、<a className="legal-link" href="/contact">お問い合わせフォーム</a>または <code className="legal-code">info@ortace.jp</code> までご連絡ください。</p>
      </section>
    </LegalPageLayout>
  );
}
