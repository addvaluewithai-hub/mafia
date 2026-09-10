-- Reconcile production case-source changes into versioned migrations.
-- Safe to apply more than once.

alter table public.rooms add column if not exists case_mode text not null default 'ai';
alter table public.rooms add column if not exists story_template_id text;

alter table public.rooms drop constraint if exists rooms_case_mode_check;
alter table public.rooms add constraint rooms_case_mode_check check (case_mode in ('ai', 'preset'));

create or replace function public.create_room_v2(
  p_boss_name text,
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
begin
  if auth.uid() is null then raise exception 'لازم تبدأ جلسة الأول'; end if;
  if length(trim(p_boss_name)) < 2 then raise exception 'اسم الـBoss قصير جدًا'; end if;
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

  insert into public.players(room_id, user_id, nickname)
  values (v_room_id, auth.uid(), trim(p_boss_name));

  perform public.emit_room_event(v_room_id, 'room_created');
  return v_code;
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

revoke all on function public.create_room_v2(text, integer, text, text, text, text) from public, anon;
grant execute on function public.create_room_v2(text, integer, text, text, text, text) to authenticated;
revoke all on function public.room_snapshot(text) from public, anon;
grant execute on function public.room_snapshot(text) to authenticated;
