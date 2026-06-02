-- 誤同期を復旧したアカウントに、復旧時刻より古い学習データが
-- 端末から再アップロードされないための境界を追加する。

create table if not exists public.study_data_resets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reset_at timestamptz not null default now()
);

revoke all on public.study_data_resets from anon, authenticated;

create or replace function public.is_current_study_sync_client()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    current_setting('request.headers', true)::jsonb
      ->> 'x-ortace-study-sync-version' = '3',
    false
  );
$$;

create or replace function public.is_after_study_data_reset(
  target_user_id uuid,
  item_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.study_data_resets
    where user_id = target_user_id
      and item_at < reset_at
  );
$$;

create or replace function public.is_daily_limit_after_study_data_reset(
  target_user_id uuid,
  item_date date
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.study_data_resets
    where user_id = target_user_id
      and item_date <= (reset_at at time zone 'Asia/Tokyo')::date
  );
$$;

revoke all on function public.is_after_study_data_reset(uuid, timestamptz) from public;
revoke all on function public.is_daily_limit_after_study_data_reset(uuid, date) from public;
grant execute on function public.is_after_study_data_reset(uuid, timestamptz) to authenticated;
grant execute on function public.is_daily_limit_after_study_data_reset(uuid, date) to authenticated;

insert into public.study_data_resets (user_id, reset_at)
values
  ('95688320-6c5d-4984-82f3-cd472db14cfa'::uuid, now()),
  ('59fe7486-34b1-4fcb-9c63-88bb0afe1452'::uuid, now())
on conflict (user_id) do update
set reset_at = excluded.reset_at;

drop policy if exists "daily_limits_insert_own" on public.daily_limits;
create policy "daily_limits_insert_own"
  on public.daily_limits for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_daily_limit_after_study_data_reset(user_id, date)
  );

drop policy if exists "daily_limits_update_own" on public.daily_limits;
create policy "daily_limits_update_own"
  on public.daily_limits for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_daily_limit_after_study_data_reset(user_id, date)
  );

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, added_at)
  );

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, added_at)
  );

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, updated_at)
  );

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, updated_at)
  );

drop policy if exists "answer_history_insert_own" on public.answer_history;
create policy "answer_history_insert_own"
  on public.answer_history for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, answered_at)
  );

drop policy if exists "answer_history_update_own" on public.answer_history;
create policy "answer_history_update_own"
  on public.answer_history for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, answered_at)
  );

drop policy if exists "study_goal_settings_insert_own" on public.study_goal_settings;
create policy "study_goal_settings_insert_own"
  on public.study_goal_settings for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, updated_at)
  );

drop policy if exists "study_goal_settings_update_own" on public.study_goal_settings;
create policy "study_goal_settings_update_own"
  on public.study_goal_settings for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
    and public.is_after_study_data_reset(user_id, updated_at)
  );
