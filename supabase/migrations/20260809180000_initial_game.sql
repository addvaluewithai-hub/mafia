create extension if not exists pgcrypto;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  boss_name text not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  max_players integer not null check (max_players between 4 and 12),
  mafia_count integer not null default 1 check (mafia_count between 1 and 3),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  theme text not null default '',
  title text,
  premise text,
  round_index integer not null default -1,
  last_resolved_round integer not null default -1,
  winner text check (winner is null or winner in ('mafia', 'innocents')),
  public_solution text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  character_name text,
  character_bio text,
  is_eliminated boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create unique index players_room_nickname_unique
  on public.players (room_id, lower(nickname));

create table public.player_roles (
  player_id uuid primary key references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('mafia', 'innocent'))
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_index integer not null,
  clue text not null,
  discussion_prompt text not null,
  is_revealed boolean not null default false,
  unique (room_id, round_index)
);

create table public.case_secrets (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  full_case jsonb not null,
  solution text not null
);

create table public.votes (
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_index integer not null,
  voter_player_id uuid not null references public.players(id) on delete cascade,
  target_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, round_index, voter_player_id)
);

create table public.eliminations (
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_index integer not null,
  player_id uuid not null references public.players(id) on delete cascade,
  revealed_role text not null check (revealed_role in ('mafia', 'innocent')),
  created_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

create table public.room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index room_events_room_id_idx on public.room_events(room_id, id desc);
create index players_room_id_idx on public.players(room_id);
create index rounds_room_id_idx on public.rounds(room_id, round_index);
create index votes_room_round_idx on public.votes(room_id, round_index);

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.player_roles enable row level security;
alter table public.rounds enable row level security;
alter table public.case_secrets enable row level security;
alter table public.votes enable row level security;
alter table public.eliminations enable row level security;
alter table public.room_events enable row level security;

create or replace function public.can_access_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (
        r.host_id = auth.uid()
        or exists (
          select 1 from public.players p
          where p.room_id = r.id and p.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.can_access_room(uuid) from public;
grant execute on function public.can_access_room(uuid) to authenticated;

create policy rooms_read_members
on public.rooms for select to authenticated
using (public.can_access_room(id));

create policy players_read_room
on public.players for select to authenticated
using (public.can_access_room(room_id));

create policy player_roles_read_self
on public.player_roles for select to authenticated
using (user_id = auth.uid());

create policy rounds_read_revealed
on public.rounds for select to authenticated
using (is_revealed and public.can_access_room(room_id));

create policy eliminations_read_room
on public.eliminations for select to authenticated
using (public.can_access_room(room_id));

create policy room_events_read_room
on public.room_events for select to authenticated
using (public.can_access_room(room_id));

grant select on public.rooms, public.players, public.player_roles, public.rounds, public.eliminations, public.room_events to authenticated;

create or replace function public.emit_room_event(p_room_id uuid, p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_events(room_id, event_type) values (p_room_id, p_event_type);
end;
$$;

revoke all on function public.emit_room_event(uuid, text) from public, authenticated;

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
  if v_room.host_id = auth.uid() then raise exception 'الـBoss مش محسوب ضمن المشتبه فيهم'; end if;
  if length(trim(p_nickname)) < 2 then raise exception 'الاسم قصير جدًا'; end if;

  if exists (select 1 from public.players where room_id = v_room.id and user_id = auth.uid()) then
    return v_room.code;
  end if;

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
      'title', v_room.title,
      'premise', v_room.premise,
      'roundIndex', v_room.round_index,
      'lastResolvedRound', v_room.last_resolved_round,
      'winner', v_room.winner,
      'publicSolution', v_room.public_solution
    ),
    'isHost', v_is_host,
    'me', case when v_player.id is null then null else jsonb_build_object(
      'playerId', v_player.id,
      'role', v_role,
      'isEliminated', v_player.is_eliminated
    ) end,
    'players', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'nickname', p.nickname,
          'characterName', p.character_name,
          'characterBio', p.character_bio,
          'isEliminated', p.is_eliminated
        ) order by p.joined_at
      )
      from public.players p where p.room_id = v_room.id
    ), '[]'::jsonb),
    'rounds', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'roundIndex', r.round_index,
          'clue', r.clue,
          'discussionPrompt', r.discussion_prompt
        ) order by r.round_index
      )
      from public.rounds r
      where r.room_id = v_room.id and r.is_revealed
    ), '[]'::jsonb),
    'eliminations', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'playerId', e.player_id,
          'nickname', p.nickname,
          'revealedRole', e.revealed_role,
          'roundIndex', e.round_index
        ) order by e.created_at
      )
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

    update public.players
    set character_name = v_character->>'name',
        character_bio = v_character->>'bio',
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

