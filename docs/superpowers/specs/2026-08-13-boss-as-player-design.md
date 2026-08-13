# Host as Player — Design Spec

## Goal
Make the host a full player while keeping host-only game controls. The selected player count includes the host. Example: 6 players means host + 5 additional players.

## Rules
- Creating a room automatically adds the host to `players` using the host name.
- The host counts toward room capacity, role counts, generated characters, voting, elimination, and win conditions.
- The host receives a normal character and hidden team role exactly like every other player.
- The host does not receive privileged access to hidden solution data, future clues, or other players' roles.
- The host can vote and can be voted for.
- If eliminated, the host can no longer vote but keeps orchestration controls needed to continue the match.
- Host-only controls remain separate from player status: timer, resolve vote, and reveal next clue.
- The lobby marks the host with a small `BOSS` badge only.

## Backend Changes
- `create_room`: create the room and the host player row in one transaction.
- `join_room`: capacity includes the host; duplicate membership remains rejected.
- Case generation uses the total `playerCount`, which now includes the host.
- Role assignment already iterates over `players`, so the host will receive a role automatically.
- Voting already depends on a non-eliminated player row, so an eliminated host cannot vote.
- Host-only RPC authorization continues to use `rooms.host_id = auth.uid()` even if the host player is eliminated.

## UI Changes
- Create screen explains that player count includes the host.
- Lobby starts at `1 / maxPlayers` and shows the host immediately.
- Host player card gets a `BOSS` badge.
- Remove any copy saying the host is not counted as a player.
- During play, the host gets the same role reveal, character info, voting UI, jail state, and ending as everyone else.
- Host controls stay visible after host elimination.

## Existing Rooms
Only new rooms use this behavior. Existing rooms are not backfilled automatically.

## Acceptance Criteria
1. New 6-player room opens at 1/6 with host listed.
2. Exactly 5 additional players can join.
3. The case generates exactly 6 characters.
4. Host receives a hidden role and character.
5. Host can vote and receive votes.
6. Eliminated host cannot vote.
7. Eliminated host can still control timer, resolve votes, and reveal clues.
8. Host cannot see hidden solution or other players' roles early.
9. Role counts use total players including host.
10. Refresh preserves host player identity and controls.
