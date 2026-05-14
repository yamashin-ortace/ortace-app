-- 学習プリセットをアカウント単位で同期する。
-- 既存の localStorage 値はクライアント側で初回同期時にこのテーブルへ移行する。

create table if not exists public.study_goal_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(config) = 'object')
);

grant select, insert, update, delete on public.study_goal_settings to authenticated;

alter table public.study_goal_settings enable row level security;

drop policy if exists "study_goal_settings_select_own" on public.study_goal_settings;
create policy "study_goal_settings_select_own"
  on public.study_goal_settings for select
  using (auth.uid() = user_id);

drop policy if exists "study_goal_settings_insert_own" on public.study_goal_settings;
create policy "study_goal_settings_insert_own"
  on public.study_goal_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_goal_settings_update_own" on public.study_goal_settings;
create policy "study_goal_settings_update_own"
  on public.study_goal_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "study_goal_settings_delete_own" on public.study_goal_settings;
create policy "study_goal_settings_delete_own"
  on public.study_goal_settings for delete
  using (auth.uid() = user_id);
