alter table public.rooms add column if not exists timer_duration_seconds integer not null default 300;
alter table public.rooms add column if not exists timer_ends_at timestamptz;

alter table public.rooms drop constraint if exists rooms_timer_duration_seconds_check;
alter table public.rooms add constraint rooms_timer_duration_seconds_check check (timer_duration_seconds between 30 and 900);

create or replace function public.restart_discussion_timer(p_code text, p_seconds integer default 300)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يتحكم في العداد'; end if;
  if v_room.status <> 'playing' then raise exception 'اللعبة مش شغالة دلوقتي'; end if;
  if p_seconds not between 30 and 900 then raise exception 'وقت النقاش لازم يكون من 30 ثانية إلى 15 دقيقة'; end if;

  update public.rooms
  set timer_duration_seconds = p_seconds,
      timer_ends_at = now() + make_interval(secs => p_seconds)
  where id = v_room.id;

  perform public.emit_room_event(v_room.id, 'timer_restarted');
end;
$$;

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
  if v_mafia_count <> (case when v_player_count >= 10 then 3 when v_player_count >= 6 then 2 else 1 end) then raise exception 'عدد المافيا غير صحيح'; end if;
  if v_round_count <> 4 then raise exception 'القضية لازم تحتوي على 4 أدلة'; end if;

  delete from public.votes where room_id = v_room.id;
  delete from public.eliminations where room_id = v_room.id;
  delete from public.player_roles where room_id = v_room.id;
  delete from public.rounds where room_id = v_room.id;
  delete from public.case_secrets where room_id = v_room.id;

  for v_player in select * from public.players where room_id = v_room.id order by random() loop
    v_character := p_case->'characters'->v_index;
    v_role := case when exists (
      select 1 from jsonb_array_elements_text(p_case->'mafiaCharacterIndexes') as x(value)
      where x.value::integer = v_index
    ) then 'mafia' else 'innocent' end;

    update public.players
    set character_name = v_character->>'name', character_bio = v_character->>'bio', is_eliminated = false
    where id = v_player.id;

    insert into public.player_roles(player_id, room_id, user_id, role)
    values (v_player.id, v_room.id, v_player.user_id, v_role);

    v_index := v_index + 1;
  end loop;

  insert into public.rounds(room_id, round_index, clue, discussion_prompt, is_revealed)
  select v_room.id, ordinality::integer - 1, item->>'clue', item->>'discussionPrompt', ordinality = 1
  from jsonb_array_elements(p_case->'rounds') with ordinality as items(item, ordinality);

  insert into public.case_secrets(room_id, full_case, solution)
  values (v_room.id, p_case, p_case->>'solution');

  update public.rooms
  set status = 'playing', mafia_count = v_mafia_count, title = p_case->>'title', premise = p_case->>'premise',
      round_index = 0, last_resolved_round = -1, winner = null, public_solution = null,
      timer_duration_seconds = 300, timer_ends_at = now() + interval '5 minutes'
  where id = v_room.id;

  perform public.emit_room_event(v_room.id, 'case_started');
end;
$$;

