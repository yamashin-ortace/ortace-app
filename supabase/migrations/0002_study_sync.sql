-- フェーズ3-7：LocalStorage ↔ Supabase 同期用テーブル
-- 適用済みmigrationは編集せず、学習データ用の個別テーブルを追加する。

create table if not exists public.daily_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  count integer not null default 0 check (count >= 0 and count <= 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

drop trigger if exists daily_limits_set_updated_at on public.daily_limits;
create trigger daily_limits_set_updated_at
  before update on public.daily_limits
  for each row execute function public.set_updated_at();

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  categories text[] not null default array['unknown']::text[],
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id),
  check (question_id ~ '^[0-9]{2}-[0-9]{1,3}$'),
  check (cardinality(categories) > 0),
  check (categories <@ array['unknown', 'weak', 'memorize', 'class_note']::text[])
);

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row execute function public.set_updated_at();

create table if not exists public.notes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id),
  check (question_id ~ '^[0-9]{2}-[0-9]{1,3}$'),
  check (length(btrim(text)) > 0)
);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create table if not exists public.answer_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_key text not null,
  question_id text not null,
  answered_at timestamptz not null,
  result text not null,
  selected_answers text[] not null default array[]::text[],
  round integer not null,
  session text not null,
  display_number integer not null,
  major_category text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, entry_key),
  check (question_id ~ '^[0-9]{2}-[0-9]{1,3}$'),
  check (result in ('correct', 'incorrect', 'no_answer')),
  check (selected_answers <@ array['1', '2', '3', '4', '5']::text[]),
  check (round between 47 and 56),
  check (session in ('am', 'pm')),
  check (display_number between 1 and 75)
);

create index if not exists answer_history_user_answered_at_idx
  on public.answer_history (user_id, answered_at desc);

grant select, insert, update, delete on public.daily_limits to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.answer_history to authenticated;

alter table public.daily_limits enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.answer_history enable row level security;

drop policy if exists "daily_limits_select_own" on public.daily_limits;
create policy "daily_limits_select_own"
  on public.daily_limits for select
  using (auth.uid() = user_id);

drop policy if exists "daily_limits_insert_own" on public.daily_limits;
create policy "daily_limits_insert_own"
  on public.daily_limits for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_limits_update_own" on public.daily_limits;
create policy "daily_limits_update_own"
  on public.daily_limits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_limits_delete_own" on public.daily_limits;
create policy "daily_limits_delete_own"
  on public.daily_limits for delete
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);

drop policy if exists "answer_history_select_own" on public.answer_history;
create policy "answer_history_select_own"
  on public.answer_history for select
  using (auth.uid() = user_id);

drop policy if exists "answer_history_insert_own" on public.answer_history;
create policy "answer_history_insert_own"
  on public.answer_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "answer_history_update_own" on public.answer_history;
create policy "answer_history_update_own"
  on public.answer_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "answer_history_delete_own" on public.answer_history;
create policy "answer_history_delete_own"
  on public.answer_history for delete
  using (auth.uid() = user_id);
