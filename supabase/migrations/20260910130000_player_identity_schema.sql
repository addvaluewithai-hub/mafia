-- Introduce player identity fields before wiring any UI.
-- Both fields are nullable so existing room creation/join flows remain backward-compatible.
-- gender is only for natural-language agreement; it must never influence secret role assignment.
-- case_role is the in-story job/relationship label attached to the real player nickname.

alter table public.players
  add column if not exists gender text,
  add column if not exists case_role text;

alter table public.players
  drop constraint if exists players_gender_check;

alter table public.players
  add constraint players_gender_check
  check (gender is null or gender in ('male', 'female'));

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
  v_phase text;
  v_can_vote boolean := false;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;

  select * into v_room from public.rooms where code = upper(trim(p_code));
  if not found then raise exception 'الروم مش موجود'; end if;

  v_is_host := v_room.host_id = auth.uid();
  select * into v_player
  from public.players
  where room_id = v_room.id and user_id = auth.uid();

  if not v_is_host and v_player.id is null and v_room.status <> 'lobby' then
    raise exception 'القضية بدأت بالفعل';
  end if;

  if v_player.id is not null then
    select role into v_role from public.player_roles where player_id = v_player.id;
  end if;

  select count(*) into v_player_count from public.players where room_id = v_room.id;
  select count(*) into v_eligible from public.players where room_id = v_room.id and not is_eliminated;

  if v_room.round_index >= 0 then
    select count(*) into v_votes_cast
    from public.votes
    where room_id = v_room.id and round_index = v_room.round_index;

    if v_player.id is not null then
      select exists (
        select 1 from public.votes
        where room_id = v_room.id
          and round_index = v_room.round_index
          and voter_player_id = v_player.id
      ) into v_vote_submitted;
    end if;
  end if;

  v_phase := case
    when v_room.status = 'lobby' then 'lobby'
    when v_room.status = 'finished' then 'finished'
    when v_room.status = 'playing' and coalesce(v_room.last_resolved_round, -1) < v_room.round_index then 'voting'
    else 'round_resolved'
  end;

  v_can_vote := v_phase = 'voting'
    and v_player.id is not null
    and not coalesce(v_player.is_eliminated, false)
    and not v_vote_submitted;

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
      'caseMode', coalesce(v_room.case_mode, 'ai'),
      'storyTemplateId', v_room.story_template_id,
      'title', v_room.title,
      'premise', v_room.premise,
      'roundIndex', v_room.round_index,
      'lastResolvedRound', v_room.last_resolved_round,
      'winner', v_room.winner,
      'publicSolution', v_room.public_solution,
      'timerDurationSeconds', v_room.timer_duration_seconds,
      'timerEndsAt', v_room.timer_ends_at
    ),
    'phase', v_phase,
    'canVote', v_can_vote,
    'isHost', v_is_host,
    'me', case when v_player.id is null then null else jsonb_build_object(
      'playerId', v_player.id,
      'role', v_role,
      'isEliminated', v_player.is_eliminated,
      'gender', v_player.gender,
      'caseRole', v_player.case_role
    ) end,
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nickname', p.nickname,
        'gender', p.gender,
        'caseRole', p.case_role,
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

revoke all on function public.room_snapshot(text) from public, anon;
grant execute on function public.room_snapshot(text) to authenticated;
