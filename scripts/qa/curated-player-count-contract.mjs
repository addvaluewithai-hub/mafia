import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalogSource = fs.readFileSync('lib/story-catalog.ts', 'utf8');
const registrySource = fs.readFileSync('lib/server-stories/index.ts', 'utf8');
const apiSource = fs.readFileSync('api/case-start.ts', 'utf8');
const createSource = fs.readFileSync('app/create.tsx', 'utf8');

const catalogEntries = [...catalogSource.matchAll(/\{ id: '([^']+)', playerCount: (\d+), title:/g)]
  .map((match) => ({ id: match[1], playerCount: Number(match[2]) }));

assert.equal(catalogEntries.length, 8, 'curated catalog should contain exactly eight cases for the 4–7 milestone');

for (const playerCount of [4, 5, 6, 7]) {
  const matching = catalogEntries.filter((entry) => entry.playerCount === playerCount);
  assert.equal(matching.length, 2, `expected exactly two curated cases for ${playerCount} players`);
  for (const entry of matching) {
    assert(
      registrySource.includes(`'${entry.id}': { playerCount: ${playerCount}, case:`),
      `server story registry missing ${entry.id} for ${playerCount} players`,
    );
    assert(
      apiSource.includes(`'${entry.id}': { playerCount: ${playerCount}, case:`),
      `case-start preset registry missing ${entry.id} for ${playerCount} players`,
    );
  }
}

for (const playerCount of [8, 9, 10, 11, 12]) {
  assert.equal(
    catalogEntries.filter((entry) => entry.playerCount === playerCount).length,
    0,
    `${playerCount}-player curated support must not be advertised before its own E2E slice`,
  );
}

assert(
  registrySource.includes('.filter(([, item]) => item.playerCount === playerCount)'),
  'AI reference cases must use exact player-count matching',
);
assert(!registrySource.includes('matching.length ? matching : entries'), 'server story references must not fall back to unrelated player counts');
assert(!apiSource.includes('fallbackCount'), 'case-start AI references must not fall back to unrelated player counts');
assert(createSource.includes("'متاحة حاليًا من 4 لـ7 لاعبين.'"), 'create-room copy must describe current curated range accurately');
assert(createSource.includes('storiesForPlayerCount(players)'), 'create-room preset selection must remain player-count aware');

for (const id of ['last-tray', 'balcony-key']) {
  assert(fs.existsSync(`lib/server-stories/${id}.ts`), `missing four-player curated story file: ${id}`);
}

console.log('Curated player-count contract passed: exact 4/5/6/7 coverage, two cases each, no unsupported fallback.');
