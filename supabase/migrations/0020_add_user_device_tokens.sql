-- 端末数制限をクライアント生成 fingerprint ではなくサーバー発行 token で判定する。
-- device_fingerprint は表示・端末名推定の補助として残す。

alter table public.user_devices
  add column if not exists device_token text,
  add column if not exists revoked_by_device_token text;

update public.user_devices
set device_token = gen_random_uuid()::text
where device_token is null;

alter table public.user_devices
  alter column device_token set not null,
  alter column device_token set default gen_random_uuid()::text,
  alter column device_fingerprint drop not null;

alter table public.user_devices
  drop constraint if exists user_devices_user_id_device_fingerprint_key;

create unique index if not exists user_devices_user_id_device_token_idx
  on public.user_devices (user_id, device_token);
