-- profiles にStripe課金状態を追加する。
-- ユーザー本人が plan 系カラムを直接更新できないよう、authenticated の
-- update 権限はオンボーディング用カラムに絞り直す。

alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists plan_status text not null default 'active',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists plan_updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_plan_check,
  add constraint profiles_plan_check
    check (plan in ('free', 'low', 'exam'));

alter table public.profiles
  drop constraint if exists profiles_plan_status_check,
  add constraint profiles_plan_status_check
    check (plan_status in ('active', 'expired', 'payment_failed'));

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_expires_at_idx
  on public.profiles (plan_expires_at);

-- 既存の table-level update grant を外し、ユーザーが編集できる列を限定する。
revoke update on public.profiles from authenticated;
grant update (nickname, grade, goal) on public.profiles to authenticated;

-- 読み取りと通常の初期行作成権限は維持する。
grant select, insert on public.profiles to authenticated;

