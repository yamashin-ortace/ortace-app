-- 新規アカウントには作成時刻の境界を自動設定する。
-- 同じ端末に過去の学習データが残っていても、新規アカウントへ混入させない。

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
      and item_date < (reset_at at time zone 'Asia/Tokyo')::date
  );
$$;

create or replace function public.create_study_data_reset_for_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.study_data_resets (user_id, reset_at)
  values (new.id, new.created_at)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_study_data_reset_for_new_profile() from public;
revoke all on function public.is_current_study_sync_client() from public;
grant execute on function public.is_current_study_sync_client() to authenticated;

drop trigger if exists profiles_create_study_data_reset on public.profiles;
create trigger profiles_create_study_data_reset
  after insert on public.profiles
  for each row execute function public.create_study_data_reset_for_new_profile();

revoke all on public.daily_limits from anon;
revoke all on public.bookmarks from anon;
revoke all on public.notes from anon;
revoke all on public.answer_history from anon;
revoke all on public.study_goal_settings from anon;

revoke truncate, references, trigger on public.daily_limits from authenticated;
revoke truncate, references, trigger on public.bookmarks from authenticated;
revoke truncate, references, trigger on public.notes from authenticated;
revoke truncate, references, trigger on public.answer_history from authenticated;
revoke truncate, references, trigger on public.study_goal_settings from authenticated;
