-- Stripe Webhook などのサーバー処理が、認証ユーザーに代わって
-- profiles の課金状態を更新できるようにする。
grant select, insert, update, delete on public.profiles to service_role;
