-- 基礎定着パスの日次上限を50問として端末間同期できるようにする。
-- 無料プランの20問制御はアプリ側で維持する。

alter table public.daily_limits
  drop constraint if exists daily_limits_count_check;

alter table public.daily_limits
  add constraint daily_limits_count_check
  check (count >= 0 and count <= 50);
