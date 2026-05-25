import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記｜ORT ACE",
  description:
    "ORT ACE（オルトエース）の特定商取引法に基づく表記。販売業者・運営統括責任者・所在地・連絡先・料金・支払方法・返金等を記載しています。",
};

export default function TokushohoPage() {
  return (
    <LegalPageLayout
      title="特定商取引法に基づく表記"
      lastUpdated="2026-05-15"
    >
      <table className="legal-table">
        <tbody>
          <tr>
            <th>販売業者</th>
            <td>[代表者氏名]</td>
          </tr>
          <tr>
            <th>運営統括責任者</th>
            <td>[代表者氏名]</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>請求があった場合に遅滞なく開示します。</td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>請求があった場合に遅滞なく開示します。</td>
          </tr>
          <tr>
            <th>メールアドレス</th>
            <td><code className="legal-code">info@ortace.jp</code></td>
          </tr>
          <tr>
            <th>サイトURL</th>
            <td><a className="legal-link" href="https://ortace.jp">https://ortace.jp</a></td>
          </tr>
          <tr>
            <th>販売価格</th>
            <td>
              <ul className="legal-ul" style={{ margin: 0 }}>
                <li>基礎定着パス 3ヶ月：¥1,500／3ヶ月（税込）</li>
                <li>基礎定着パス 1年：¥4,800／1年（税込）</li>
                <li>国試対策パック：¥9,800／受験年度（税込）</li>
                <li>卒業記念パッケージ：¥500（税込・予定）</li>
              </ul>
              ※価格は本サービス上の最新表示を優先します。
            </td>
          </tr>
          <tr>
            <th>商品代金以外の必要料金</th>
            <td>
              本サービスを利用する際の通信費・インターネット接続料金等は、ユーザーの負担となります。<br />
              本サービスの価格には、決済手数料等の追加費用は含まれていません（決済手数料は運営者負担）。
            </td>
          </tr>
          <tr>
            <th>支払方法</th>
            <td>クレジットカード決済（Stripe）。Visa／Mastercard／JCB／American Express／Diners Club／Discover、および対応するモバイル決済（Apple Pay／Google Pay）。</td>
          </tr>
          <tr>
            <th>支払時期</th>
            <td>各プランの申込み時点で、登録の支払方法から即時決済されます。</td>
          </tr>
          <tr>
            <th>商品（サービス）の引渡時期</th>
            <td>決済完了後、直ちに本サービスをご利用いただけます。</td>
          </tr>
          <tr>
            <th>返品・キャンセル</th>
            <td>
              <strong>クーリングオフ返金：</strong>有料プラン購入から7日以内かつ実質未使用（10問以下）の場合、ユーザーからの申請により全額を返金します。<br />
              <strong>合格サポート保証：</strong>受験年度プランをご利用いただき、当該年度の視能訓練士国家試験に不合格となった場合、合格発表から30日以内の申請により、翌年度のご利用料金を免除します（直近3ヶ月以上の継続課金または買い切り購入が対象）。<br />
              上記以外の理由による返金・解約・日割りは原則として承りません。詳細は<a className="legal-link" href="/legal/terms">利用規約</a>をご確認ください。
            </td>
          </tr>
          <tr>
            <th>定期購入の自動解約</th>
            <td>国試対策パック（受験年度プラン）は、ユーザーが指定した受験年度の国家試験翌月に自動的に解約されます。試験約2週間前を目安に、運営者から自動解約予定のお知らせを送信します。</td>
          </tr>
          <tr>
            <th>動作環境</th>
            <td>
              スマートフォン・タブレット・PC のいずれにも対応しています。<br />
              推奨ブラウザ：iOS Safari 最新版、Android Chrome 最新版、Windows / macOS の Chrome・Safari・Firefox・Edge 最新版。<br />
              JavaScript およびCookieを有効にしてご利用ください。
            </td>
          </tr>
          <tr>
            <th>その他</th>
            <td>本サービスは、視能訓練士国家試験の合格を保証するものではありません。提供する情報・分析結果は学習の参考としてご活用ください。</td>
          </tr>
        </tbody>
      </table>
    </LegalPageLayout>
  );
}
