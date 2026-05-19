# ORT ACE App

視能訓練士国家試験対策Webアプリ ORT ACE の本体です。

## Development

```bash
npm install
npm run dev
```

ローカルURL: [http://localhost:3000](http://localhost:3000)

## Checks

```bash
npm run lint
npm run test
npm run build
```

## Stack

- Next.js 16 App Router
- React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase Auth / PostgreSQL
- Stripe Checkout
- Serwist PWA
- Vercel Analytics / Speed Insights / Sentry

## Key Routes

- `/` 未ログインLP / ログイン後ホーム
- `/study` 学習
- `/records` 記録
- `/me` マイページ
- `/plans` プラン
- `/contact` 問い合わせ
- `/legal/terms`, `/legal/privacy`, `/legal/tokushoho`

## Environment

`.env.local.example` を参照してください。Supabase / Stripe / Resend / Turnstile / GA4 / Sentry は外部設定後に投入します。

## Docs

上位ドキュメントはリポジトリルートの `README.md` / `ROADMAP.md` / `docs/` にあります。
