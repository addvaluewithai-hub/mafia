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

async function reconnectedSnapshot(c, code) {
  const { data: sessionData, error: sessionError } = await c.auth.getSession();
  if (sessionError || !sessionData.session) throw sessionError ?? new Error('session missing before reconnect');

  const fresh = client();
  const { data: restored, error: restoreError } = await fresh.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });
  if (restoreError || !restored.session) throw restoreError ?? new Error('session restore failed during reconnect');

  const snap = await rpc(fresh, 'room_snapshot', { p_code: code });
  assert.equal(restored.session.user.id, sessionData.session.user.id, 'reconnect must preserve player identity');
  return snap;
}

function mafiaCountFor(n) {
  if (n >= 10) return 3;
  if (n >= 6) return 2;
  return 1;
}

function fakeCase(playerCount) {
  const mafiaCount = mafiaCountFor(playerCount);
  return {
    title: `QA ${playerCount}`,
    premise: 'دي قضية اختبار آلي معمولة علشان نجرب دورة اللعب كاملة من غير ما نعتمد على قصة حقيقية.',
    crime: 'اختفاء غرض في اختبار آلي.',
    characters: Array.from({ length: playerCount }, (_, i) => ({
      name: `Role ${i + 1}`,
      bio: `وصف واضح للشخصية رقم ${i + 1} في اختبار الجودة، وفيه سبب بسيط يخليها ضمن المشتبه فيهم.`,
    })),
    mafiaCharacterIndexes: Array.from({ length: mafiaCount }, (_, i) => i),
    rounds: Array.from({ length: 4 }, (_, i) => ({
      clue: `الدليل ${i + 1}: معلومة اختبارية واضحة تفتح باب للنقاش من غير ما تحتاج أي مصطلحات معقدة.`,
      discussionPrompt: `إيه اللي اتغير بعد الدليل ${i + 1}؟`,
    })),
    solution: 'الحل ده خاص باختبار الجودة، والغرض منه التأكد إن النهاية بتظهر بعد اكتمال مسار التصويت والجولات.',
  };
}

