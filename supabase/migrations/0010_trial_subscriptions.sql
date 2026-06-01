-- 14日無料トライアル後の自動決済と、固定期間後の自動停止を管理する。
-- Stripe Subscription は請求に使い、アプリの利用権は plan_expires_at を正とする。

alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_subscription_cancel_at timestamptz,
  add column if not exists stripe_first_invoice_paid_at timestamptz,
  add column if not exists trial_plan text;

alter table public.profiles
  drop constraint if exists profiles_plan_status_check,
  add constraint profiles_plan_status_check
    check (plan_status in ('active', 'trialing', 'expired', 'payment_failed', 'canceled'));

alter table public.profiles
  drop constraint if exists profiles_trial_plan_check,
  add constraint profiles_trial_plan_check
    check (trial_plan is null or trial_plan in ('low', 'exam'));

create unique index if not exists profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;
