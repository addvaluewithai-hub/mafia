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

function fakeCase(playerCount) {
  return {
    title: 'Gender Contract QA',
    premise: 'قضية اختبار آلي للتأكد إن الجنس بيأثر على الصياغة فقط ومش على الأدوار السرية.',
    crime: 'اختفاء غرض في اختبار آلي.',
    characters: Array.from({ length: playerCount }, (_, i) => ({
      name: `Role ${i + 1}`,
      bio: `دور اختبار رقم ${i + 1}.`,
    })),
    mafiaCharacterIndexes: [0],
    rounds: Array.from({ length: 4 }, (_, i) => ({
      clue: `الدليل ${i + 1}.`,
      discussionPrompt: `ناقشوا الدليل ${i + 1}.`,
    })),
    solution: 'حل اختبار آلي.',
  };
}

async function makeRoom(genders, label) {
  const clients = await Promise.all(genders.map(() => signedClient()));
  const code = await rpc(clients[0], 'create_room_v3', {
    p_boss_name: `${label} Boss`,
    p_boss_gender: genders[0],
    p_max_players: genders.length,
    p_difficulty: 'medium',
    p_theme: 'gender rpc qa',
    p_case_mode: 'ai',
    p_story_template_id: null,
  });

  for (let i = 1; i < clients.length; i += 1) {
    await rpc(clients[i], 'join_room_v2', {
      p_code: code,
      p_nickname: `${label} Player ${i + 1}`,
      p_gender: genders[i],
    });
  }

  const before = await rpc(clients[0], 'room_snapshot', { p_code: code });
  assert.equal(before.players.length, genders.length);
  assert.deepEqual(before.players.map((p) => p.gender), genders, `${label}: snapshot must preserve submitted genders in join order`);
  assert.equal(before.me.gender, genders[0], `${label}: Boss gender must persist in me contract`);

  await rpc(clients[0], 'install_case', { p_code: code, p_case: fakeCase(genders.length) });
  const after = await Promise.all(clients.map((c) => rpc(c, 'room_snapshot', { p_code: code })));
  const roles = after.map((s) => s.me.role);
  assert.equal(roles.filter((role) => role === 'mafia').length, 1, `${label}: four-player game must have exactly one mafia regardless of gender distribution`);
  assert.equal(roles.filter((role) => role === 'innocent').length, genders.length - 1, `${label}: remaining players must be innocent`);

  for (let i = 0; i < after.length; i += 1) {
    assert.equal(after[i].me.gender, genders[i], `${label}: gender must remain stable after role assignment`);
  }

  return { code, genders, mafiaCount: roles.filter((role) => role === 'mafia').length };
}

const invalidBoss = await signedClient();
const { error: invalidBossError } = await invalidBoss.rpc('create_room_v3', {
  p_boss_name: 'Invalid Boss',
  p_boss_gender: 'other',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});
assert(invalidBossError, 'create_room_v3 must reject unsupported gender values');

const allMale = await makeRoom(['male', 'male', 'male', 'male'], 'Male');
const allFemale = await makeRoom(['female', 'female', 'female', 'female'], 'Female');
const mixed = await makeRoom(['female', 'male', 'female', 'male'], 'Mixed');

assert.equal(allMale.mafiaCount, allFemale.mafiaCount, 'secret-role count must not vary with all-male vs all-female rooms');
assert.equal(allMale.mafiaCount, mixed.mafiaCount, 'secret-role count must not vary with mixed-gender rooms');

const report = {
  ok: true,
  kind: 'player-gender-rpc-e2e',
  scenarios: [allMale, allFemale, mixed],
  assertions: [
    'create_room_v3 stores Boss gender',
    'join_room_v2 stores player gender',
    'room_snapshot returns gender for me and public players',
    'unsupported gender values are rejected',
    'gender remains unchanged after role assignment',
    'four-player secret-role count stays one mafia for all-male, all-female, and mixed rooms',
  ],
};

fs.writeFileSync(path.join(reportDir, 'player-gender-rpc-e2e.json'), JSON.stringify(report, null, 2));
console.log('Player gender RPC E2E passed.');
