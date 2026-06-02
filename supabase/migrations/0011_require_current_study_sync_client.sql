-- 古いクライアントがアカウント共通 localStorage を再アップロードしないよう、
-- 学習データの書き込みには現行同期バージョンのヘッダーを必須にする。

create or replace function public.is_current_study_sync_client()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    current_setting('request.headers', true)::jsonb
      ->> 'x-ortace-study-sync-version' = '2',
    false
  );
$$;

grant execute on function public.is_current_study_sync_client() to authenticated;

drop policy if exists "daily_limits_insert_own" on public.daily_limits;
create policy "daily_limits_insert_own"
  on public.daily_limits for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "daily_limits_update_own" on public.daily_limits;
create policy "daily_limits_update_own"
  on public.daily_limits for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "answer_history_insert_own" on public.answer_history;
create policy "answer_history_insert_own"
  on public.answer_history for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "answer_history_update_own" on public.answer_history;
create policy "answer_history_update_own"
  on public.answer_history for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "study_goal_settings_insert_own" on public.study_goal_settings;
create policy "study_goal_settings_insert_own"
  on public.study_goal_settings for insert
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );

drop policy if exists "study_goal_settings_update_own" on public.study_goal_settings;
create policy "study_goal_settings_update_own"
  on public.study_goal_settings for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_current_study_sync_client()
  );
