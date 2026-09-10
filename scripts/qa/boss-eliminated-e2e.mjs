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

function fakeCase() {
  return {
    title: 'QA Boss elimination',
    premise: 'قضية اختبار آلي للتأكد إن الـBoss يفضل مدير للجولة حتى بعد خروجه من التصويت.',
    crime: 'اختفاء غرض في اختبار آلي.',
    characters: Array.from({ length: 6 }, (_, i) => ({
      name: `Role ${i + 1}`,
      bio: `وصف اختبار للشخصية رقم ${i + 1}.`,
    })),
    mafiaCharacterIndexes: [0, 1],
    rounds: Array.from({ length: 4 }, (_, i) => ({
      clue: `الدليل ${i + 1}: معلومة اختبارية واضحة.`,
      discussionPrompt: `إيه اللي اتغير بعد الدليل ${i + 1}؟`,
    })),
    solution: 'حل اختبار آلي.',
  };
}

const players = await Promise.all(Array.from({ length: 6 }, () => signedClient()));
const boss = players[0];
const code = await rpc(boss, 'create_room', {
  p_boss_name: 'Boss QA',
  p_max_players: 6,
  p_difficulty: 'hard',
  p_theme: 'QA',
});

for (let i = 1; i < players.length; i += 1) {
  await rpc(players[i], 'join_room', { p_code: code, p_nickname: `لاعب ${i + 1}` });
}

await rpc(boss, 'install_case', { p_code: code, p_case: fakeCase() });
let snaps = await snapshots(players, code);
const bossId = snaps[0].me?.playerId;
assert(bossId, 'Boss must have a player identity');
assert.equal(snaps[0].isHost, true, 'Boss must be host before elimination');
assert.equal(snaps[0].canVote, true, 'Boss must be able to vote before elimination');

const alternateTarget = snaps.find((s) => s.me && s.me.playerId !== bossId)?.me?.playerId;
assert(alternateTarget, 'alternate target required for Boss self-vote prevention');

for (let i = 0; i < players.length; i += 1) {
  const voterId = snaps[i].me?.playerId;
  assert(voterId, 'every client must map to a player');
  await rpc(players[i], 'cast_vote', {
    p_code: code,
    p_target_player_id: voterId === bossId ? alternateTarget : bossId,
  });
}

const firstResolve = await rpc(boss, 'resolve_vote', { p_code: code });
assert.equal(firstResolve.status, 'eliminated', 'eliminating Boss in round 1 must not finish a six-player game');

snaps = await snapshots(players, code);
assert.equal(snaps[0].me.isEliminated, true, 'Boss must be eliminated as a player');
assert.equal(snaps[0].isHost, true, 'Boss must keep host authority after elimination');
assert.equal(snaps[0].canVote, false, 'eliminated Boss must lose voting permission');
assert.equal(snaps[0].phase, 'round_resolved', 'Boss elimination must leave the round resolved and administrable');

const livingTarget = snaps.find((s) => s.me && !s.me.isEliminated)?.me?.playerId;
assert(livingTarget, 'a living target must remain');
const { error: bossVoteError } = await boss.rpc('cast_vote', {
  p_code: code,
  p_target_player_id: livingTarget,
});
assert(bossVoteError, 'eliminated Boss must be rejected by cast_vote');

await rpc(boss, 'reveal_next_round', { p_code: code });
snaps = await snapshots(players, code);
assert.equal(snaps[0].phase, 'voting', 'eliminated Boss must be able to reveal the next round');
assert.equal(snaps[0].canVote, false, 'revealing next round must not restore Boss voting permission');

const aliveSnaps = snaps.filter((s) => s.me && !s.me.isEliminated);
const secondTargetId = aliveSnaps[0].me.playerId;
const secondAlternate = aliveSnaps.find((s) => s.me.playerId !== secondTargetId)?.me.playerId;
assert(secondAlternate, 'second alternate target required');

for (let i = 1; i < players.length; i += 1) {
  const snap = snaps[i];
  if (!snap.me || snap.me.isEliminated) continue;
  await rpc(players[i], 'cast_vote', {
    p_code: code,
    p_target_player_id: snap.me.playerId === secondTargetId ? secondAlternate : secondTargetId,
  });
}

const secondResolve = await rpc(boss, 'resolve_vote', { p_code: code });
assert(['eliminated', 'finished'].includes(secondResolve.status), 'eliminated Boss must still be able to resolve a later vote');

const report = {
  ok: true,
  kind: 'boss-eliminated-admin-e2e',
  playerCount: 6,
  assertions: {
    bossEliminated: true,
    hostAuthorityRetained: true,
    castVoteRejectedAfterElimination: true,
    revealAllowedAfterElimination: true,
    resolveAllowedAfterElimination: true,
  },
  secondResolveStatus: secondResolve.status,
};

fs.writeFileSync(path.join(reportDir, 'boss-eliminated-e2e.json'), JSON.stringify(report, null, 2));
console.log('Boss eliminated admin E2E passed:', JSON.stringify(report));
