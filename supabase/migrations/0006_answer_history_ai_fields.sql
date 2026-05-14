alter table public.answer_history
  add column if not exists confidence text,
  add column if not exists duration_ms integer;

alter table public.answer_history
  drop constraint if exists answer_history_confidence_check;

alter table public.answer_history
  add constraint answer_history_confidence_check
  check (confidence is null or confidence in ('high', 'mid', 'guess'));

alter table public.answer_history
  drop constraint if exists answer_history_duration_ms_check;

alter table public.answer_history
  add constraint answer_history_duration_ms_check
  check (duration_ms is null or (duration_ms >= 0 and duration_ms <= 86400000));
