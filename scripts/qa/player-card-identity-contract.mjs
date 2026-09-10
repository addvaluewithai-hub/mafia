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

assert.doesNotMatch(
  playerCardSource,
  /\{player\.characterName\}/,
  'PlayerCard must not render legacy fictional characterName as a second player identity',
);

console.log('Player card identity contract passed: nickname is primary and fictional characterName is hidden.');
