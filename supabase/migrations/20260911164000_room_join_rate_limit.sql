-- Public-launch abuse protection for room creation and successful room joins.
-- Limits are per authenticated identity, DB-backed, and shared across current/legacy RPCs.

create table if not exists public.room_action_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('create_room', 'join_room')),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, action)
);

alter table public.room_action_rate_limits enable row level security;
revoke all on table public.room_action_rate_limits from public, anon, authenticated;

create or replace function public.claim_room_action_slot(p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_action text := lower(trim(coalesce(p_action, '')));
  v_window interval := interval '10 minutes';
  v_max_attempts integer;
  v_row public.room_action_rate_limits%rowtype;
begin
  if v_user_id is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if v_action = 'create_room' then
    v_max_attempts := 5;
  elsif v_action = 'join_room' then
    v_max_attempts := 8;
  else
    raise exception 'نوع العملية غير صحيح';
  end if;

  insert into public.room_action_rate_limits(user_id, action, window_started_at, attempts, updated_at)
  values (v_user_id, v_action, now(), 0, now())
  on conflict (user_id, action) do nothing;

  select * into v_row
  from public.room_action_rate_limits
  where user_id = v_user_id and action = v_action
  for update;

  if v_row.window_started_at + v_window <= now() then
    update public.room_action_rate_limits
    set window_started_at = now(), attempts = 1, updated_at = now()
    where user_id = v_user_id and action = v_action;
    return;
  end if;

  if v_row.attempts >= v_max_attempts then
    if v_action = 'create_room' then
      raise exception 'عملت رومز كتير بسرعة. استنى شوية وجرب تاني';
    else
      raise exception 'دخلت رومز كتير بسرعة. استنى شوية وجرب تاني';
    end if;
  end if;

  update public.room_action_rate_limits
  set attempts = attempts + 1, updated_at = now()
  where user_id = v_user_id and action = v_action;
end;
$$;

revoke all on function public.claim_room_action_slot(text) from public, anon, authenticated;

create or replace function public.create_room_v3(
  p_boss_name text,
  p_boss_gender text,
  p_max_players integer,
  p_difficulty text,
  p_theme text,
  p_case_mode text,
  p_story_template_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_room_id uuid;
  v_mode text := lower(trim(coalesce(p_case_mode, 'ai')));
  v_gender text := lower(trim(coalesce(p_boss_gender, '')));
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if length(trim(p_boss_name)) < 2 then raise exception 'اسم الـBoss قصير جدًا'; end if;
  if v_gender not in ('male', 'female') then raise exception 'اختار الجنس'; end if;
  if p_max_players not between 4 and 12 then raise exception 'عدد اللاعبين لازم يكون من 4 إلى 12'; end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then raise exception 'مستوى الصعوبة غير صحيح'; end if;
  if v_mode not in ('ai', 'preset') then raise exception 'مصدر القضية غير صحيح'; end if;
  if v_mode = 'preset' and nullif(trim(coalesce(p_story_template_id, '')), '') is null then raise exception 'اختار قضية جاهزة'; end if;

  perform public.claim_room_action_slot('create_room');

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms(code, host_id, boss_name, max_players, mafia_count, difficulty, theme, case_mode, story_template_id)
  values (v_code, auth.uid(), trim(p_boss_name), p_max_players,
    case when p_max_players >= 10 then 3 when p_max_players >= 6 then 2 else 1 end,
    p_difficulty, coalesce(nullif(trim(p_theme), ''), 'حفلة عائلية مصرية معاصرة'), v_mode,
    case when v_mode = 'preset' then nullif(trim(p_story_template_id), '') else null end)
  returning id into v_room_id;

  insert into public.players(room_id, user_id, nickname, gender)
  values (v_room_id, auth.uid(), trim(p_boss_name), v_gender);

  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

create or replace function public.create_room_v2(
  p_boss_name text, p_max_players integer, p_difficulty text, p_theme text,
  p_case_mode text, p_story_template_id text default null
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_code text; v_room_id uuid; v_mode text := lower(trim(coalesce(p_case_mode, 'ai')));
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if length(trim(p_boss_name)) < 2 then raise exception 'اسم الـBoss قصير جدًا'; end if;
  if p_max_players not between 4 and 12 then raise exception 'عدد اللاعبين لازم يكون من 4 إلى 12'; end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then raise exception 'مستوى الصعوبة غير صحيح'; end if;
  if v_mode not in ('ai', 'preset') then raise exception 'مصدر القضية غير صحيح'; end if;
  if v_mode = 'preset' and nullif(trim(coalesce(p_story_template_id, '')), '') is null then raise exception 'اختار قضية جاهزة'; end if;
  perform public.claim_room_action_slot('create_room');
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;
  insert into public.rooms(code, host_id, boss_name, max_players, mafia_count, difficulty, theme, case_mode, story_template_id)
  values (v_code, auth.uid(), trim(p_boss_name), p_max_players,
    case when p_max_players >= 10 then 3 when p_max_players >= 6 then 2 else 1 end,
    p_difficulty, coalesce(nullif(trim(p_theme), ''), 'حفلة عائلية مصرية معاصرة'), v_mode,
    case when v_mode = 'preset' then nullif(trim(p_story_template_id), '') else null end)
  returning id into v_room_id;
  insert into public.players(room_id, user_id, nickname) values (v_room_id, auth.uid(), trim(p_boss_name));
  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

create or replace function public.create_room(p_boss_name text, p_max_players integer, p_difficulty text, p_theme text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_code text; v_room_id uuid;
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if length(trim(p_boss_name)) < 2 then raise exception 'اسم الـBoss قصير جدًا'; end if;
  if p_max_players not between 4 and 12 then raise exception 'عدد اللاعبين لازم يكون من 4 إلى 12'; end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then raise exception 'مستوى الصعوبة غير صحيح'; end if;
  perform public.claim_room_action_slot('create_room');
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;
  insert into public.rooms(code, host_id, boss_name, max_players, mafia_count, difficulty, theme)
  values (v_code, auth.uid(), trim(p_boss_name), p_max_players,
    case when p_max_players >= 10 then 3 when p_max_players >= 6 then 2 else 1 end,
    p_difficulty, coalesce(nullif(trim(p_theme), ''), 'حفلة عائلية مصرية معاصرة')) returning id into v_room_id;
  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

create or replace function public.join_room_v2(p_code text, p_nickname text, p_gender text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_room public.rooms%rowtype; v_count integer; v_gender text := lower(trim(coalesce(p_gender, '')));
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if v_gender not in ('male', 'female') then raise exception 'اختار الجنس'; end if;
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.status <> 'lobby' then raise exception 'القضية بدأت ومش بنقبل لاعبين جدد'; end if;
  if exists (select 1 from public.players where room_id = v_room.id and user_id = auth.uid()) then return v_room.code; end if;
  if v_room.host_id = auth.uid() then return v_room.code; end if;
  if length(trim(p_nickname)) < 2 then raise exception 'الاسم قصير جدًا'; end if;
  select count(*) into v_count from public.players where room_id = v_room.id;
  if v_count >= v_room.max_players then raise exception 'الروم كامل'; end if;
  if exists (select 1 from public.players where room_id = v_room.id and lower(nickname) = lower(trim(p_nickname))) then raise exception 'الاسم ده مستخدم في الروم'; end if;
  perform public.claim_room_action_slot('join_room');
  insert into public.players(room_id, user_id, nickname, gender) values (v_room.id, auth.uid(), trim(p_nickname), v_gender);
  perform public.emit_room_event(v_room.id, 'player_joined');
  return v_room.code;
end;
$$;

create or replace function public.join_room(p_code text, p_nickname text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms%rowtype; v_count integer;
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.status <> 'lobby' then raise exception 'القضية بدأت ومش بنقبل لاعبين جدد'; end if;
  if v_room.host_id = auth.uid() then raise exception 'الـBoss مش محسوب ضمن المشتبه فيهم'; end if;
  if length(trim(p_nickname)) < 2 then raise exception 'الاسم قصير جدًا'; end if;
  if exists (select 1 from public.players where room_id = v_room.id and user_id = auth.uid()) then return v_room.code; end if;
  select count(*) into v_count from public.players where room_id = v_room.id;
  if v_count >= v_room.max_players then raise exception 'الروم كامل'; end if;
  if exists (select 1 from public.players where room_id = v_room.id and lower(nickname) = lower(trim(p_nickname))) then raise exception 'الاسم ده مستخدم في الروم'; end if;
  perform public.claim_room_action_slot('join_room');
  insert into public.players(room_id, user_id, nickname) values (v_room.id, auth.uid(), trim(p_nickname));
  perform public.emit_room_event(v_room.id, 'player_joined');
  return v_room.code;
end;
$$;

revoke all on function public.create_room_v3(text, text, integer, text, text, text, text) from public, anon;
grant execute on function public.create_room_v3(text, text, integer, text, text, text, text) to authenticated;
revoke all on function public.create_room_v2(text, integer, text, text, text, text) from public, anon;
grant execute on function public.create_room_v2(text, integer, text, text, text, text) to authenticated;
revoke all on function public.create_room(text, integer, text, text) from public, anon;
grant execute on function public.create_room(text, integer, text, text) to authenticated;
revoke all on function public.join_room_v2(text, text, text) from public, anon;
grant execute on function public.join_room_v2(text, text, text) to authenticated;
revoke all on function public.join_room(text, text) from public, anon;
grant execute on function public.join_room(text, text) to authenticated;
