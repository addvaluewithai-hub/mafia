-- Repair Session 31 regression: legacy create_room must still create the Boss player row.
-- Keep the shared create-room abuse budget while preserving the established identity contract.

create or replace function public.create_room(
  p_boss_name text,
  p_max_players integer,
  p_difficulty text,
  p_theme text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_room_id uuid;
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
  values (
    v_code,
    auth.uid(),
    trim(p_boss_name),
    p_max_players,
    case when p_max_players >= 10 then 3 when p_max_players >= 6 then 2 else 1 end,
    p_difficulty,
    coalesce(nullif(trim(p_theme), ''), 'حفلة عائلية مصرية معاصرة')
  )
  returning id into v_room_id;

  insert into public.players(room_id, user_id, nickname)
  values (v_room_id, auth.uid(), trim(p_boss_name));

  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

revoke all on function public.create_room(text, integer, text, text) from public, anon;
grant execute on function public.create_room(text, integer, text, text) to authenticated;