create or replace function public.cast_vote(p_code text, p_target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_voter public.players%rowtype;
  v_target public.players%rowtype;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code));
  if not found or v_room.status <> 'playing' then raise exception 'التصويت مش مفتوح'; end if;
  if v_room.last_resolved_round >= v_room.round_index then raise exception 'الجولة دي اتحسمت'; end if;

  select * into v_voter from public.players
  where room_id = v_room.id and user_id = auth.uid();
  if not found then raise exception 'أنت مش لاعب في الروم'; end if;
  if v_voter.is_eliminated then raise exception 'المسجون ما يصوتش'; end if;

  select * into v_target from public.players
  where id = p_target_player_id and room_id = v_room.id;
  if not found or v_target.is_eliminated then raise exception 'المتهم غير متاح'; end if;
  if v_target.id = v_voter.id then raise exception 'ما ينفعش تصوت لنفسك'; end if;

  insert into public.votes(room_id, round_index, voter_player_id, target_player_id)
  values (v_room.id, v_room.round_index, v_voter.id, v_target.id)
  on conflict (room_id, round_index, voter_player_id)
  do update set target_player_id = excluded.target_player_id, created_at = now();

  perform public.emit_room_event(v_room.id, 'vote_cast');
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

  if v_vote_count < v_eligible then
    return jsonb_build_object('status', 'pending', 'missing', v_eligible - v_vote_count);
  end if;

  select target_player_id, count(*)::integer
  into v_target, v_max_votes
  from public.votes
  where room_id = v_room.id and round_index = v_room.round_index
  group by target_player_id
  order by count(*) desc
  limit 1;

  select count(*) into v_top_targets
  from (
    select target_player_id
    from public.votes
    where room_id = v_room.id and round_index = v_room.round_index
    group by target_player_id
    having count(*) = v_max_votes
  ) tied;

  if v_top_targets > 1 then
    delete from public.votes where room_id = v_room.id and round_index = v_room.round_index;
    perform public.emit_room_event(v_room.id, 'vote_tie');
    return jsonb_build_object('status', 'tie');
  end if;

  select pr.role, p.nickname into v_role, v_nickname
  from public.player_roles pr
  join public.players p on p.id = pr.player_id
  where pr.player_id = v_target;

  update public.players set is_eliminated = true where id = v_target;
  insert into public.eliminations(room_id, round_index, player_id, revealed_role)
  values (v_room.id, v_room.round_index, v_target, v_role);

  update public.rooms set last_resolved_round = v_room.round_index where id = v_room.id;

  select count(*) into v_alive_mafia
  from public.players p
  join public.player_roles pr on pr.player_id = p.id
  where p.room_id = v_room.id and not p.is_eliminated and pr.role = 'mafia';

  select count(*) into v_innocents_eliminated
  from public.eliminations
  where room_id = v_room.id and revealed_role = 'innocent';

  select max(round_index) into v_last_round from public.rounds where room_id = v_room.id;

  if v_alive_mafia = 0 then
    v_winner := 'innocents';
  elsif v_innocents_eliminated >= 3 then
    v_winner := 'mafia';
  elsif v_room.round_index >= v_last_round then
    v_winner := 'mafia';
  end if;

  if v_winner is not null then
    update public.rooms r
    set status = 'finished',
        winner = v_winner,
        public_solution = s.solution
    from public.case_secrets s
    where r.id = v_room.id and s.room_id = r.id;

    perform public.emit_room_event(v_room.id, 'game_finished');
    return jsonb_build_object(
      'status', 'finished',
      'nickname', v_nickname,
      'role', v_role,
      'winner', v_winner
    );
  end if;

  perform public.emit_room_event(v_room.id, 'player_eliminated');
  return jsonb_build_object('status', 'eliminated', 'nickname', v_nickname, 'role', v_role);
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
  if not exists (select 1 from public.rounds where room_id = v_room.id and round_index = v_next) then
    raise exception 'مفيش أدلة تانية';
  end if;

  update public.rounds set is_revealed = true
  where room_id = v_room.id and round_index = v_next;

  update public.rooms set round_index = v_next where id = v_room.id;
  perform public.emit_room_event(v_room.id, 'clue_revealed');
end;
$$;

revoke all on function public.create_room(text, integer, text, text) from public;
revoke all on function public.join_room(text, text) from public;
revoke all on function public.room_snapshot(text) from public;
revoke all on function public.install_case(text, jsonb) from public;
revoke all on function public.cast_vote(text, uuid) from public;
revoke all on function public.resolve_vote(text) from public;
revoke all on function public.reveal_next_round(text) from public;

grant execute on function public.create_room(text, integer, text, text) to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.room_snapshot(text) to authenticated;
grant execute on function public.install_case(text, jsonb) to authenticated;
grant execute on function public.cast_vote(text, uuid) to authenticated;
grant execute on function public.resolve_vote(text) to authenticated;
grant execute on function public.reveal_next_round(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_events'
  ) then
    alter publication supabase_realtime add table public.room_events;
  end if;
end $$;
