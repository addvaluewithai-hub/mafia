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
  if auth.uid() is null then
    raise exception 'لازم تبدأ جلسة الأول';
  end if;
  if length(trim(p_boss_name)) < 2 then
    raise exception 'اسم الـBoss قصير جدًا';
  end if;
  if p_max_players not between 4 and 12 then
    raise exception 'عدد اللاعبين لازم يكون من 4 إلى 12';
  end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then
    raise exception 'مستوى الصعوبة غير صحيح';
  end if;

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

  -- The Boss is player #1. max_players is the total count including the Boss.
  insert into public.players(room_id, user_id, nickname)
  values (v_room_id, auth.uid(), trim(p_boss_name));

  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
end;
$$;

create or replace function public.join_room(p_code text, p_nickname text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'لازم تبدأ جلسة الأول';
  end if;

  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.status <> 'lobby' then raise exception 'القضية بدأت ومش بنقبل لاعبين جدد'; end if;

  -- New rooms already contain the Boss as a player. Keep old rooms unchanged.
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

  insert into public.players(room_id, user_id, nickname)
  values (v_room.id, auth.uid(), trim(p_nickname));

  perform public.emit_room_event(v_room.id, 'player_joined');
  return v_room.code;
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

  if not v_is_host and v_player.id is null and v_room.status <> 'lobby' then
    raise exception 'القضية بدأت بالفعل';
  end if;

  if v_player.id is not null then
    select role into v_role from public.player_roles where player_id = v_player.id;
  end if;

  select count(*) into v_player_count from public.players where room_id = v_room.id;
  select count(*) into v_eligible from public.players where room_id = v_room.id and not is_eliminated;

  if v_room.round_index >= 0 then
    select count(*) into v_votes_cast from public.votes where room_id = v_room.id and round_index = v_room.round_index;
    if v_player.id is not null then
      select exists (
        select 1 from public.votes
        where room_id = v_room.id and round_index = v_room.round_index and voter_player_id = v_player.id
      ) into v_vote_submitted;
    end if;
  end if;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'bossName', v_room.boss_name,
      'status', v_room.status,
      'maxPlayers', v_room.max_players,
      'mafiaCount', v_room.mafia_count,
      'difficulty', v_room.difficulty,
      'theme', v_room.theme,
      'title', v_room.title,
      'premise', v_room.premise,
      'roundIndex', v_room.round_index,
      'lastResolvedRound', v_room.last_resolved_round,
      'winner', v_room.winner,
      'publicSolution', v_room.public_solution,
      'timerDurationSeconds', v_room.timer_duration_seconds,
      'timerEndsAt', v_room.timer_ends_at
    ),
    'isHost', v_is_host,
    'me', case when v_player.id is null then null else jsonb_build_object(
      'playerId', v_player.id,
      'role', v_role,
      'isEliminated', v_player.is_eliminated
    ) end,
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nickname', p.nickname,
        'characterName', p.character_name,
        'characterBio', p.character_bio,
        'isEliminated', p.is_eliminated,
        'isHost', p.user_id = v_room.host_id
      ) order by p.joined_at)
      from public.players p where p.room_id = v_room.id
    ), '[]'::jsonb),
    'rounds', coalesce((
      select jsonb_agg(jsonb_build_object(
        'roundIndex', r.round_index,
        'clue', r.clue,
        'discussionPrompt', r.discussion_prompt
      ) order by r.round_index)
      from public.rounds r
      where r.room_id = v_room.id and r.is_revealed
    ), '[]'::jsonb),
    'eliminations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'playerId', e.player_id,
        'nickname', p.nickname,
        'revealedRole', e.revealed_role,
        'roundIndex', e.round_index
      ) order by e.created_at)
      from public.eliminations e
      join public.players p on p.id = e.player_id
      where e.room_id = v_room.id
    ), '[]'::jsonb),
    'playerCount', v_player_count,
    'votesCast', v_votes_cast,
    'eligibleVoters', v_eligible,
    'voteSubmitted', v_vote_submitted
  );
end;
$$;

revoke all on function public.create_room(text, integer, text, text) from public, anon;
grant execute on function public.create_room(text, integer, text, text) to authenticated;
revoke all on function public.join_room(text, text) from public, anon;
grant execute on function public.join_room(text, text) to authenticated;
revoke all on function public.room_snapshot(text) from public, anon;
grant execute on function public.room_snapshot(text) to authenticated;
