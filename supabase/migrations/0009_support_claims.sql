-- 合格サポート保証の申請履歴。
-- 添付画像は Storage の private bucket に置き、ここには object path を保存する。

do $$
begin
  if not exists (select 1 from pg_type where typname = 'support_claim_status') then
    create type public.support_claim_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.support_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.support_claim_status not null default 'pending',
  evidence_url text not null,
  user_comment text,
  reject_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists support_claims_user_id_idx
  on public.support_claims (user_id);

create index if not exists support_claims_status_idx
  on public.support_claims (status);

alter table public.profiles
  add column if not exists support_claim_used_at timestamptz;

alter table public.support_claims enable row level security;

drop policy if exists "users_can_read_own_claims" on public.support_claims;
create policy "users_can_read_own_claims" on public.support_claims
  for select using (auth.uid() = user_id);

drop policy if exists "users_can_insert_own_claims" on public.support_claims;
create policy "users_can_insert_own_claims" on public.support_claims
  for insert with check (auth.uid() = user_id);

grant select, insert on public.support_claims to authenticated;
grant select, insert, update, delete on public.support_claims to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-claim-evidence',
  'support-claim-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users_can_upload_own_support_claim_evidence" on storage.objects;
create policy "users_can_upload_own_support_claim_evidence" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'support-claim-evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users_can_read_own_support_claim_evidence" on storage.objects;
create policy "users_can_read_own_support_claim_evidence" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support-claim-evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
