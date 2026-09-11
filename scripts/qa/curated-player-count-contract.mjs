import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalogSource = fs.readFileSync('lib/story-catalog.ts', 'utf8');
const registrySource = fs.readFileSync('lib/server-stories/index.ts', 'utf8');
const apiSource = fs.readFileSync('api/case-start.ts', 'utf8');
const createSource = fs.readFileSync('app/create.tsx', 'utf8');

const catalogEntries = [...catalogSource.matchAll(/\{ id: '([^']+)', playerCount: (\d+), packId: '([^']+)', title:/g)]
  .map((match) => ({ id: match[1], playerCount: Number(match[2]), packId: match[3] }));

assert.equal(catalogEntries.length, 14, 'curated catalog should contain exactly fourteen cases for the 4–10 milestone');

const declaredPacks = [...catalogSource.matchAll(/\{ id: '(home-social|stage-events|work-records)', label:/g)].map((match) => match[1]);
assert.deepEqual(new Set(declaredPacks), new Set(['home-social', 'stage-events', 'work-records']), 'curated browsing must expose the three reviewed theme packs');
assert(catalogEntries.every((entry) => declaredPacks.includes(entry.packId)), 'every curated case must belong to a declared pack');
assert(new Set(catalogEntries.map((entry) => entry.packId)).size === 3, 'all declared packs must contain at least one curated case');

for (const playerCount of [4, 5, 6, 7, 8, 9, 10]) {
  const matching = catalogEntries.filter((entry) => entry.playerCount === playerCount);
  assert.equal(matching.length, 2, `expected exactly two curated cases for ${playerCount} players`);
  for (const entry of matching) {
    assert(registrySource.includes(`'${entry.id}': { playerCount: ${playerCount}, case:`), `shared curated registry missing ${entry.id} for ${playerCount} players`);
    assert(fs.existsSync(`lib/server-stories/${entry.id}.ts`), `missing curated story file: ${entry.id}`);
  }
}

for (const playerCount of [11, 12]) {
  assert.equal(catalogEntries.filter((entry) => entry.playerCount === playerCount).length, 0, `${playerCount}-player curated support must not be advertised before its own E2E slice`);
}

assert(catalogSource.includes('storiesForPlayerCount(playerCount: number, packId?: StoryPackId | null)'), 'catalog must support player-count-first pack filtering');
assert(catalogSource.includes('story.playerCount === playerCount && (!packId || story.packId === packId)'), 'pack filtering must never bypass exact player-count matching');
assert(catalogSource.includes('packsForPlayerCount(playerCount: number)'), 'catalog must derive only packs available for the active player count');

assert(registrySource.includes('.filter(([, item]) => item.playerCount === playerCount)'), 'AI reference cases must use exact player-count matching');
assert(registrySource.includes('packId: storyMetadata(id)?.packId ?? null'), 'server-side curated references must carry shared pack metadata');
assert(!registrySource.includes('matching.length ? matching : entries'), 'shared story references must not fall back to unrelated player counts');

assert(apiSource.includes("import { getCuratedCase, referenceCasesFor } from '../lib/server-stories';"), 'server API must consume the shared curated registry');
assert(apiSource.includes('getCuratedCase(String(snapshot.room.storyTemplateId'), 'preset lookup must go through shared getCuratedCase');
assert(apiSource.includes('referenceCasesFor(input.playerCount)'), 'AI prompt references must come from the shared exact-count registry');
assert(!apiSource.includes('const CASES = {'), 'server API must not reintroduce a duplicate curated registry');
assert(!apiSource.includes('fallbackCount'), 'case-start AI references must not fall back to unrelated player counts');

assert(createSource.includes("'متاحة حاليًا من 4 لـ10 لاعبين.'"), 'create-room copy must describe current curated range accurately');
assert(createSource.includes('storiesForPlayerCount(players, storyPackId)'), 'Expo create-room browsing must filter packs inside the active player count');
assert(createSource.includes('packsForPlayerCount(players)'), 'Expo create-room must only offer packs available for the active player count');
assert(createSource.includes('setStoryPackId(null)'), 'changing player count must clear a stale pack filter');
assert(createSource.includes("setError('اختار قضية جاهزة مناسبة لعدد اللاعبين.')"), 'submit must still validate selected preset against the full exact-count set');

console.log('Curated player-count + pack contract passed: exact 4–10 coverage, safe theme browsing, shared server metadata, no unsupported fallback.');
