-- 基礎定着パスの購入期間（3ヶ月 / 1年）をプロフィールに保持する。
-- トライアル中は plan_expires_at が未設定のため、選択期間を別カラムで表示に使う。

alter table public.profiles
  add column if not exists plan_duration_id text;

alter table public.profiles
  drop constraint if exists profiles_plan_duration_id_check,
  add constraint profiles_plan_duration_id_check
    check (plan_duration_id is null or plan_duration_id in ('3m', '1y'));
