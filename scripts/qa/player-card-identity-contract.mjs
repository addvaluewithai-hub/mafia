import assert from 'node:assert/strict';
import fs from 'node:fs';

const roomSource = fs.readFileSync('app/room/[code].tsx', 'utf8');
const playerCardStart = roomSource.indexOf('function PlayerCard(');
const clueCardStart = roomSource.indexOf('function ClueCard(');

assert(playerCardStart >= 0, 'PlayerCard must exist in room screen');
assert(clueCardStart > playerCardStart, 'PlayerCard source boundary must be discoverable');

const playerCardSource = roomSource.slice(playerCardStart, clueCardStart);

assert.match(
  playerCardSource,
  /\{player\.nickname\}/,
  'PlayerCard must render the real nickname as the visible player identity',
);

assert.match(
  playerCardSource,
  /player\.isBot\s*\?\s*<Pill label="AI"/,
  'PlayerCard must expose authoritative bot identity with an explicit AI badge',
);

assert.match(
  playerCardSource,
  /player\.isBot\s*\?\s*\([\s\S]*?<Bot\b/,
  'PlayerCard avatar must consume authoritative isBot identity for the bot visual cue',
);

assert.doesNotMatch(
  playerCardSource,
  /nickname\.(?:startsWith|includes|match)|nickname\s*[!=]==?\s*['"]AI/,
  'PlayerCard must never infer bot identity from the visible nickname',
);

assert.doesNotMatch(
  playerCardSource,
  /\{player\.characterName\}/,
  'PlayerCard must not render legacy fictional characterName as a second player identity',
);

console.log('Player card identity contract passed: nickname stays primary, AI identity comes only from isBot, and fictional characterName stays hidden.');
