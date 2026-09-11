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

async function createRoom(c, index, namePrefix = 'Boss Guard') {
  return rpc(c, 'create_room_v3', {
    p_boss_name: `${namePrefix} ${index}`,
    p_boss_gender: index % 2 ? 'male' : 'female',
    p_max_players: 12,
    p_difficulty: 'medium',
    p_theme: 'room abuse qa',
    p_case_mode: 'preset',
    p_story_template_id: 'archive-seal',
  });
}

// Creation budget: five successful rooms per identity per ten-minute window.
const creator = await signedClient();
const createdCodes = [];
for (let i = 1; i <= 5; i += 1) createdCodes.push(await createRoom(creator, i, 'Burst Boss'));
assert.equal(createdCodes.length, 5);

const { error: sixthCreateError } = await creator.rpc('create_room_v3', {
  p_boss_name: 'Burst Boss 6',
  p_boss_gender: 'female',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'room abuse qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});
assert(sixthCreateError, 'sixth room creation must be throttled');
assert.match(sixthCreateError.message, /رومز كتير|استنى شوية/i);

// Legacy create RPCs share the same limiter and cannot bypass it.
const { error: legacyCreateError } = await creator.rpc('create_room_v2', {
  p_boss_name: 'Legacy Bypass',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'legacy bypass qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});
assert(legacyCreateError, 'legacy create_room_v2 must share the creation budget');
assert.match(legacyCreateError.message, /رومز كتير|استنى شوية/i);

// Join budget: eight successful joins per identity per ten-minute window.
const joiner = await signedClient();
const joinTargets = [];
for (let i = 1; i <= 9; i += 1) {
  const host = await signedClient();
  joinTargets.push(await createRoom(host, i, 'Join Host'));
}

for (let i = 0; i < 8; i += 1) {
  const joined = await rpc(joiner, 'join_room_v2', {
    p_code: joinTargets[i],
    p_nickname: `Joiner ${i + 1}`,
    p_gender: i % 2 ? 'female' : 'male',
  });
  assert.equal(joined, joinTargets[i]);
}

// The ninth attempt uses the legacy RPC deliberately: it must not bypass the shared join budget.
const { error: ninthJoinError } = await joiner.rpc('join_room', {
  p_code: joinTargets[8],
  p_nickname: 'Legacy Join Bypass',
});
assert(ninthJoinError, 'ninth successful-join attempt must be throttled across RPC versions');
assert.match(ninthJoinError.message, /رومز كتير|استنى شوية/i);

// Limiter internals are server-only.
const { error: tableReadError } = await creator.from('room_action_rate_limits').select('*').limit(1);
assert(tableReadError, 'authenticated clients must not read limiter state directly');
const { error: directClaimError } = await creator.rpc('claim_room_action_slot', { p_action: 'create_room' });
assert(directClaimError, 'authenticated clients must not call the internal limiter directly');

const migration = fs.readFileSync('supabase/migrations/20260911164000_room_join_rate_limit.sql', 'utf8');
assert.match(migration, /interval '10 minutes'/, 'rate-limit window must stay explicit and reviewable');
assert.match(migration, /v_max_attempts := 5/, 'room creation budget must stay explicit');
assert.match(migration, /v_max_attempts := 8/, 'join budget must stay explicit');
assert.match(migration, /revoke all on table public\.room_action_rate_limits from public, anon, authenticated/, 'limiter state must remain private');
for (const rpcName of ['create_room_v3', 'create_room_v2', 'create_room', 'join_room_v2', 'join_room']) {
  assert.match(migration, new RegExp(`function public\\.${rpcName}\\(`), `${rpcName} must be covered by the shared limiter migration`);
}

const report = {
  ok: true,
  kind: 'room-join-rate-limit-e2e',
  assertions: [
    'five room creations succeed and the sixth is throttled',
    'legacy create RPC cannot bypass the shared creation budget',
    'eight successful joins succeed and the ninth is throttled',
    'legacy join RPC cannot bypass the shared join budget',
    'limiter state and internal claim function are private',
  ],
};
fs.writeFileSync(path.join(reportDir, 'room-join-rate-limit-e2e.json'), JSON.stringify(report, null, 2));
console.log('Room/join rate-limit E2E passed:', JSON.stringify(report));
