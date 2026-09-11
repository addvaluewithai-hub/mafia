create table public.case_generation_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz
);

alter table public.case_generation_rate_limits enable row level security;

revoke all on table public.case_generation_rate_limits from public, authenticated;

create or replace function public.claim_case_generation_slot(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_limit public.case_generation_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_window interval := interval '10 minutes';
  v_cooldown interval := interval '20 seconds';
  v_max_attempts integer := 3;
  v_retry_seconds integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_room
  from public.rooms
  where code = upper(trim(p_code));

  if not found then
    raise exception 'الروم مش موجود';
  end if;
  if v_room.host_id <> auth.uid() then
    raise exception 'الـBoss فقط يقدر يجهز القضية';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'القضية بدأت بالفعل';
  end if;
  if coalesce(v_room.case_mode, 'ai') <> 'ai' then
    raise exception 'القضية الجاهزة لا تحتاج توليد AI';
  end if;

  insert into public.case_generation_rate_limits(user_id, window_started_at, attempt_count, last_attempt_at)
  values (auth.uid(), v_now, 0, null)
  on conflict (user_id) do nothing;

  select * into v_limit
  from public.case_generation_rate_limits
  where user_id = auth.uid()
  for update;

  if v_limit.window_started_at + v_window <= v_now then
    update public.case_generation_rate_limits
    set window_started_at = v_now,
        attempt_count = 0,
        last_attempt_at = null
    where user_id = auth.uid()
    returning * into v_limit;
  end if;

  if v_limit.last_attempt_at is not null and v_limit.last_attempt_at + v_cooldown > v_now then
    v_retry_seconds := greatest(1, ceil(extract(epoch from (v_limit.last_attempt_at + v_cooldown - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'reason', 'cooldown',
      'retryAfterSeconds', v_retry_seconds,
      'remaining', greatest(0, v_max_attempts - v_limit.attempt_count)
    );
  end if;

  if v_limit.attempt_count >= v_max_attempts then
    v_retry_seconds := greatest(1, ceil(extract(epoch from (v_limit.window_started_at + v_window - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'reason', 'budget',
      'retryAfterSeconds', v_retry_seconds,
      'remaining', 0
    );
  end if;

  update public.case_generation_rate_limits
  set attempt_count = attempt_count + 1,
      last_attempt_at = v_now
  where user_id = auth.uid()
  returning * into v_limit;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'retryAfterSeconds', 0,
    'remaining', greatest(0, v_max_attempts - v_limit.attempt_count)
  );
end;
$$;

revoke all on function public.claim_case_generation_slot(text) from public;
grant execute on function public.claim_case_generation_slot(text) to authenticated;