create or replace function public.reveal_next_round(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_next integer;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يكشف الدليل'; end if;
  if v_room.status <> 'playing' then raise exception 'اللعبة انتهت أو لم تبدأ'; end if;
  if v_room.last_resolved_round <> v_room.round_index then raise exception 'احسم التصويت الأول'; end if;

  v_next := v_room.round_index + 1;
  if not exists (select 1 from public.rounds where room_id = v_room.id and round_index = v_next) then raise exception 'مفيش أدلة تانية'; end if;

  update public.rounds set is_revealed = true where room_id = v_room.id and round_index = v_next;
  update public.rooms set round_index = v_next, timer_ends_at = now() + make_interval(secs => timer_duration_seconds) where id = v_room.id;
  perform public.emit_room_event(v_room.id, 'clue_revealed');
end;
$$;

create or replace function public.resolve_vote(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_eligible integer;
  v_vote_count integer;
  v_target uuid;
  v_max_votes integer;
  v_top_targets integer;
  v_role text;
  v_nickname text;
  v_alive_mafia integer;
  v_innocents_eliminated integer;
  v_last_round integer;
  v_winner text := null;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يحسم التصويت'; end if;
  if v_room.status <> 'playing' then raise exception 'اللعبة مش في مرحلة تصويت'; end if;
  if v_room.last_resolved_round >= v_room.round_index then raise exception 'الجولة اتحسمت بالفعل'; end if;

  select count(*) into v_eligible from public.players where room_id = v_room.id and not is_eliminated;
  select count(*) into v_vote_count from public.votes where room_id = v_room.id and round_index = v_room.round_index;
  if v_vote_count < v_eligible then return jsonb_build_object('status', 'pending', 'missing', v_eligible - v_vote_count); end if;

  select target_player_id, count(*)::integer into v_target, v_max_votes
  from public.votes where room_id = v_room.id and round_index = v_room.round_index
  group by target_player_id order by count(*) desc limit 1;

  select count(*) into v_top_targets from (
    select target_player_id from public.votes
    where room_id = v_room.id and round_index = v_room.round_index
    group by target_player_id having count(*) = v_max_votes
  ) tied;

  if v_top_targets > 1 then
    delete from public.votes where room_id = v_room.id and round_index = v_room.round_index;
    update public.rooms set timer_ends_at = now() + interval '1 minute' where id = v_room.id;
    perform public.emit_room_event(v_room.id, 'vote_tie');
    return jsonb_build_object('status', 'tie');
  end if;

  select pr.role, p.nickname into v_role, v_nickname from public.player_roles pr join public.players p on p.id = pr.player_id where pr.player_id = v_target;
  update public.players set is_eliminated = true where id = v_target;
  insert into public.eliminations(room_id, round_index, player_id, revealed_role) values (v_room.id, v_room.round_index, v_target, v_role);
  update public.rooms set last_resolved_round = v_room.round_index where id = v_room.id;

  select count(*) into v_alive_mafia from public.players p join public.player_roles pr on pr.player_id = p.id where p.room_id = v_room.id and not p.is_eliminated and pr.role = 'mafia';
  select count(*) into v_innocents_eliminated from public.eliminations where room_id = v_room.id and revealed_role = 'innocent';
  select max(round_index) into v_last_round from public.rounds where room_id = v_room.id;

  if v_alive_mafia = 0 then v_winner := 'innocents';
  elsif v_innocents_eliminated >= 3 then v_winner := 'mafia';
  elsif v_room.round_index >= v_last_round then v_winner := 'mafia';
  end if;

  if v_winner is not null then
    update public.rooms r set status = 'finished', winner = v_winner, public_solution = s.solution, timer_ends_at = null
    from public.case_secrets s where r.id = v_room.id and s.room_id = r.id;
    perform public.emit_room_event(v_room.id, 'game_finished');
    return jsonb_build_object('status', 'finished', 'nickname', v_nickname, 'role', v_role, 'winner', v_winner);
  end if;

  perform public.emit_room_event(v_room.id, 'player_eliminated');
  return jsonb_build_object('status', 'eliminated', 'nickname', v_nickname, 'role', v_role);
end;
$$;

create or replace function public.room_snapshot(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_player public.players%rowtype;
  v_role text;
  v_is_host boolean := false;
  v_player_count integer;
  v_votes_cast integer := 0;
  v_eligible integer := 0;
  v_vote_submitted boolean := false;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select * into v_room from public.rooms where code = upper(trim(p_code));
  if not found then raise exception 'الروم مش موجود'; end if;

  v_is_host := v_room.host_id = auth.uid();
  select * into v_player from public.players where room_id = v_room.id and user_id = auth.uid();
  if not v_is_host and v_player.id is null and v_room.status <> 'lobby' then raise exception 'القضية بدأت بالفعل'; end if;
  if v_player.id is not null then select role into v_role from public.player_roles where player_id = v_player.id; end if;

  select count(*) into v_player_count from public.players where room_id = v_room.id;
  select count(*) into v_eligible from public.players where room_id = v_room.id and not is_eliminated;
  if v_room.round_index >= 0 then
    select count(*) into v_votes_cast from public.votes where room_id = v_room.id and round_index = v_room.round_index;
    if v_player.id is not null then
      select exists(select 1 from public.votes where room_id = v_room.id and round_index = v_room.round_index and voter_player_id = v_player.id) into v_vote_submitted;
    end if;
  end if;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id, 'code', v_room.code, 'bossName', v_room.boss_name, 'status', v_room.status,
      'maxPlayers', v_room.max_players, 'mafiaCount', v_room.mafia_count, 'difficulty', v_room.difficulty,
      'theme', v_room.theme, 'title', v_room.title, 'premise', v_room.premise, 'roundIndex', v_room.round_index,
      'lastResolvedRound', v_room.last_resolved_round, 'winner', v_room.winner, 'publicSolution', v_room.public_solution,
      'timerDurationSeconds', v_room.timer_duration_seconds, 'timerEndsAt', v_room.timer_ends_at
    ),
    'isHost', v_is_host,
    'me', case when v_player.id is null then null else jsonb_build_object('playerId', v_player.id, 'role', v_role, 'isEliminated', v_player.is_eliminated) end,
    'players', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nickname', p.nickname, 'characterName', p.character_name, 'characterBio', p.character_bio, 'isEliminated', p.is_eliminated) order by p.joined_at) from public.players p where p.room_id = v_room.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('roundIndex', r.round_index, 'clue', r.clue, 'discussionPrompt', r.discussion_prompt) order by r.round_index) from public.rounds r where r.room_id = v_room.id and r.is_revealed), '[]'::jsonb),
    'eliminations', coalesce((select jsonb_agg(jsonb_build_object('playerId', e.player_id, 'nickname', p.nickname, 'revealedRole', e.revealed_role, 'roundIndex', e.round_index) order by e.created_at) from public.eliminations e join public.players p on p.id = e.player_id where e.room_id = v_room.id), '[]'::jsonb),
    'playerCount', v_player_count, 'votesCast', v_votes_cast, 'eligibleVoters', v_eligible, 'voteSubmitted', v_vote_submitted
  );
end;
$$;

revoke all on function public.restart_discussion_timer(text, integer) from public, anon;
grant execute on function public.restart_discussion_timer(text, integer) to authenticated;
