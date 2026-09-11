import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const [observability, telemetryApi, game, create] = await Promise.all([
  readFile(new URL('lib/observability.ts', root), 'utf8'),
  readFile(new URL('app/api/telemetry+api.ts', root), 'utf8'),
  readFile(new URL('lib/game.ts', root), 'utf8'),
  readFile(new URL('app/create.tsx', root), 'utf8'),
]);

for (const event of ['create', 'join', 'start', 'generation', 'vote', 'resolve', 'reconnect']) {
  assert.match(observability, new RegExp(`['"]${event}['"]`), `missing telemetry event: ${event}`);
}

assert.match(create, /createRoomV3\(/, 'create screen must use the observed create path');
assert.match(game, /observeGameplayOperation\('join'/, 'join must be observed');
assert.match(game, /observeGameplayOperation\('vote'/, 'vote must be observed');
assert.match(game, /'resolve'[\s\S]*observeGameplayOperation|observeGameplayOperation\([\s\S]*'resolve'/, 'resolve must be observed');
assert.match(game, /event: 'reconnect'/, 'reconnect recovery/failure must be observed');
assert.match(game, /observeGameplayOperation\('start'/, 'case start must be observed');
assert.match(observability, /payload\.event === 'start'[\s\S]*event: 'generation'/, 'generation signal must be correlated with case start');

assert.match(telemetryApi, /\.strict\(\)/, 'telemetry API must reject unknown fields');
assert.match(telemetryApi, /raw\.length > 2048/, 'telemetry API must bound payload size');
assert.match(telemetryApi, /VERCEL_GIT_COMMIT_SHA/, 'server release correlation is required');

const forbiddenTelemetryFields = [
  'roomCode',
  'room_id',
  'nickname',
  'playerId',
  'player_id',
  'sessionToken',
  'access_token',
  'storyTitle',
  'solution',
  'clue',
  'theme',
  'prompt',
];
for (const field of forbiddenTelemetryFields) {
  assert.equal(telemetryApi.includes(field), false, `telemetry API must not accept/log sensitive field: ${field}`);
}

console.log('observability contract: PASS');
