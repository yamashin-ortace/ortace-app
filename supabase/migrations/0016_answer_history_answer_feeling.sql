alter table public.answer_history
  add column if not exists answer_feeling text;

alter table public.answer_history
  drop constraint if exists answer_history_answer_feeling_check;

alter table public.answer_history
  add constraint answer_history_answer_feeling_check
  check (
    answer_feeling is null
    or answer_feeling in ('confident', 'unsure', 'no_basis', 'careless', 'stuck')
  );
