-- Allow the Boss to reopen a finished room for another case without making players rejoin.
-- Player identity/gender membership is preserved; all per-case state is cleared before the next install_case.

create or replace function public.reset_room_for_rematch(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(p_code))
  for update;

  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يبدأ جولة جديدة'; end if;
  if v_room.status <> 'finished' then raise exception 'لازم القضية الحالية تخلص الأول'; end if;

  delete from public.votes where room_id = v_room.id;
  delete from public.eliminations where room_id = v_room.id;
  delete from public.player_roles where room_id = v_room.id;
  delete from public.rounds where room_id = v_room.id;
  delete from public.case_secrets where room_id = v_room.id;

  update public.players
  set character_name = null,
      character_bio = null,
      case_role = null,
      is_eliminated = false
  where room_id = v_room.id;

  update public.rooms
  set status = 'lobby',
      title = null,
      premise = null,
      round_index = -1,
      last_resolved_round = -1,
      winner = null,
      public_solution = null,
      timer_duration_seconds = 300,
      timer_ends_at = null
  where id = v_room.id;

  perform public.emit_room_event(v_room.id, 'room_rematched');
end;
$$;

revoke all on function public.reset_room_for_rematch(text) from public, anon;
grant execute on function public.reset_room_for_rematch(text) to authenticated;
