-- Choose gender-appropriate wording for the already-randomly assigned case character.
-- This intentionally does not change player shuffle or mafiaCharacterIndexes semantics.
-- New payloads may provide roleByGender/bioByGender while legacy role/bio remain valid fallbacks.

create or replace function public.install_case(p_code text, p_case jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_player public.players%rowtype;
  v_player_count integer;
  v_character_count integer;
  v_mafia_count integer;
  v_round_count integer;
  v_index integer := 0;
  v_character jsonb;
  v_role text;
  v_case_role text;
  v_character_bio text;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يبدأ'; end if;
  if v_room.status <> 'lobby' then raise exception 'القضية بدأت بالفعل'; end if;

  select count(*) into v_player_count from public.players where room_id = v_room.id;
  if v_player_count < 4 or v_player_count > 12 then raise exception 'عدد اللاعبين غير صالح'; end if;

  v_character_count := jsonb_array_length(p_case->'characters');
  v_mafia_count := jsonb_array_length(p_case->'mafiaCharacterIndexes');
  v_round_count := jsonb_array_length(p_case->'rounds');

  if v_character_count <> v_player_count then raise exception 'عدد الشخصيات لا يساوي عدد اللاعبين'; end if;
  if v_mafia_count <> (case when v_player_count >= 10 then 3 when v_player_count >= 6 then 2 else 1 end) then
    raise exception 'عدد المافيا غير صحيح';
  end if;
  if v_round_count <> 4 then raise exception 'القضية لازم تحتوي على 4 أدلة'; end if;

  delete from public.votes where room_id = v_room.id;
  delete from public.eliminations where room_id = v_room.id;
  delete from public.player_roles where room_id = v_room.id;
  delete from public.rounds where room_id = v_room.id;
  delete from public.case_secrets where room_id = v_room.id;

  for v_player in
    select * from public.players where room_id = v_room.id order by random()
  loop
    v_character := p_case->'characters'->v_index;
    v_role := case when exists (
      select 1
      from jsonb_array_elements_text(p_case->'mafiaCharacterIndexes') as x(value)
      where x.value::integer = v_index
    ) then 'mafia' else 'innocent' end;

    v_case_role := null;
    v_character_bio := null;
    if v_player.gender in ('male', 'female') then
      v_case_role := nullif(trim(v_character #>> array['roleByGender', v_player.gender]), '');
      v_character_bio := nullif(trim(v_character #>> array['bioByGender', v_player.gender]), '');
    end if;
    v_case_role := coalesce(v_case_role, nullif(trim(v_character->>'role'), ''));
    v_character_bio := coalesce(v_character_bio, v_character->>'bio');

    update public.players
    set character_name = nullif(trim(v_character->>'name'), ''),
        character_bio = v_character_bio,
        case_role = v_case_role,
        is_eliminated = false
    where id = v_player.id;

    insert into public.player_roles(player_id, room_id, user_id, role)
    values (v_player.id, v_room.id, v_player.user_id, v_role);

    v_index := v_index + 1;
  end loop;

  insert into public.rounds(room_id, round_index, clue, discussion_prompt, is_revealed)
  select
    v_room.id,
    ordinality::integer - 1,
    item->>'clue',
    item->>'discussionPrompt',
    ordinality = 1
  from jsonb_array_elements(p_case->'rounds') with ordinality as items(item, ordinality);

  insert into public.case_secrets(room_id, full_case, solution)
  values (v_room.id, p_case, p_case->>'solution');

  update public.rooms
  set status = 'playing',
      mafia_count = v_mafia_count,
      title = p_case->>'title',
      premise = p_case->>'premise',
      round_index = 0,
      last_resolved_round = -1,
      winner = null,
      public_solution = null
  where id = v_room.id;

  perform public.emit_room_event(v_room.id, 'case_started');
end;
$$;

revoke all on function public.install_case(text, jsonb) from public, anon;
grant execute on function public.install_case(text, jsonb) to authenticated;
