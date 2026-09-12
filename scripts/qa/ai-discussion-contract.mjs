import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildAiDiscussionCues } from '../../lib/ai-discussion.ts';

const round = {
  roundIndex: 1,
  clue: 'الكاميرا بينت حركة عند المخزن قبل اختفاء الصندوق.',
  discussionPrompt: 'مين كان عنده سبب يدخل المخزن في الوقت ده؟',
};

const players = [
  { id: 'human-1', nickname: 'مريم', caseRole: 'المحاسبة', isBot: false, isEliminated: false },
  { id: 'bot-1', nickname: 'AI كريم', caseRole: 'مسؤول المخزن', isBot: true, isEliminated: false },
  { id: 'bot-2', nickname: 'AI نور', caseRole: 'الأمن', isBot: true, isEliminated: true },
  { id: 'bot-3', nickname: 'AI سارة', caseRole: 'الموردة', isBot: true, isEliminated: false },
];

const first = buildAiDiscussionCues({ players, round });
const refreshed = buildAiDiscussionCues({ players: structuredClone(players), round: structuredClone(round) });
assert.deepEqual(refreshed, first, 'refresh/reconnect must reproduce the same cues from the same public inputs');
assert.deepEqual(first.map((cue) => cue.playerId), ['bot-1', 'bot-3'], 'only alive bots may speak');
assert(first.every((cue) => cue.text.length > 0 && cue.text.length < 220), 'bot cues should stay short and readable');
assert(first.every((cue) => !/مافيا|mafia|innocent|solution|حل القضية/i.test(cue.text)), 'visible cues must not claim private role/solution knowledge');

const changedRound = buildAiDiscussionCues({ players, round: { ...round, roundIndex: 2, clue: `${round.clue} واتكشف أثر جديد.` } });
assert.equal(changedRound.length, first.length, 'new rounds should keep one cue per alive bot');

const helperSource = await readFile(new URL('../../lib/ai-discussion.ts', import.meta.url), 'utf8');
assert(/\bcaseRole\s*:/.test(helperSource), 'public cue helper may explicitly accept the public caseRole field');
const forbiddenFields = ['role', 'winner', 'publicSolution', 'solution', 'mafiaCharacter', 'secret', 'team'];
for (const forbidden of forbiddenFields) {
  const declaration = new RegExp(`\\b${forbidden}\\s*:`);
  const propertyRead = new RegExp(`\\.${forbidden}\\b|\\[['\"]${forbidden}['\"]\\]`);
  assert(!declaration.test(helperSource), `public cue helper must not declare forbidden private field: ${forbidden}`);
  assert(!propertyRead.test(helperSource), `public cue helper must not read forbidden private field: ${forbidden}`);
}

const roomSource = await readFile(new URL('../../app/room/[code].tsx', import.meta.url), 'utf8');
assert(roomSource.includes('buildAiDiscussionCues'), 'room UI must consume deterministic bot discussion cues');
assert(roomSource.includes('كلام لاعيبة الـAI'), 'room UI must clearly label the AI discussion surface');
assert(roomSource.includes('player.isBot'), 'room UI must use authoritative bot identity');
assert(!roomSource.includes('snapshot.me?.role') || !roomSource.includes('buildAiDiscussionCues({ players: snapshot.players'), 'private me.role must not be passed wholesale into cue generation');

console.log(`AI discussion contract OK: ${first.length} alive-bot cues; deterministic refresh; public-only helper boundary.`);
