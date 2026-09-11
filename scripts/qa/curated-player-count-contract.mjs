import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalogSource = fs.readFileSync('lib/story-catalog.ts', 'utf8');
const registrySource = fs.readFileSync('lib/server-stories/index.ts', 'utf8');
const apiSource = fs.readFileSync('api/case-start.ts', 'utf8');
const createSource = fs.readFileSync('app/create.tsx', 'utf8');

const catalogEntries = [...catalogSource.matchAll(/\{ id: '([^']+)', playerCount: (\d+), title:/g)]
  .map((match) => ({ id: match[1], playerCount: Number(match[2]) }));

assert.equal(catalogEntries.length, 14, 'curated catalog should contain exactly fourteen cases for the 4–10 milestone');

for (const playerCount of [4, 5, 6, 7, 8, 9, 10]) {
  const matching = catalogEntries.filter((entry) => entry.playerCount === playerCount);
  assert.equal(matching.length, 2, `expected exactly two curated cases for ${playerCount} players`);
  for (const entry of matching) {
    assert(
      registrySource.includes(`'${entry.id}': { playerCount: ${playerCount}, case:`),
      `shared curated registry missing ${entry.id} for ${playerCount} players`,
    );
    assert(fs.existsSync(`lib/server-stories/${entry.id}.ts`), `missing curated story file: ${entry.id}`);
  }
}

for (const playerCount of [11, 12]) {
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
assert(!registrySource.includes('matching.length ? matching : entries'), 'shared story references must not fall back to unrelated player counts');

assert(
  apiSource.includes("import { getCuratedCase, referenceCasesFor } from '../lib/server-stories';"),
  'server API must consume the shared curated registry',
);
assert(apiSource.includes('getCuratedCase(String(snapshot.room.storyTemplateId'), 'preset lookup must go through shared getCuratedCase');
assert(apiSource.includes('referenceCasesFor(input.playerCount)'), 'AI prompt references must come from the shared exact-count registry');
assert(!apiSource.includes('const CASES = {'), 'server API must not reintroduce a duplicate curated registry');
assert(!apiSource.includes('fallbackCount'), 'case-start AI references must not fall back to unrelated player counts');

assert(createSource.includes("'متاحة حاليًا من 4 لـ10 لاعبين.'"), 'create-room copy must describe current curated range accurately');
assert(createSource.includes('storiesForPlayerCount(players)'), 'Expo create-room preset selection must remain player-count aware');

console.log('Curated player-count contract passed: one shared registry, exact 4–10 coverage, two cases each, no unsupported fallback.');
