-- 同時ログイン制限用の端末管理テーブル。
-- 端末を物理削除せず revoked_at で無効化することで、
-- 切断された端末の次回アクセス時に理由を表示できるようにする。

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  user_agent text,
  device_label text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  revoked_by_device_fingerprint text,
  unique (user_id, device_fingerprint)
);

create index if not exists user_devices_user_id_idx
  on public.user_devices (user_id);

create index if not exists user_devices_active_user_last_seen_idx
  on public.user_devices (user_id, last_seen_at)
  where revoked_at is null;

alter table public.user_devices enable row level security;

drop policy if exists "users_can_read_own_devices" on public.user_devices;
create policy "users_can_read_own_devices" on public.user_devices
  for select using (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_devices" on public.user_devices;
create policy "users_can_delete_own_devices" on public.user_devices
  for delete using (auth.uid() = user_id);

grant select, delete on public.user_devices to authenticated;
grant select, insert, update, delete on public.user_devices to service_role;
