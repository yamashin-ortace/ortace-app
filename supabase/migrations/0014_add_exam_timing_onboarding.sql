-- 初回設定で学年ではなく受験予定を取得する。
-- 既存利用者の grade / goal は互換性のため残す。

alter table public.profiles
  add column if not exists exam_timing text;

alter table public.profiles
  drop constraint if exists profiles_exam_timing_check,
  add constraint profiles_exam_timing_check
    check (exam_timing is null or exam_timing in ('next_exam', 'later', 'undecided'));

-- 本人が更新できるプロフィール列に受験予定を追加する。
revoke update on public.profiles from authenticated;
grant update (nickname, grade, goal, exam_timing) on public.profiles to authenticated;
