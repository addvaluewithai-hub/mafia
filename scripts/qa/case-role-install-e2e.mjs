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
const players = [await signedClient(), await signedClient(), await signedClient()];
const code = await rpc(boss, 'create_room_v3', {
  p_boss_name: 'نور',
  p_boss_gender: 'female',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'case role qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});

const nicknames = ['علي', 'مريم', 'سيف'];
for (let i = 0; i < players.length; i += 1) {
  await rpc(players[i], 'join_room_v2', {
    p_code: code,
    p_nickname: nicknames[i],
    p_gender: i === 1 ? 'female' : 'male',
  });
}

const roles = ['صاحبة المكان', 'المحاسب', 'مسؤول المخزن', 'منظم الحفلة'];
const characters = roles.map((role, index) => ({
  role,
  bio: `وصف علني للدور رقم ${index + 1} من غير اسم شخصية خيالي.`,
}));

await rpc(boss, 'install_case', {
  p_code: code,
  p_case: {
    title: 'قضية أدوار QA',
    premise: 'قضية اختبار للتأكد إن الدور الوصفي يرتبط باسم اللاعب الحقيقي من غير اسم شخصية بديل.',
    crime: 'اختفاء مفتاح الخزنة',
    characters,
    mafiaCharacterIndexes: [1],
    rounds: [0, 1, 2, 3].map((roundIndex) => ({
      clue: `دليل اختبار رقم ${roundIndex + 1} فيه تفاصيل كفاية لتشغيل مسار القضية.`,
      discussionPrompt: `ناقشوا الدليل رقم ${roundIndex + 1}.`,
    })),
    solution: 'حل اختبار طويل بما يكفي لتشغيل العقد؛ الهدف هنا هو هوية اللاعب والدور الوصفي فقط.',
  },
});

const snapshot = await rpc(boss, 'room_snapshot', { p_code: code });
assert.equal(snapshot.players.length, 4, 'room must keep all four real player identities');
assert.deepEqual(
  new Set(snapshot.players.map((player) => player.nickname)),
  new Set(['نور', ...nicknames]),
  'install_case must not replace player nicknames',
);
assert.deepEqual(
  new Set(snapshot.players.map((player) => player.caseRole)),
  new Set(roles),
  'every supplied descriptive role must be populated exactly once',
);
for (const player of snapshot.players) {
  assert.equal(player.characterName, null, `${player.nickname} must not need a fictional characterName`);
  assert.equal(typeof player.caseRole, 'string', `${player.nickname} must expose a descriptive caseRole`);
  assert(player.caseRole.length > 0, `${player.nickname} caseRole must not be empty`);
}

const { data: rows, error: rowsError } = await boss
  .from('players')
  .select('nickname, case_role, character_name')
  .eq('room_id', snapshot.room.id);
if (rowsError) throw rowsError;
for (const row of rows) {
  assert(row.case_role, `${row.nickname} must persist case_role in players table`);
  assert.equal(row.character_name, null, `${row.nickname} must persist without fictional character_name`);
}

const report = {
  ok: true,
  kind: 'case-role-install-e2e',
  roomCode: code,
  assertions: [
    'install_case preserves real nicknames',
    'install_case populates one descriptive caseRole per player when role is supplied',
    'caseRole persists in players.case_role and room_snapshot',
    'case install works without fictional characterName',
  ],
};
fs.writeFileSync(path.join(reportDir, 'case-role-install-e2e.json'), JSON.stringify(report, null, 2));
console.log('Case role install E2E passed.');
