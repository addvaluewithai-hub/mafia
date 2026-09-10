-- Add a gender-aware backend contract without breaking existing RPC callers.
-- Existing create_room/create_room_v2/join_room stay available until the UI migrates.

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
  if v_mode = 'preset' and nullif(trim(coalesce(p_story_template_id, '')), '') is null then
    raise exception 'اختار قضية جاهزة';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms(
    code, host_id, boss_name, max_players, mafia_count, difficulty, theme, case_mode, story_template_id
  ) values (
    v_code,
    auth.uid(),
    trim(p_boss_name),
    p_max_players,
    case when p_max_players >= 10 then 3 when p_max_players >= 6 then 2 else 1 end,
    p_difficulty,
    coalesce(nullif(trim(p_theme), ''), 'حفلة عائلية مصرية معاصرة'),
    v_mode,
    case when v_mode = 'preset' then nullif(trim(p_story_template_id), '') else null end
  ) returning id into v_room_id;

  insert into public.players(room_id, user_id, nickname, gender)
  values (v_room_id, auth.uid(), trim(p_boss_name), v_gender);

  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

create or replace function public.join_room_v2(
  p_code text,
  p_nickname text,
  p_gender text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_count integer;
  v_gender text := lower(trim(coalesce(p_gender, '')));
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if v_gender not in ('male', 'female') then raise exception 'اختار الجنس'; end if;

  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.status <> 'lobby' then raise exception 'القضية بدأت ومش بنقبل لاعبين جدد'; end if;

  if exists (select 1 from public.players where room_id = v_room.id and user_id = auth.uid()) then
    return v_room.code;
  end if;
  if v_room.host_id = auth.uid() then
    return v_room.code;
  end if;

  if length(trim(p_nickname)) < 2 then raise exception 'الاسم قصير جدًا'; end if;

  select count(*) into v_count from public.players where room_id = v_room.id;
  if v_count >= v_room.max_players then raise exception 'الروم كامل'; end if;
  if exists (
    select 1 from public.players
    where room_id = v_room.id and lower(nickname) = lower(trim(p_nickname))
  ) then
    raise exception 'الاسم ده مستخدم في الروم';
  end if;

  insert into public.players(room_id, user_id, nickname, gender)
  values (v_room.id, auth.uid(), trim(p_nickname), v_gender);

  perform public.emit_room_event(v_room.id, 'player_joined');
  return v_room.code;
end;
$$;

revoke all on function public.create_room_v3(text, text, integer, text, text, text, text) from public, anon;
grant execute on function public.create_room_v3(text, text, integer, text, text, text, text) to authenticated;
revoke all on function public.join_room_v2(text, text, text) from public, anon;
grant execute on function public.join_room_v2(text, text, text) to authenticated;
