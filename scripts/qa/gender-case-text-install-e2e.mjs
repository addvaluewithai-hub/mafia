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
const others = [await signedClient(), await signedClient(), await signedClient()];
const code = await rpc(boss, 'create_room_v3', {
  p_boss_name: 'مريم',
  p_boss_gender: 'female',
  p_max_players: 4,
  p_difficulty: 'medium',
  p_theme: 'gender wording qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});

const joiners = [
  { client: others[0], nickname: 'علي', gender: 'male' },
  { client: others[1], nickname: 'سارة', gender: 'female' },
  { client: others[2], nickname: 'سيف', gender: 'male' },
];
for (const player of joiners) {
  await rpc(player.client, 'join_room_v2', {
    p_code: code,
    p_nickname: player.nickname,
    p_gender: player.gender,
  });
}

const characters = [0, 1, 2, 3].map((index) => ({
  role: `دور محايد ${index + 1}`,
  bio: `وصف محايد ${index + 1}`,
  roleByGender: {
    male: `المشرف ${index + 1}`,
    female: `المشرفة ${index + 1}`,
  },
  bioByGender: {
    male: `هو مسؤول عن جزء الاختبار رقم ${index + 1}.`,
    female: `هي مسؤولة عن جزء الاختبار رقم ${index + 1}.`,
  },
}));

await rpc(boss, 'install_case', {
  p_code: code,
  p_case: {
    title: 'قضية صياغة الجنس QA',
    premise: 'اختبار يثبت إن صياغة الدور والوصف تتبع جنس اللاعب بعد الإسناد العشوائي من غير تغيير توزيع المافيا.',
    crime: 'اختفاء ملف مهم',
    characters,
    mafiaCharacterIndexes: [2],
    rounds: [0, 1, 2, 3].map((roundIndex) => ({
      clue: `دليل اختبار رقم ${roundIndex + 1} فيه تفاصيل كفاية لتشغيل مسار القضية بالكامل.`,
      discussionPrompt: `ناقشوا الدليل رقم ${roundIndex + 1}.`,
    })),
    solution: 'حل اختبار طويل بما يكفي لتشغيل العقد، والهدف هنا فقط التأكد من اختيار صياغة الدور والوصف حسب جنس اللاعب بعد الإسناد.',
  },
});

const snapshot = await rpc(boss, 'room_snapshot', { p_code: code });
assert.equal(snapshot.players.length, 4);

for (const player of snapshot.players) {
  assert(player.gender === 'male' || player.gender === 'female', `${player.nickname} must have gender`);
  assert.equal(typeof player.caseRole, 'string', `${player.nickname} must have caseRole`);
  assert.equal(typeof player.characterBio, 'string', `${player.nickname} must have characterBio`);
  if (player.gender === 'male') {
    assert.match(player.caseRole, /^المشرف /, `${player.nickname} must receive male role wording`);
    assert.match(player.characterBio, /^هو مسؤول /, `${player.nickname} must receive male bio wording`);
    assert.doesNotMatch(player.caseRole, /^المشرفة /);
    assert.doesNotMatch(player.characterBio, /^هي مسؤولة /);
  } else {
    assert.match(player.caseRole, /^المشرفة /, `${player.nickname} must receive female role wording`);
    assert.match(player.characterBio, /^هي مسؤولة /, `${player.nickname} must receive female bio wording`);
    assert.doesNotMatch(player.caseRole, /^المشرف /);
    assert.doesNotMatch(player.characterBio, /^هو مسؤول /);
  }
}

const clients = [boss, ...others];
let mafiaCount = 0;
for (const c of clients) {
  const ownSnapshot = await rpc(c, 'room_snapshot', { p_code: code });
  if (ownSnapshot.me?.role === 'mafia') mafiaCount += 1;
}
assert.equal(mafiaCount, 1, 'gender wording selection must not change the expected mafia count');

const report = {
  ok: true,
  kind: 'gender-case-text-install-e2e',
  roomCode: code,
  assertions: [
    'male players receive male role/bio wording',
    'female players receive female role/bio wording',
    'wording is selected after random character assignment',
    'mafia count remains unchanged',
  ],
};
fs.writeFileSync(path.join(reportDir, 'gender-case-text-install-e2e.json'), JSON.stringify(report, null, 2));
console.log('Gender case text install E2E passed.');
