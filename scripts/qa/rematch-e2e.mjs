import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');

const reportDir = path.resolve('qa/reports');
fs.mkdirSync(reportDir, { recursive: true });

function client() {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedClient() {
  const c = client();
  const { data, error } = await c.auth.signInAnonymously();
  if (error || !data.session) throw error ?? new Error('anonymous auth failed');
  return c;
}

async function rpc(c, name, args) {
  const { data, error } = await c.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function snapshots(clients, code) {
  return Promise.all(clients.map((c) => rpc(c, 'room_snapshot', { p_code: code })));
}

function fakeCase(label) {
  return {
    title: `قضية ${label}`,
    premise: `قضية اختبار ${label} للتأكد إن إعادة اللعب بتنضف الحالة القديمة من غير ما تطرد اللاعبين.`,
    crime: `اختفاء غرض في اختبار ${label}.`,
    characters: Array.from({ length: 4 }, (_, index) => ({
      role: `دور ${label} ${index + 1}`,
      bio: `وصف ${label} للاعب رقم ${index + 1}.`,
      roleByGender: {
        male: `دور ${label} ${index + 1}`,
        female: `دور ${label} ${index + 1}`,
      },
      bioByGender: {
        male: `وصف ${label} للاعب رقم ${index + 1}.`,
        female: `وصف ${label} للاعبة رقم ${index + 1}.`,
      },
    })),
    mafiaCharacterIndexes: [0],
    rounds: Array.from({ length: 4 }, (_, index) => ({
      clue: `دليل ${label} رقم ${index + 1} فيه تفاصيل كفاية لمسار الاختبار.`,
      discussionPrompt: `ناقشوا دليل ${label} رقم ${index + 1}.`,
    })),
    solution: `حل ${label} النهائي لاختبار إعادة اللعب.`,
  };
}

const players = await Promise.all(Array.from({ length: 4 }, () => signedClient()));
const boss = players[0];
const code = await rpc(boss, 'create_room_v3', {
  p_boss_name: 'Boss Rematch',
  p_boss_gender: 'male',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'rematch qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});

for (let index = 1; index < players.length; index += 1) {
  await rpc(players[index], 'join_room_v2', {
    p_code: code,
    p_nickname: `لاعب ${index + 1}`,
    p_gender: index % 2 === 0 ? 'female' : 'male',
  });
}

await rpc(boss, 'install_case', { p_code: code, p_case: fakeCase('الأولى') });
let snaps = await snapshots(players, code);
const originalPlayers = snaps[0].players.map((player) => ({ id: player.id, nickname: player.nickname }));
assert.equal(snaps[0].room.status, 'playing');
assert.equal(snaps[0].room.title, 'قضية الأولى');

const mafiaIndex = snaps.findIndex((snap) => snap.me?.role === 'mafia');
assert.notEqual(mafiaIndex, -1, 'one client must receive the mafia role');
const mafiaId = snaps[mafiaIndex].me.playerId;
const innocentTarget = snaps.find((snap) => snap.me?.role === 'innocent')?.me?.playerId;
assert(innocentTarget, 'an innocent target is required for mafia self-vote avoidance');

for (let index = 0; index < players.length; index += 1) {
  await rpc(players[index], 'cast_vote', {
    p_code: code,
    p_target_player_id: index === mafiaIndex ? innocentTarget : mafiaId,
  });
}

const finish = await rpc(boss, 'resolve_vote', { p_code: code });
assert.equal(finish.status, 'finished', 'eliminating the only mafia must finish a four-player game');
assert.equal(finish.winner, 'innocents');

const { error: nonHostResetError } = await players[1].rpc('reset_room_for_rematch', { p_code: code });
assert(nonHostResetError, 'a non-host must not be allowed to reset a finished room');

await rpc(boss, 'reset_room_for_rematch', { p_code: code });
snaps = await snapshots(players, code);

for (const snap of snaps) {
  assert.equal(snap.room.status, 'lobby', 'rematch must return every client to lobby');
  assert.equal(snap.room.title, null, 'old title must not leak into rematch lobby');
  assert.equal(snap.room.premise, null, 'old premise must not leak into rematch lobby');
  assert.equal(snap.room.roundIndex, -1, 'rematch lobby must have no active round');
  assert.equal(snap.room.lastResolvedRound, -1, 'rematch lobby must have no resolved round');
  assert.equal(snap.room.winner, null, 'old winner must be cleared');
  assert.equal(snap.room.publicSolution, null, 'old solution must be cleared');
  assert.equal(snap.room.timerEndsAt, null, 'old timer must be cleared');
  assert.equal(snap.rounds.length, 0, 'old clues must be cleared');
  assert.equal(snap.eliminations.length, 0, 'old eliminations must be cleared');
  assert.equal(snap.votesCast, 0, 'old votes must be cleared');
  assert.equal(snap.canVote, false, 'nobody can vote in rematch lobby');
  assert.equal(snap.me?.role ?? null, null, 'old secret role must be cleared before the next case');
}

assert.deepEqual(
  snaps[0].players.map((player) => ({ id: player.id, nickname: player.nickname })),
  originalPlayers,
  'same player identities must remain in the same room',
);
for (const player of snaps[0].players) {
  assert.equal(player.isEliminated, false, `${player.nickname} must be active again`);
  assert.equal(player.characterName, null, `${player.nickname} old characterName must be cleared`);
  assert.equal(player.characterBio, null, `${player.nickname} old characterBio must be cleared`);
  assert.equal(player.caseRole, null, `${player.nickname} old caseRole must be cleared`);
}

await rpc(boss, 'install_case', { p_code: code, p_case: fakeCase('الثانية') });
snaps = await snapshots(players, code);
assert.equal(snaps[0].room.status, 'playing', 'Boss must be able to start a second case in the same room');
assert.equal(snaps[0].room.title, 'قضية الثانية', 'second case must replace old case data');
assert.equal(snaps[0].rounds.length, 1, 'second case must begin with only its first revealed clue');
assert.equal(snaps[0].eliminations.length, 0, 'second case must start with no eliminations');
for (const snap of snaps) {
  assert(['mafia', 'innocent'].includes(snap.me?.role), 'every preserved player must receive a fresh secret role');
}
for (const player of snaps[0].players) {
  assert(player.characterBio?.includes('الثانية'), `${player.nickname} must receive second-case story data`);
  assert(player.caseRole?.includes('الثانية'), `${player.nickname} must receive second-case role data`);
}

const report = {
  ok: true,
  kind: 'same-room-rematch-e2e',
  roomCode: code,
  assertions: [
    'only Boss can reset a finished room',
    'player ids and nicknames persist across rematch',
    'roles, clues, votes, eliminations, winner, solution, timer, and character data are cleared',
    'all players return active to lobby without rejoining',
    'Boss can install and start a fresh second case in the same room',
  ],
};
fs.writeFileSync(path.join(reportDir, 'rematch-e2e.json'), JSON.stringify(report, null, 2));
console.log('Same-room rematch E2E passed:', JSON.stringify(report));