async function rpc(c, name, args) {
  const { data, error } = await c.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function snapshots(clients, code) {
  return Promise.all(clients.map((c) => rpc(c, 'room_snapshot', { p_code: code })));
}

function assertVotingContract(snaps) {
  for (const snap of snaps) {
    if (!snap.me) continue;
    if (snap.me.isEliminated) {
      assert.equal(snap.canVote, false, 'eliminated player canVote must be false');
      continue;
    }
    assert.equal(snap.phase, 'voting', 'unresolved playing round must report voting phase');
    assert.equal(snap.canVote, !snap.voteSubmitted, 'canVote must be the server-authoritative inverse of voteSubmitted for living players');
  }
}

async function voteAllFor(clients, snaps, code, targetId) {
  const alive = snaps.filter((s) => s.me && !s.me.isEliminated);
  const alternate = snaps.find((s) => s.me && !s.me.isEliminated && s.me.playerId !== targetId)?.me?.playerId;
  assert(alternate, 'alternate target required');
  for (let i = 0; i < clients.length; i += 1) {
    const snap = snaps[i];
    if (!snap.me || snap.me.isEliminated) continue;
    const target = snap.me.playerId === targetId ? alternate : targetId;
    await rpc(clients[i], 'cast_vote', { p_code: code, p_target_player_id: target });
    const afterVote = await rpc(clients[i], 'room_snapshot', { p_code: code });
    assert.equal(afterVote.phase, 'voting', 'submitting a vote must not resolve the round');
    assert.equal(afterVote.voteSubmitted, true, 'submitted vote must be visible in snapshot');
    assert.equal(afterVote.canVote, false, 'server must close canVote for a player after submission');
  }
  assert.equal(alive.length, snaps[0].eligibleVoters, 'eligible voter count must match living clients');
}

async function forceTieSix(clients, snaps, code) {
  const living = snaps.filter((s) => s.me && !s.me.isEliminated);
  assert.equal(living.length, 6, 'tie scenario expects six living players');
  const a = living[0].me.playerId;
  const b = living[1].me.playerId;
  const probePlayerId = living[2].me.playerId;
  const probeIndex = snaps.findIndex((s) => s.me?.playerId === probePlayerId);
  assert(probeIndex >= 0, 'reconnect probe player must exist');

  const beforeCastReconnect = await reconnectedSnapshot(clients[probeIndex], code);
  assert.equal(beforeCastReconnect.phase, 'voting', 'fresh client before cast must see voting phase');
  assert.equal(beforeCastReconnect.voteSubmitted, false, 'fresh client before cast must see no submitted vote');
  assert.equal(beforeCastReconnect.canVote, true, 'fresh client before cast must retain vote permission');

  const voterIdsForA = new Set(
    living
      .filter((s) => s.me.playerId !== a)
      .slice(0, 3)
      .map((s) => s.me.playerId),
  );
  for (let i = 0; i < clients.length; i += 1) {
    const snap = snaps[i];
    if (!snap.me || snap.me.isEliminated) continue;
    await rpc(clients[i], 'cast_vote', {
      p_code: code,
      p_target_player_id: voterIdsForA.has(snap.me.playerId) ? a : b,
    });

    if (i === probeIndex) {
      const afterCastReconnect = await reconnectedSnapshot(clients[i], code);
      assert.equal(afterCastReconnect.phase, 'voting', 'fresh client after cast must remain in voting phase');
      assert.equal(afterCastReconnect.voteSubmitted, true, 'fresh client after cast must see submitted vote');
      assert.equal(afterCastReconnect.canVote, false, 'fresh client after cast must not regain vote permission');
    }
  }

  return probeIndex;
}

async function runGame(playerCount) {
  const players = await Promise.all(Array.from({ length: playerCount }, () => signedClient()));
  const boss = players[0];
  const code = await rpc(boss, 'create_room', {
    p_boss_name: 'Boss QA',
    p_max_players: playerCount,
    p_difficulty: 'hard',
    p_theme: 'QA',
  });
  for (let i = 1; i < players.length; i += 1) {
    await rpc(players[i], 'join_room', { p_code: code, p_nickname: `لاعب ${i + 1}` });
  }

  let snaps = await snapshots(players, code);
  assert.equal(snaps[0].playerCount, playerCount);
  assert.equal(snaps[0].isHost, true);
  assert(snaps[0].me?.playerId, 'Boss must also have a player row');
  for (const snap of snaps) {
    assert.equal(snap.phase, 'lobby');
    assert.equal(snap.canVote, false);
  }

  await rpc(boss, 'install_case', { p_code: code, p_case: fakeCase(playerCount) });
  snaps = await snapshots(players, code);
  for (const snap of snaps) {
    assert.equal(snap.room.status, 'playing');
    assert(snap.me?.role === 'mafia' || snap.me?.role === 'innocent');
    assert.equal(snap.room.roundIndex, 0);
  }
  assertVotingContract(snaps);

  let reconnectProbeIndex = null;
  if (playerCount === 6) {
    reconnectProbeIndex = await forceTieSix(players, snaps, code);
    const tie = await rpc(boss, 'resolve_vote', { p_code: code });
    assert.equal(tie.status, 'tie');
    snaps = await snapshots(players, code);
    assert.equal(snaps[0].votesCast, 0, 'tie must clear votes');
    assert.equal(snaps[0].room.lastResolvedRound, -1, 'tie must leave round unresolved');
    assertVotingContract(snaps);
    for (const snap of snaps) if (!snap.me.isEliminated) assert.equal(snap.voteSubmitted, false);

    const afterTieReconnect = await reconnectedSnapshot(players[reconnectProbeIndex], code);
    assert.equal(afterTieReconnect.phase, 'voting', 'fresh client after tie must stay in voting phase');
    assert.equal(afterTieReconnect.voteSubmitted, false, 'fresh client after tie must see cleared vote');
    assert.equal(afterTieReconnect.canVote, true, 'fresh client after tie must regain vote permission exactly once');
  }

  let eliminatedBossWhileStillHost = false;
  let guard = 0;
  while (snaps[0].room.status === 'playing' && guard < 6) {
    guard += 1;
    assertVotingContract(snaps);
    const mafia = snaps.find((s) => s.me?.role === 'mafia' && !s.me?.isEliminated);
    assert(mafia, 'at least one living mafia should exist while playing');
    const targetId = mafia.me.playerId;
    await voteAllFor(players, snaps, code, targetId);
    const result = await rpc(boss, 'resolve_vote', { p_code: code });
    assert(['eliminated', 'finished'].includes(result.status));
    snaps = await snapshots(players, code);

    const targetIndex = snaps.findIndex((s) => s.me?.playerId === targetId);
    assert(targetIndex >= 0);
    assert.equal(snaps[targetIndex].me.isEliminated, true);
    assert.equal(snaps[targetIndex].canVote, false, 'eliminated target must never regain canVote');

    if (targetIndex === 0) {
      eliminatedBossWhileStillHost = true;
      assert.equal(snaps[0].isHost, true, 'eliminated Boss must keep host controls');
    }

    if (snaps[0].room.status === 'playing') {
      for (const snap of snaps) assert.equal(snap.phase, 'round_resolved', 'resolved round must be explicit before next clue');

      const livingProbeIndex = reconnectProbeIndex !== null && !snaps[reconnectProbeIndex].me.isEliminated
        ? reconnectProbeIndex
        : snaps.findIndex((s) => s.me && !s.me.isEliminated);
      assert(livingProbeIndex >= 0, 'living reconnect probe required after resolve');
      const afterResolveReconnect = await reconnectedSnapshot(players[livingProbeIndex], code);
      assert.equal(afterResolveReconnect.phase, 'round_resolved', 'fresh client after resolve must see round_resolved');
      assert.equal(afterResolveReconnect.canVote, false, 'fresh client must not vote after round resolution');

      const { error: eliminatedVoteError } = await players[targetIndex].rpc('cast_vote', {
        p_code: code,
        p_target_player_id: snaps.find((s) => !s.me.isEliminated && s.me.playerId !== targetId).me.playerId,
      });
      assert(eliminatedVoteError, 'eliminated player must not be allowed to vote');

      await rpc(boss, 'reveal_next_round', { p_code: code });
      snaps = await snapshots(players, code);
      assert.equal(snaps[0].room.lastResolvedRound, snaps[0].room.roundIndex - 1);
      assertVotingContract(snaps);
      for (const snap of snaps) {
        if (!snap.me.isEliminated) assert.equal(snap.voteSubmitted, false, 'new round must reopen vote');
      }

      const afterRevealReconnect = await reconnectedSnapshot(players[livingProbeIndex], code);
      assert.equal(afterRevealReconnect.phase, 'voting', 'fresh client after next clue must see voting phase');
      assert.equal(afterRevealReconnect.voteSubmitted, false, 'fresh client in new round must not inherit old vote');
      assert.equal(afterRevealReconnect.canVote, true, 'fresh client in new round must regain vote permission');
    }
  }

  assert.equal(snaps[0].room.status, 'finished');
  assert(['mafia', 'innocents'].includes(snaps[0].room.winner));
  assert(snaps[0].room.publicSolution, 'finished game must expose solution');
  for (const snap of snaps) {
    assert.equal(snap.phase, 'finished');
    assert.equal(snap.canVote, false);
  }

  return {
    playerCount,
    winner: snaps[0].room.winner,
    rounds: snaps[0].room.roundIndex + 1,
    bossWasEliminated: eliminatedBossWhileStillHost,
  };
}

const results = [];
for (const playerCount of [4, 5, 6, 7]) results.push(await runGame(playerCount));

const report = {
  ok: true,
  kind: 'local-supabase-rpc-e2e',
  scenarios: results,
  coverage: [
    'anonymous auth', 'Boss auto-player', 'join room', 'install case', 'private roles',
    'four-player full-game path', 'server-authoritative phase', 'server-authoritative canVote', 'canVote closes after submit',
    'reconnect preserves player identity', 'reconnect before cast', 'reconnect after cast',
    'cast vote', 'six-player tie', 'tie reset', 'reconnect after tie', 'resolve vote',
    'round_resolved phase', 'reconnect after resolve', 'elimination', 'eliminated voter rejection',
    'Boss control after elimination', 'reveal next clue', 'reconnect after next clue', 'winner and solution',
  ],
};
fs.writeFileSync(path.join(reportDir, 'supabase-e2e.json'), JSON.stringify(report, null, 2));
console.log('Supabase E2E passed:', JSON.stringify(results));
