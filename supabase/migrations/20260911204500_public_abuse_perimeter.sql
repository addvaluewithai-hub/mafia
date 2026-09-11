-- Second public-launch abuse boundary that survives anonymous auth churn.
-- The client sends a random installation key persisted locally; only its SHA-256 digest
-- is stored. This key is deliberately unrelated to nickname, gender, room, player,
-- story, role, or mafia assignment.

create table public.public_abuse_rate_limits (
  key_hash text not null,
  action text not null check (action in ('create_room', 'join_room', 'generate_case', 'telemetry')),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, action)
);

alter table public.public_abuse_rate_limits enable row level security;
revoke all on table public.public_abuse_rate_limits from public, anon, authenticated;

create or replace function public.claim_public_abuse_slot(p_abuse_key text, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := trim(coalesce(p_abuse_key, ''));
  v_action text := lower(trim(coalesce(p_action, '')));
  v_hash text;
  v_window interval := interval '10 minutes';
  v_max_attempts integer;
  v_row public.public_abuse_rate_limits%rowtype;
  v_retry_seconds integer;
begin
  if length(v_key) < 32 or length(v_key) > 128 or v_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception 'مفتاح الحماية غير صالح';
  end if;

  v_max_attempts := case v_action
    when 'create_room' then 8
    when 'join_room' then 15
    when 'generate_case' then 5
    when 'telemetry' then 120
    else null
  end;
  if v_max_attempts is null then raise exception 'نوع العملية غير صحيح'; end if;

  v_hash := encode(digest(v_key, 'sha256'), 'hex');

  insert into public.public_abuse_rate_limits(key_hash, action, window_started_at, attempts, updated_at)
  values (v_hash, v_action, clock_timestamp(), 0, clock_timestamp())
  on conflict (key_hash, action) do nothing;

  select * into v_row
  from public.public_abuse_rate_limits
  where key_hash = v_hash and action = v_action
  for update;

  if v_row.window_started_at + v_window <= clock_timestamp() then
    update public.public_abuse_rate_limits
    set window_started_at = clock_timestamp(), attempts = 1, updated_at = clock_timestamp()
    where key_hash = v_hash and action = v_action;
    return jsonb_build_object('allowed', true, 'remaining', v_max_attempts - 1, 'retryAfterSeconds', 0);
  end if;

  if v_row.attempts >= v_max_attempts then
    v_retry_seconds := greatest(1, ceil(extract(epoch from (v_row.window_started_at + v_window - clock_timestamp())))::integer);
    return jsonb_build_object('allowed', false, 'remaining', 0, 'retryAfterSeconds', v_retry_seconds);
  end if;

  update public.public_abuse_rate_limits
  set attempts = attempts + 1, updated_at = clock_timestamp()
  where key_hash = v_hash and action = v_action
  returning * into v_row;

  return jsonb_build_object('allowed', true, 'remaining', greatest(0, v_max_attempts - v_row.attempts), 'retryAfterSeconds', 0);
end;
$$;

revoke all on function public.claim_public_abuse_slot(text, text) from public;
grant execute on function public.claim_public_abuse_slot(text, text) to anon, authenticated;

create or replace function public.create_room_v4(
  p_boss_name text,
  p_boss_gender text,
  p_max_players integer,
  p_difficulty text,
  p_theme text,
  p_case_mode text,
  p_story_template_id text,
  p_abuse_key text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare v_slot jsonb;
begin
  v_slot := public.claim_public_abuse_slot(p_abuse_key, 'create_room');
  if not coalesce((v_slot->>'allowed')::boolean, false) then
    raise exception 'عملت رومز كتير من الجهاز ده بسرعة. استنى شوية وجرب تاني';
  end if;
  return public.create_room_v3(p_boss_name, p_boss_gender, p_max_players, p_difficulty, p_theme, p_case_mode, p_story_template_id);
end;
$$;

create or replace function public.join_room_v3(p_code text, p_nickname text, p_gender text, p_abuse_key text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare v_slot jsonb;
begin
  v_slot := public.claim_public_abuse_slot(p_abuse_key, 'join_room');
  if not coalesce((v_slot->>'allowed')::boolean, false) then
    raise exception 'دخلت رومز كتير من الجهاز ده بسرعة. استنى شوية وجرب تاني';
  end if;
  return public.join_room_v2(p_code, p_nickname, p_gender);
end;
$$;

create or replace function public.claim_case_generation_slot_v2(p_code text, p_abuse_key text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare v_public jsonb; v_user jsonb;
begin
  v_public := public.claim_public_abuse_slot(p_abuse_key, 'generate_case');
  if not coalesce((v_public->>'allowed')::boolean, false) then return v_public || jsonb_build_object('reason', 'public_budget'); end if;
  v_user := public.claim_case_generation_slot(p_code);
  return v_user;
end;
$$;

revoke all on function public.create_room_v4(text, text, integer, text, text, text, text, text) from public, anon;
grant execute on function public.create_room_v4(text, text, integer, text, text, text, text, text) to authenticated;
revoke all on function public.join_room_v3(text, text, text, text) from public, anon;
grant execute on function public.join_room_v3(text, text, text, text) to authenticated;
revoke all on function public.claim_case_generation_slot_v2(text, text) from public, anon;
grant execute on function public.claim_case_generation_slot_v2(text, text) to authenticated;
