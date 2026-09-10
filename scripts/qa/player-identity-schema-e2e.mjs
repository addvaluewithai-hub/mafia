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

const boss = await signedClient();
const player = await signedClient();
const code = await rpc(boss, 'create_room', {
  p_boss_name: 'Boss Identity QA',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'identity schema qa',
});
await rpc(player, 'join_room', { p_code: code, p_nickname: 'مريم' });

const bossSnapshot = await rpc(boss, 'room_snapshot', { p_code: code });
const playerSnapshot = await rpc(player, 'room_snapshot', { p_code: code });

for (const [label, snapshot] of [['boss', bossSnapshot], ['player', playerSnapshot]]) {
  assert(snapshot.me, `${label} must have a player identity`);
  assert(Object.hasOwn(snapshot.me, 'gender'), `${label} me contract must expose gender`);
  assert(Object.hasOwn(snapshot.me, 'caseRole'), `${label} me contract must expose caseRole`);
  assert.equal(snapshot.me.gender, null, `${label} gender must default to null before UI wiring`);
  assert.equal(snapshot.me.caseRole, null, `${label} caseRole must default to null before case-role wiring`);

  assert(snapshot.players.length >= 2, `${label} must see room players`);
  for (const p of snapshot.players) {
    assert(Object.hasOwn(p, 'gender'), 'public player contract must expose gender');
    assert(Object.hasOwn(p, 'caseRole'), 'public player contract must expose caseRole');
    assert.equal(p.gender, null, 'existing create/join flow must remain backward-compatible with null gender');
    assert.equal(p.caseRole, null, 'existing create/join flow must remain backward-compatible with null caseRole');
  }
}

const { data: directRows, error: directReadError } = await boss
  .from('players')
  .select('nickname, gender, case_role')
  .eq('room_id', bossSnapshot.room.id)
  .order('joined_at');
if (directReadError) throw directReadError;
assert.equal(directRows.length, 2, 'member RLS read should expose both current player rows');
for (const row of directRows) {
  assert.equal(row.gender, null);
  assert.equal(row.case_role, null);
}

const report = {
  ok: true,
  kind: 'player-identity-schema-e2e',
  roomCode: code,
  assertions: [
    'legacy create_room remains compatible without gender input',
    'legacy join_room remains compatible without gender input',
    'room_snapshot.me exposes nullable gender and caseRole',
    'room_snapshot.players exposes nullable gender and caseRole',
    'players table exposes gender and case_role through existing member read policy',
  ],
};

fs.writeFileSync(path.join(reportDir, 'player-identity-schema-e2e.json'), JSON.stringify(report, null, 2));
console.log('Player identity schema E2E passed.');
