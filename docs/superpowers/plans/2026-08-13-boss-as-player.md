# Boss as Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Boss a full player whose selected player count includes the Boss, while preserving host-only orchestration controls and keeping hidden game information private.

**Architecture:** Keep `rooms.host_id` as the authorization source for Boss controls, but create a normal `players` row for the Boss in the same transaction as room creation. All role assignment, voting, elimination, and win-condition logic continues to operate on `players`, so the Boss naturally participates without receiving any privileged hidden data. The UI marks the host player by comparing player membership with the current host identity exposed safely by the snapshot.

**Tech Stack:** Expo Router 57, React Native / NativeWind, Supabase Postgres RPCs + Realtime, TypeScript, Vercel.

## Global Constraints

- Selected player count includes the Boss; 6 means Boss + 5 additional players.
- Creating a room automatically adds the Boss to `players` using the Boss name.
- The Boss receives a normal character and hidden team role exactly like every other player.
- The Boss must not see the solution, future clues, or other players' roles early.
- The Boss can vote and can be voted for.
- If eliminated, the Boss cannot vote but retains timer, resolve-vote, and reveal-clue controls.
- Existing rooms are not backfilled; the behavior applies to new rooms only.
- Role counts use total players including the Boss.

---

### Task 1: Make room creation insert the Boss as player

**Files:**
- Create: `supabase/migrations/20260813152500_boss_as_player.sql`

**Interfaces:**
- Consumes: existing `public.create_room(text, integer, text, text)`, `public.join_room(text, text)`, `public.room_snapshot(text)` RPCs and `public.players` unique `(room_id, user_id)` constraint.
- Produces: new-room invariant: every newly created room has exactly one `players` row whose `user_id = rooms.host_id` and `nickname = rooms.boss_name`.

- [ ] **Step 1: Add a transaction-safe backend verification block that demonstrates the old behavior is wrong**

Use a rollback-only SQL verification after the migration body while developing locally/against a branch DB: create a temporary authenticated identity in `auth.users`, set `request.jwt.claim.sub`, call `create_room`, and assert the room has one host player. The assertion must be equivalent to:

```sql
select case
  when (
    select count(*)
    from public.players p
    join public.rooms r on r.id = p.room_id
    where r.code = v_code
      and p.user_id = r.host_id
      and p.nickname = r.boss_name
  ) = 1 then true
  else pg_catalog.raise_exception('Boss player row missing')
end;
```

Before the migration, this expectation fails because `create_room` only creates `rooms`.

- [ ] **Step 2: Replace `public.create_room` so it inserts the Boss player in the same transaction**

The function body must keep all current validation/code generation, then immediately after `rooms` insert add:

```sql
insert into public.players(room_id, user_id, nickname)
values (v_room_id, auth.uid(), trim(p_boss_name));
```

Then emit `room_created` and return the code exactly as before. Do not create a role yet; `install_case` owns role assignment.

- [ ] **Step 3: Replace `public.join_room` to treat an existing host membership as idempotent instead of rejecting the Boss**

Remove this old guard:

```sql
if v_room.host_id = auth.uid() then
  raise exception 'الـBoss مش محسوب ضمن المشتبه فيهم';
end if;
```

Keep the existing early-return membership check:

```sql
if exists (
  select 1 from public.players
  where room_id = v_room.id and user_id = auth.uid()
) then
  return v_room.code;
end if;
```

Capacity continues to use `count(*) from public.players`; because the Boss is now already present, a six-player room accepts exactly five more users.

- [ ] **Step 4: Keep RPC permissions unchanged and apply the migration**

The migration must end with explicit permission hardening for changed RPCs:

```sql
revoke all on function public.create_room(text, integer, text, text) from public, anon;
grant execute on function public.create_room(text, integer, text, text) to authenticated;
revoke all on function public.join_room(text, text) from public, anon;
grant execute on function public.join_room(text, text) to authenticated;
```

Run the migration through Supabase `apply_migration` on project `mafia`.

- [ ] **Step 5: Verify database invariants**

For a new six-player room created by an authenticated anonymous session, verify:

```sql
select r.code, r.max_players, count(p.id) as player_count,
       bool_or(p.user_id = r.host_id) as host_is_player
from public.rooms r
join public.players p on p.room_id = r.id
where r.code = '<NEW_TEST_CODE>'
group by r.id;
```

