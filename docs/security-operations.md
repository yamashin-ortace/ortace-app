# Security operations

ORT ACE の公開環境では、次の運用を継続する。

## Monthly dependency audit

毎月1回、および本番リリース前に次を実行する。

```bash
npm run security:audit
npm run lint
npm test
npm run build
```

既知脆弱性が検出された場合は、依存関係を更新し、監査とテストを再実行してから公開する。

GitHub Actions の `Monthly security scan` は、毎月1日 03:00 JST に依存関係監査と OWASP ZAP Baseline Scan を実行する。ZAP は公開サイトを短時間クロールし、受動検査の結果を GitHub Issue に記録する。必要に応じて Actions 画面から手動実行する。

## Administrator access

アプリ内管理画面を有効化する前に、Production 環境へ次を登録する。

```text
ADMIN_BASIC_AUTH_USER
ADMIN_BASIC_AUTH_PASSWORD
ADMIN_USER_IDS
```

管理画面は Basic 認証と Supabase Auth の許可ユーザーIDを併用する。管理者が利用する Stripe、Vercel、Supabase の各ダッシュボードでは多要素認証を有効にする。

## Uploaded evidence

合格サポート保証の添付画像は Supabase Storage の private bucket に保存する。許可する形式は JPEG、PNG、HEIC、HEIF、上限は 5 MB とする。
