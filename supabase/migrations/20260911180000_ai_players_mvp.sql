-- Solo/playtest MVP: host-managed computer players participate in the same
-- player/role/vote lifecycle as humans without inventing auth identities.
-- Their decisions are server-side and may only use revealed clues plus their own
-- secret-team knowledge. No solution/private case payload is exposed to clients.

alter table public.players
  alter column user_id drop not null,
  add column if not exists is_bot boolean not null default false;

alter table public.player_roles
  alter column user_id drop not null;

alter table public.players
  drop constraint if exists players_bot_identity_check;

alter table public.players
  add constraint players_bot_identity_check
  check ((is_bot and user_id is null) or (not is_bot and user_id is not null));

create or replace function public.add_ai_player(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_player_count integer;
  v_name text;
  v_gender text;
  v_player_id uuid;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;

  select * into v_room
  from public.rooms
  where code = upper(trim(p_code))
  for update;

  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يضيف لاعب AI'; end if;
  if v_room.status <> 'lobby' then raise exception 'لاعبين AI بيتضافوا في اللوبي بس'; end if;

  select count(*) into v_player_count
  from public.players where room_id = v_room.id;
  if v_player_count >= v_room.max_players then raise exception 'الروم كامل'; end if;

  select candidate.nickname, candidate.gender
  into v_name, v_gender
  from (values
    ('AI كريم', 'male'),
    ('AI مروان', 'male'),
    ('AI يوسف', 'male'),
    ('AI سيف', 'male'),
    ('AI نور', 'female'),
    ('AI سلمى', 'female'),
    ('AI ليلى', 'female'),
    ('AI هنا', 'female'),
    ('AI عمر', 'male'),
    ('AI ملك', 'female'),
    ('AI زياد', 'male')
  ) as candidate(nickname, gender)
  where not exists (
    select 1 from public.players p
    where p.room_id = v_room.id and lower(p.nickname) = lower(candidate.nickname)
  )
  order by random()
  limit 1;

  if v_name is null then raise exception 'مفيش أسماء AI متاحة للروم ده'; end if;

  insert into public.players(room_id, user_id, nickname, gender, is_bot)
  values (v_room.id, null, v_name, v_gender, true)
  returning id into v_player_id;

  perform public.emit_room_event(v_room.id, 'ai_player_added');
  return jsonb_build_object('playerId', v_player_id, 'nickname', v_name, 'gender', v_gender);
end;
$$;

create or replace function public.remove_ai_player(p_code text, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;

  select * into v_room
  from public.rooms
  where code = upper(trim(p_code))
  for update;

  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يشيل لاعب AI'; end if;
  if v_room.status <> 'lobby' then raise exception 'لاعبين AI بيتشالوا من اللوبي بس'; end if;

  delete from public.players
  where id = p_player_id and room_id = v_room.id and is_bot;

  if not found then raise exception 'لاعب AI مش موجود'; end if;
  perform public.emit_room_event(v_room.id, 'ai_player_removed');
end;
$$;

create or replace function public.cast_ai_votes(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_bot record;
  v_target uuid;
  v_target_name text;
  v_cast integer := 0;
  v_revealed_text text;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;

  select * into v_room
  from public.rooms
  where code = upper(trim(p_code))
  for update;

  if not found then raise exception 'الروم مش موجود'; end if;
  if v_room.host_id <> auth.uid() then raise exception 'الـBoss فقط يقدر يشغّل لاعبين AI'; end if;
  if v_room.status <> 'playing' or v_room.last_resolved_round >= v_room.round_index then
    raise exception 'التصويت مش مفتوح';
  end if;

  select coalesce(string_agg(r.clue, ' ' order by r.round_index), '')
  into v_revealed_text
  from public.rounds r
  where r.room_id = v_room.id and r.is_revealed;

  for v_bot in
    select p.id, pr.role
    from public.players p
    join public.player_roles pr on pr.player_id = p.id
    where p.room_id = v_room.id
      and p.is_bot
      and not p.is_eliminated
      and not exists (
        select 1 from public.votes v
        where v.room_id = v_room.id
          and v.round_index = v_room.round_index
          and v.voter_player_id = p.id
      )
    order by p.joined_at, p.id
  loop
    -- Innocent bots lean toward suspects whose public case role appears in revealed
    -- clues. Mafia bots avoid known teammates when an innocent target exists.
    select candidate.id, candidate.nickname
    into v_target, v_target_name
    from public.players candidate
    join public.player_roles candidate_role on candidate_role.player_id = candidate.id
    where candidate.room_id = v_room.id
      and not candidate.is_eliminated
      and candidate.id <> v_bot.id
      and (
        v_bot.role <> 'mafia'
        or candidate_role.role <> 'mafia'
        or not exists (
          select 1
          from public.players innocent
          join public.player_roles innocent_role on innocent_role.player_id = innocent.id
          where innocent.room_id = v_room.id
            and not innocent.is_eliminated
            and innocent.id <> v_bot.id
            and innocent_role.role = 'innocent'
        )
      )
    order by
      case
        when nullif(trim(candidate.case_role), '') is not null
          and strpos(lower(v_revealed_text), lower(candidate.case_role)) > 0
        then 1 else 0
      end desc,
      random()
    limit 1;

    if v_target is not null then
      insert into public.votes(room_id, round_index, voter_player_id, target_player_id)
      values (v_room.id, v_room.round_index, v_bot.id, v_target)
      on conflict (room_id, round_index, voter_player_id)
      do update set target_player_id = excluded.target_player_id, created_at = now();
      v_cast := v_cast + 1;
    end if;
  end loop;

  if v_cast > 0 then perform public.emit_room_event(v_room.id, 'ai_votes_cast'); end if;
  return jsonb_build_object('votesCast', v_cast);
end;
$$;

revoke all on function public.add_ai_player(text) from public, anon;
revoke all on function public.remove_ai_player(text, uuid) from public, anon;
revoke all on function public.cast_ai_votes(text) from public, anon;
grant execute on function public.add_ai_player(text) to authenticated;
grant execute on function public.remove_ai_player(text, uuid) to authenticated;
grant execute on function public.cast_ai_votes(text) to authenticated;
