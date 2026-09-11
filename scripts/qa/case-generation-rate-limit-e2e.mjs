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
const outsider = await signedClient();
const code = await rpc(boss, 'create_room_v3', {
  p_boss_name: 'Boss Rate Limit',
  p_boss_gender: 'female',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'rate limit qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});

const first = await rpc(boss, 'claim_case_generation_slot', { p_code: code });
assert.equal(first.allowed, true, 'first AI generation claim must be allowed');
assert.equal(first.reason, 'ok');
assert.equal(first.remaining, 2, 'first claim should leave two attempts in the ten-minute budget');

const immediate = await rpc(boss, 'claim_case_generation_slot', { p_code: code });
assert.equal(immediate.allowed, false, 'immediate repeated generation must be throttled');
assert.equal(immediate.reason, 'cooldown');
assert(immediate.retryAfterSeconds >= 1 && immediate.retryAfterSeconds <= 20, 'cooldown must return a bounded retry delay');
assert.equal(immediate.remaining, 2, 'blocked cooldown calls must not consume the budget');

const { error: outsiderError } = await outsider.rpc('claim_case_generation_slot', { p_code: code });
assert(outsiderError, 'non-host user must not be able to claim an AI generation slot');
assert.match(outsiderError.message, /Boss|الـBoss|يجهز القضية/i);

const presetCode = await rpc(boss, 'create_room_v3', {
  p_boss_name: 'Boss Preset Guard',
  p_boss_gender: 'female',
  p_max_players: 4,
  p_difficulty: 'hard',
  p_theme: 'preset rate limit qa',
  p_case_mode: 'preset',
  p_story_template_id: 'last-tray',
});
const { error: presetError } = await boss.rpc('claim_case_generation_slot', { p_code: presetCode });
assert(presetError, 'preset rooms must not consume AI generation budget');
assert.match(presetError.message, /AI|جاهزة/i);

const migration = fs.readFileSync('supabase/migrations/20260911154500_case_generation_rate_limit.sql', 'utf8');
assert.match(migration, /interval '10 minutes'/, 'budget window must stay explicit and reviewable');
assert.match(migration, /interval '20 seconds'/, 'cooldown must stay explicit and reviewable');
assert.match(migration, /v_max_attempts integer := 3/, 'budget must cap AI generation claims to three per window');
assert.match(migration, /revoke all on table public\.case_generation_rate_limits from public, authenticated/, 'rate-limit state must not be client-readable/writable');

for (const endpointPath of ['app/api/generate-case+api.ts', 'api/case-start.ts']) {
  const source = fs.readFileSync(endpointPath, 'utf8');
  assert.match(source, /claim_case_generation_slot/, `${endpointPath} must enforce the DB-backed generation budget`);
  assert.match(source, /429/, `${endpointPath} must return HTTP 429 when the budget rejects a request`);
}

const report = {
  ok: true,
  kind: 'case-generation-rate-limit-e2e',
  roomCode: code,
  assertions: [
    'first host claim succeeds',
    'immediate repeat is rejected without consuming budget',
    'non-host cannot claim generation budget',
    'preset rooms cannot consume AI budget',
    'budget state is private and DB-backed',
    'both server entrypoints return 429 on rejected generation claims',
  ],
};
fs.writeFileSync(path.join(reportDir, 'case-generation-rate-limit-e2e.json'), JSON.stringify(report, null, 2));
console.log('AI generation rate-limit E2E passed:', JSON.stringify(report));
