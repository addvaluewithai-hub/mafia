import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sources = [
  'app/api/generate-case+api.ts',
  'api/case-start.ts',
].map((path) => ({ path, source: readFileSync(path, 'utf8') }));

for (const { path, source } of sources) {
  assert.match(
    source,
    /required:\s*\['role',\s*'bio'\]/,
    `${path} JSON schema must require role + bio`,
  );
  assert.doesNotMatch(
    source,
    /required:\s*\['name',\s*'bio'\]/,
    `${path} must not ask the model for fictional character names`,
  );
  assert.match(
    source,
    /p_case:\s*generated/,
    `${path} must pass the validated generated payload directly into install_case`,
  );
}

const expoRoute = sources.find(({ path }) => path.startsWith('app/'))?.source ?? '';
assert.match(expoRoute, /role:\s*z\.string\(\)/, 'Expo generator validator must require role');
assert.doesNotMatch(expoRoute, /name:\s*z\.string\(\)/, 'Expo generator validator must not validate fictional name');
assert.match(expoRoute, /بدون name/, 'Expo generator prompt must explicitly forbid fictional names');

const serverRoute = sources.find(({ path }) => path === 'api/case-start.ts')?.source ?? '';
assert.match(serverRoute, /بدون name/, 'Server generator prompt must explicitly forbid fictional names');
assert.match(
  serverRoute,
  /characters:\s*item\.case\.characters\.map\(\(character\) => \(\{ bio: character\.bio \}\)\)/,
  'AI reference payload must strip legacy fictional names before prompting',
);

const types = readFileSync('lib/types.ts', 'utf8');
assert.match(types, /role\?: string;/, 'GeneratedCase must support role');
assert.match(types, /name\?: string;/, 'GeneratedCase must remain compatible with curated legacy cases');

console.log('Generated case role contract passed for both generator routes.');
