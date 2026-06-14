-- 問い合わせフォームのサーバー側レート制限。
-- IP・メールアドレスはアプリ側でハッシュ化した bucket_key のみ保存する。

create table if not exists public.contact_rate_limits (
  bucket_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null default now()
);

create index if not exists contact_rate_limits_expires_at_idx
  on public.contact_rate_limits (expires_at);

alter table public.contact_rate_limits enable row level security;

grant select, insert, update, delete on public.contact_rate_limits to service_role;

create or replace function public.consume_contact_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_limit integer
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_started_at timestamptz;
  v_request_count integer;
  v_window_end timestamptz;
begin
  insert into public.contact_rate_limits as limits (
    bucket_key,
    request_count,
    window_started_at,
    expires_at
  )
  values (
    p_bucket_key,
    1,
    v_now,
    v_now + make_interval(secs => p_window_seconds)
  )
  on conflict (bucket_key) do update
  set
    request_count = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    expires_at = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now + make_interval(secs => p_window_seconds)
      else limits.window_started_at + make_interval(secs => p_window_seconds)
    end
  returning
    limits.request_count,
    limits.window_started_at
  into v_request_count, v_window_started_at;

  v_window_end := v_window_started_at + make_interval(secs => p_window_seconds);

  allowed := v_request_count <= p_limit;
  request_count := v_request_count;
  retry_after_seconds := greatest(
    0,
    ceiling(extract(epoch from v_window_end - v_now))::integer
  );
  return next;
end;
$$;

grant execute on function public.consume_contact_rate_limit(text, integer, integer)
  to service_role;
