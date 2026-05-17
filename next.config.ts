import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * セキュリティ・プライバシー系の共通レスポンスヘッダー。
 * Stripe / Supabase / Vercel Analytics / GA4 / Cloudflare Turnstile などの
 * 外部リソースを許可しつつ、最低限の防御を設定する。
 */
const SECURITY_HEADERS = [
  // クリックジャッキング防止
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // MIME スニッフィング防止
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 旧 IE 用 XSS フィルタは無効化推奨（Modern ブラウザは CSP で対応）
  { key: "X-XSS-Protection", value: "0" },
  // リファラはオリジンまで
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 機能制限（ジオ・カメラ・マイクは未使用なので無効）
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // DNS プリフェッチ
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS（Vercel が HTTPS 強制するため明示）
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  /**
   * 開発時の左下「N」は Next.js DevTools。文言が英語固定のため非表示
   * （`npm run build` 後の本番相当ではもともと出ない）
   */
  devIndicators: false,

  async headers() {
    return [
      {
        // すべてのページに適用
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

/**
 * Sentry のラッパー。DSN・AuthToken が未設定でも build は通る設計。
 * 本番投入時は Vercel に SENTRY_AUTH_TOKEN / NEXT_PUBLIC_SENTRY_DSN を設定する。
 */
export default withSentryConfig(nextConfig, {
  // ソースマップアップロード関連は env 未設定なら自動でスキップ
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // ソースマップ：本番でブラウザに露出させない
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
