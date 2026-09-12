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
  { id: 'bot-2', nickname: 'AI نور', caseRole: 'الأمن', isBot: true, isEliminated: false },
  { id: 'bot-3', nickname: 'AI سارة', caseRole: 'الموردة', isBot: true, isEliminated: false },
];

const first = buildAiDiscussionCues({ players, round });
const refreshed = buildAiDiscussionCues({ players: structuredClone(players), round: structuredClone(round) });
assert.deepEqual(refreshed, first, 'refresh/reconnect must reproduce the same cues from the same public inputs');
assert.deepEqual(first.map((cue) => cue.playerId), ['bot-1', 'bot-2', 'bot-3'], 'all alive bots should get one cue');
assert.equal(new Set(first.map((cue) => cue.text)).size, 3, 'the three-bot solo surface should not repeat the same cue in one round');
assert(first.every((cue) => cue.text.length > 0 && cue.text.length < 220), 'bot cues should stay short and readable');
assert(first.every((cue) => !/مافيا|mafia|innocent|solution|حل القضية/i.test(cue.text)), 'visible cues must not claim private role/solution knowledge');

const reordered = buildAiDiscussionCues({ players: [players[3], players[0], players[2], players[1]], round });
assert.deepEqual(
  new Map(reordered.map((cue) => [cue.playerId, cue.text])),
  new Map(first.map((cue) => [cue.playerId, cue.text])),
  'cue identity must stay stable if snapshot player ordering changes across refresh/reconnect',
);

const changedRound = buildAiDiscussionCues({
  players,
  round: {
    ...round,
    roundIndex: 2,
    clue: `${round.clue} واتكشف أثر جديد.`,
    discussionPrompt: 'إيه التفسير الأقوى بعد الأثر الجديد؟',
  },
});
assert.equal(changedRound.length, first.length, 'new rounds should keep one cue per alive bot');
const firstByPlayer = new Map(first.map((cue) => [cue.playerId, cue.text]));
assert(
  changedRound.every((cue) => cue.text !== firstByPlayer.get(cue.playerId)),
  'each solo bot should rotate to a different discussion style when the round changes',
);

const afterElimination = buildAiDiscussionCues({
  players: players.map((player) => player.id === 'bot-2' ? { ...player, isEliminated: true } : player),
  round,
});
assert.deepEqual(afterElimination.map((cue) => cue.playerId), ['bot-1', 'bot-3'], 'eliminated bots must stop speaking immediately');

const helperSource = await readFile(new URL('../../lib/ai-discussion.ts', import.meta.url), 'utf8');
assert(/\bcaseRole\s*:/.test(helperSource), 'public cue helper may explicitly accept the public caseRole field');

function typeFields(typeName) {
  const match = helperSource.match(new RegExp(`(?:export\\s+)?type\\s+${typeName}\\s*=\\s*\\{([\\s\\S]*?)\\};`));
  assert(match, `expected ${typeName} type declaration`);
  return [...match[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\??\s*:/gm)].map((field) => field[1]);
}

assert.deepEqual(
  typeFields('PublicAiDiscussionPlayer'),
  ['id', 'nickname', 'caseRole', 'isBot', 'isEliminated'],
  'AI discussion player projection must stay limited to explicit public identity/gameplay fields',
);
assert.deepEqual(
  typeFields('PublicAiDiscussionRound'),
  ['roundIndex', 'clue', 'discussionPrompt'],
  'AI discussion round projection must stay limited to revealed public round fields',
);
assert.deepEqual(
  typeFields('AiDiscussionInput'),
  ['players', 'round'],
  'AI discussion helper must accept only the public player projection and public round projection',
);

const forbiddenFields = ['role', 'winner', 'publicSolution', 'solution', 'mafiaCharacter', 'secret', 'team'];
for (const forbidden of forbiddenFields) {
  const propertyRead = new RegExp(`\\.${forbidden}\\b|\\[['\"]${forbidden}['\"]\\]`);
  assert(!propertyRead.test(helperSource), `public cue helper must not read forbidden private field: ${forbidden}`);
}

const roomSource = await readFile(new URL('../../app/room/[code].tsx', import.meta.url), 'utf8');
assert(roomSource.includes('buildAiDiscussionCues'), 'room UI must consume deterministic bot discussion cues');
assert(roomSource.includes('كلام لاعيبة الـAI'), 'room UI must clearly label the AI discussion surface');
assert(roomSource.includes('player.isBot'), 'room UI must use authoritative bot identity');
assert(roomSource.includes('votePhaseOpen && aiDiscussionCues.length'), 'AI discussion cues must appear only during the voting/discussion phase');
assert(!roomSource.includes('snapshot.me?.role') || !roomSource.includes('buildAiDiscussionCues({ players: snapshot.players'), 'private me.role must not be passed wholesale into cue generation');

console.log(`AI discussion contract OK: ${first.length} varied alive-bot cues; deterministic refresh/reorder; round rotation; elimination stop; public-only helper boundary.`);
