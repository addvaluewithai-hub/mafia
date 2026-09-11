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

const installationKey = `qa-${crypto.randomUUID()}-${crypto.randomUUID()}`;
const firstIdentity = await signedClient();
const secondIdentity = await signedClient();

for (let i = 0; i < 8; i += 1) {
  const c = i % 2 === 0 ? firstIdentity : secondIdentity;
  const { data, error } = await c.rpc('claim_public_abuse_slot', {
    p_abuse_key: installationKey,
    p_action: 'create_room',
  });
  assert.ifError(error);
  assert.equal(data.allowed, true, `claim ${i + 1} should be allowed`);
}
const { data: blocked, error: blockedError } = await secondIdentity.rpc('claim_public_abuse_slot', {
  p_abuse_key: installationKey,
  p_action: 'create_room',
});
assert.ifError(blockedError);
assert.equal(blocked.allowed, false, 'new anonymous auth identity must not reset the installation budget');
assert(Number(blocked.retryAfterSeconds) > 0, 'blocked response must include a retry window');

const { data: independent, error: independentError } = await firstIdentity.rpc('claim_public_abuse_slot', {
  p_abuse_key: `qa-${crypto.randomUUID()}-${crypto.randomUUID()}`,
  p_action: 'create_room',
});
assert.ifError(independentError);
assert.equal(independent.allowed, true);

const { error: tableReadError } = await firstIdentity.from('public_abuse_rate_limits').select('*').limit(1);
assert(tableReadError, 'authenticated clients must not read hashed limiter state');

const migration = fs.readFileSync('supabase/migrations/20260911204500_public_abuse_perimeter.sql', 'utf8');
const game = fs.readFileSync('lib/game.ts', 'utf8');
const telemetry = fs.readFileSync('app/api/telemetry+api.ts', 'utf8');
const generation = fs.readFileSync('app/api/generate-case+api.ts', 'utf8');

assert.match(migration, /digest\(v_key, 'sha256'\)/, 'DB must store a one-way key digest');
const tableDefinition = migration.match(/create table public\.public_abuse_rate_limits \(([\s\S]*?)\);/)?.[1] ?? '';
assert(tableDefinition, 'limiter table definition must remain inspectable');

const limiterColumns = [...tableDefinition.matchAll(/^\s*([a-z_][a-z0-9_]*)\s+(?:text|integer|timestamptz|uuid|boolean|jsonb)\b/gim)]
  .map((match) => match[1].toLowerCase());
assert.deepEqual(
  limiterColumns,
  ['key_hash', 'action', 'window_started_at', 'attempts', 'updated_at'],
  'limiter table must keep the minimal digest/action/window schema',
);
for (const forbidden of ['nickname', 'gender', 'room', 'player', 'story', 'mafia', 'user_id']) {
  assert(!limiterColumns.some((column) => column.includes(forbidden)), `limiter table must not store ${forbidden}`);
}
assert.match(tableDefinition, /key_hash text not null/, 'limiter table must store only the hashed installation boundary');
assert.match(game, /create_room_v4/, 'create path must use churn-protected wrapper');
assert.match(game, /join_room_v3/, 'join path must use churn-protected wrapper');
assert.match(game, /abuseKey: getAbuseInstallationKey\(\)/, 'generation path must send the installation boundary');
assert.match(generation, /claim_case_generation_slot_v2/, 'AI generation must enforce both installation and auth budgets');
assert.match(telemetry, /claim_public_abuse_slot/, 'telemetry must enforce the installation budget server-side');
assert.doesNotMatch(telemetry, /console\.(?:info|log)[^\n]*abuseKey/i, 'telemetry must never log the raw abuse key');

const report = {
  ok: true,
  kind: 'public-abuse-perimeter-e2e',
  assertions: [
    'one installation budget survives anonymous auth identity churn',
    'different installation keys remain independent',
    'database stores only SHA-256 key digests and keeps limiter state private',
    'create, join, generation, and telemetry paths are wired to the second boundary',
    'gameplay identity/story fields are not stored as abuse identity',
  ],
};
fs.writeFileSync(path.join(reportDir, 'public-abuse-perimeter-e2e.json'), JSON.stringify(report, null, 2));
console.log('Public abuse perimeter E2E passed:', JSON.stringify(report));