Expected after creation: `max_players = 6`, `player_count = 1`, `host_is_player = true`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260813152500_boss_as_player.sql
git commit -m "feat: make boss a room player"
```

---

### Task 2: Expose host membership safely and update lobby/player UI

**Files:**
- Modify: `supabase/migrations/20260813152500_boss_as_player.sql`
- Modify: `lib/types.ts`
- Modify: `app/create.tsx`
- Modify: `app/index.tsx`
- Modify: `app/room/[code].tsx`

**Interfaces:**
- Consumes: `RoomSnapshot.players`, `RoomSnapshot.me`, `RoomSnapshot.isHost`, `rooms.host_id`.
- Produces: `RoomSnapshot.room.hostPlayerId: string | null`; UI can label the Boss player without exposing hidden role data.

- [ ] **Step 1: Extend `room_snapshot` with `hostPlayerId`**

Inside the room object returned by `public.room_snapshot`, add only the Boss player id:

```sql
'hostPlayerId', (
  select p.id
  from public.players p
  where p.room_id = v_room.id
    and p.user_id = v_room.host_id
  limit 1
),
```

Do not expose host role, secret case data, unrevealed rounds, or any other private fields.

- [ ] **Step 2: Add the TypeScript field**

In `lib/types.ts`, extend `RoomSnapshot.room`:

```ts
hostPlayerId: string | null;
```

- [ ] **Step 3: Fix creation/home copy so count semantics are explicit**

In `app/create.tsx`, change the player-count caption from generic `من 4 لـ 12 لاعب` to:

```text
من 4 لـ 12 — وإنت واحد منهم
```

Add one short helper line near the count selector:

```text
مثال: 6 لاعبين = إنت + 5 أصحابك
```

In `app/index.tsx`, replace the old footer copy saying the Boss is not counted with:

```text
الـBoss لاعب كامل، وفي نفس الوقت بيدير إيقاع الجولة
```

- [ ] **Step 4: Mark the Boss player card**

Extend `PlayerCard` in `app/room/[code].tsx` with an optional `isBoss?: boolean`. In the header badge area, show a neutral/gold `BOSS` pill when `isBoss` is true, while preserving `في السجن` / `اختيارك` state. Pass:

```tsx
isBoss={player.id === room.hostPlayerId}
```

for every lobby/suspect card render.

- [ ] **Step 5: Verify UI state expectations**

For a new six-player room, the first lobby render must show:
- `1/6`
- the Boss nickname in the player list
- a `BOSS` badge on that player
- the start button disabled until total `playerCount >= 4`

- [ ] **Step 6: Run typecheck and commit**

Run:

```bash
npm run typecheck
```

Expected: exit code 0.

Commit:

```bash
git add lib/types.ts app/create.tsx app/index.tsx app/room/[code].tsx supabase/migrations/20260813152500_boss_as_player.sql
git commit -m "feat: show boss as participating player"
```

---

### Task 3: Verify role assignment, voting, elimination, and host controls

**Files:**
- Verify: `app/api/generate-case+api.ts`
- Verify: `lib/game.ts`
- Verify: `app/room/[code].tsx`
- Verify: Supabase RPCs `install_case`, `cast_vote`, `resolve_vote`, `restart_discussion_timer`, `reveal_next_round`

**Interfaces:**
- Consumes: the Boss player row created in Task 1.
- Produces: end-to-end invariant that host privileges and player privileges coexist independently.

- [ ] **Step 1: Verify case generation count needs no special-case code**

Confirm `generate-case` uses `snapshot.playerCount`. With the Boss in `players`, a six-player room must produce:

```ts
playerCount === 6
characters.length === 6
mafiaCount === suggestedMafiaCount(6) // 2
```

No Boss-specific prompt or role logic should be added.

- [ ] **Step 2: Verify role assignment includes Boss**

Confirm `install_case` still loops over all rows:

```sql
for v_player in
  select * from public.players
  where room_id = v_room.id
  order by random()
loop
  ...
  insert into public.player_roles(player_id, room_id, user_id, role)
  values (v_player.id, v_room.id, v_player.user_id, v_role);
end loop;
```

After starting a test case, assert `player_roles` count equals `players` count and the host player has exactly one role.

- [ ] **Step 3: Verify Boss can vote while alive**

No code change is expected in `cast_vote`: it finds the caller via `players.user_id = auth.uid()` and rejects only eliminated players. Test from the host session that a vote inserts one row with the Boss player as `voter_player_id`.

- [ ] **Step 4: Verify Boss can be targeted and eliminated**

From another alive player, cast a vote targeting `room.hostPlayerId`. Resolve a majority vote. Expected: Boss player `is_eliminated = true`, elimination exposes only `mafia` or `innocent` like any other player.

- [ ] **Step 5: Verify eliminated Boss loses player actions but keeps host controls**

After Boss elimination:
- `cast_vote` from Boss must fail with `المسجون ما يصوتش`.
- `restart_discussion_timer` from Boss must still succeed because it authorizes with `rooms.host_id`.
- `resolve_vote` from Boss must still authorize with `rooms.host_id`.
- `reveal_next_round` from Boss must still authorize with `rooms.host_id` after the prior vote is resolved.

- [ ] **Step 6: Verify secrecy**

Inspect `room_snapshot` for Boss before finish. Expected:
- `me.role` contains only the Boss's own role.
- other players do not have `role` fields.
- only revealed rounds appear in `rounds`.
- `publicSolution` is null until finish.

- [ ] **Step 7: Commit only if verification required code changes**

If no changes are needed, do not create a noise commit. If a real bug is found, commit the minimal fix with a focused message such as:

```bash
git commit -m "fix: preserve host controls after elimination"
```

---

### Task 4: Deploy and perform a production smoke test

**Files:**
- Production artifact: Vercel project `akher-kheit`

**Interfaces:**
- Consumes: main branch plus migrated Supabase project `mafia`.
- Produces: live behavior at `https://akher-kheit.vercel.app`.

- [ ] **Step 1: Build a preview deployment**

Deploy the current project to Vercel preview and wait for `READY`. Build must include `/room/[code]` and `/api/generate-case`.

- [ ] **Step 2: Check preview runtime health**

Open `/`, `/create`, and a new room route. Expected HTTP status: 200. Check Vercel runtime errors; expected: none caused by this feature.

- [ ] **Step 3: Promote/deploy the same source to production**

Deploy to Vercel production and wait for `READY`. Confirm alias includes:

```text
akher-kheit.vercel.app
```

- [ ] **Step 4: Production acceptance smoke test**

Create a fresh six-player room. Verify in order:
1. lobby starts `1/6` with Boss listed;
2. exactly five more users can join;
3. generate case succeeds with six characters and two Mafia roles;
4. Boss sees only their own role;
5. Boss can vote and be voted for;
6. after Boss elimination, voting UI is gone/disabled for Boss while host controls remain;
7. refresh restores the same Boss player identity and controls.

- [ ] **Step 5: Check logs after smoke test**

Vercel runtime: no new 5xx/uncaught runtime errors. Supabase API/Auth: room snapshot, votes, and auth refresh requests return expected successful statuses except deliberate negative tests.
