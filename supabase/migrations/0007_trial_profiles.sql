-- 基礎定着パスの14日無料トライアル状態を profiles に追加する。
-- トライアル開始はサーバー側 API が service_role で更新するため、
-- authenticated には trial 系カラムの update 権限を付与しない。

alter table public.profiles
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_used_at timestamptz;

create index if not exists profiles_trial_ends_at_idx
  on public.profiles (trial_ends_at)
  where trial_ends_at is not null;
