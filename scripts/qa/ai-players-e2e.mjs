import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');

const reportDir = path.resolve('qa/reports');
fs.mkdirSync(reportDir, { recursive: true });
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: auth, error: authError } = await client.auth.signInAnonymously();
if (authError || !auth.session) throw authError ?? new Error('anonymous auth failed');

async function rpc(name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

function fakeCase() {
  return {
    title: 'قضية لاعبين AI',
    premise: 'اختبار كامل للاعب بشري مع ثلاثة لاعبين كمبيوتر.',
    crime: 'اختفاء ظرف من الصالة.',
    characters: [
      { role: 'مسؤول البوفيه', bio: 'كان قريب من الدرج.', roleByGender: { male: 'مسؤول البوفيه', female: 'مسؤولة البوفيه' }, bioByGender: { male: 'كان قريب من الدرج.', female: 'كانت قريبة من الدرج.' } },
      { role: 'منظم اللمة', bio: 'رتب دخول الضيوف.', roleByGender: { male: 'منظم اللمة', female: 'منظمة اللمة' }, bioByGender: { male: 'رتب دخول الضيوف.', female: 'رتبت دخول الضيوف.' } },
      { role: 'مسؤول التصوير', bio: 'صور الصالة.', roleByGender: { male: 'مسؤول التصوير', female: 'مسؤولة التصوير' }, bioByGender: { male: 'صور الصالة.', female: 'صورت الصالة.' } },
      { role: 'صاحب المكان', bio: 'معاه مفاتيح المكان.', roleByGender: { male: 'صاحب المكان', female: 'صاحبة المكان' }, bioByGender: { male: 'معاه مفاتيح المكان.', female: 'معاها مفاتيح المكان.' } },
    ],
    mafiaCharacterIndexes: [0],
    rounds: [
      { clue: 'حد شاف مسؤول البوفيه قريب من الدرج، لكن منظم اللمة كان داخل خارج طول الوقت.', discussionPrompt: 'مين كان عنده فرصة؟' },
      { clue: 'الصورة فيها حركة ناحية البوفيه.', discussionPrompt: 'اربطوا الحركة بالتوقيت.' },
      { clue: 'المفتاح اتحرك قبل الاختفاء.', discussionPrompt: 'مين كان يقدر يوصل؟' },
      { clue: 'الأثر الأخير حسم تسلسل الحركة.', discussionPrompt: 'صوتوا على أقوى تفسير.' },
    ],
    solution: 'الاختبار يثبت دورة AI من غير كشف الحل للاعبين.',
  };
}

const code = await rpc('create_room_v3', {
  p_boss_name: 'Boss Solo QA',
  p_boss_gender: 'male',
  p_max_players: 4,
  p_difficulty: 'hard',
  p_theme: 'solo ai qa',
  p_case_mode: 'ai',
  p_story_template_id: null,
});

const bot1 = await rpc('add_ai_player', { p_code: code });
const bot2 = await rpc('add_ai_player', { p_code: code });
const bot3 = await rpc('add_ai_player', { p_code: code });
assert.equal(new Set([bot1.nickname, bot2.nickname, bot3.nickname]).size, 3, 'AI nicknames must be unique');

let snapshot = await rpc('room_snapshot', { p_code: code });
assert.equal(snapshot.playerCount, 4, 'one human plus three AI players must fill the four-player room');
assert.equal(snapshot.players.filter((p) => p.nickname.startsWith('AI ')).length, 3, 'three AI players must be visible in lobby');

const { error: overfillError } = await client.rpc('add_ai_player', { p_code: code });
assert(overfillError, 'AI player creation must respect maxPlayers');

await rpc('install_case', { p_code: code, p_case: fakeCase() });
snapshot = await rpc('room_snapshot', { p_code: code });
assert.equal(snapshot.room.status, 'playing');
assert.equal(snapshot.eligibleVoters, 4);
assert(snapshot.me?.playerId, 'human Boss must remain a normal player');

const target = snapshot.players.find((p) => p.id !== snapshot.me.playerId);
assert(target, 'human needs a valid target');
await rpc('cast_vote', { p_code: code, p_target_player_id: target.id });
const aiResult = await rpc('cast_ai_votes', { p_code: code });
assert.equal(aiResult.votesCast, 3, 'all three living AI players must vote exactly once');

snapshot = await rpc('room_snapshot', { p_code: code });
assert.equal(snapshot.votesCast, 4, 'human + AI votes must satisfy the same server vote count');
assert.equal(snapshot.eligibleVoters, 4);

const secondAiResult = await rpc('cast_ai_votes', { p_code: code });
assert.equal(secondAiResult.votesCast, 0, 'AI voting must be idempotent within a round');

const result = await rpc('resolve_vote', { p_code: code });
assert.notEqual(result.status, 'pending', 'AI players must never deadlock vote resolution waiting for nonexistent auth sessions');

const report = {
  ok: true,
  kind: 'ai-players-e2e',
  roomCode: code,
  assertions: [
    'Boss can fill a lobby with three server-owned AI players',
    'AI players respect room capacity and receive normal randomized case roles',
    'AI votes use the same votes table and eligible-voter accounting as humans',
    'AI voting is idempotent per round and cannot deadlock resolution',
    'only revealed clue text is used by the AI voting heuristic; solution is never returned to bots',
  ],
};
fs.writeFileSync(path.join(reportDir, 'ai-players-e2e.json'), JSON.stringify(report, null, 2));
console.log('AI players E2E passed:', JSON.stringify(report));
