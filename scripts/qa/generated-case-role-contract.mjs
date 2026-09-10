import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sources = [
  'app/api/generate-case+api.ts',
  'api/case-start.ts',
].map((path) => ({ path, source: readFileSync(path, 'utf8') }));

for (const { path, source } of sources) {
  assert.match(
    source,
    /required:\s*\['role',\s*'bio',\s*'roleByGender',\s*'bioByGender'\]/,
    `${path} JSON schema must require neutral fallback plus gender wording variants`,
  );
  assert.doesNotMatch(
    source,
    /required:\s*\['name',\s*'bio'\]/,
    `${path} must not ask the model for fictional character names`,
  );
  assert.match(source, /roleByGender/, `${path} must request gender-aware role wording`);
  assert.match(source, /bioByGender/, `${path} must request gender-aware bio wording`);
  assert.match(source, /male[^\n]*female|female[^\n]*male/s, `${path} must define both male and female variants`);
  assert.match(
    source,
    /نفس الدور|نفس الحقائق|متطابقين في المعنى/,
    `${path} prompt must keep male/female variants semantically equivalent`,
  );
  assert.match(
    source,
    /gender[^\n]*(?:لا يدخل|ممنوع استخدام)[^\n]*mafiaCharacterIndexes|mafiaCharacterIndexes[^\n]*مستقل/s,
    `${path} prompt must keep mafia assignment independent from gender wording`,
  );
  assert.match(
    source,
    /p_case:\s*generated/,
    `${path} must pass the validated generated payload directly into install_case`,
  );
}

const expoRoute = sources.find(({ path }) => path.startsWith('app/'))?.source ?? '';
assert.match(expoRoute, /roleByGender:\s*genderText\(/, 'Expo generator validator must require roleByGender');
assert.match(expoRoute, /bioByGender:\s*genderText\(/, 'Expo generator validator must require bioByGender');
assert.doesNotMatch(expoRoute, /name:\s*z\.string\(\)/, 'Expo generator validator must not validate fictional name');
assert.match(expoRoute, /بدون name/, 'Expo generator prompt must explicitly forbid fictional names');

const serverRoute = sources.find(({ path }) => path === 'api/case-start.ts')?.source ?? '';
assert.match(serverRoute, /requireGenderVariants = false/, 'Server validator must preserve legacy preset compatibility');
assert.match(
  serverRoute,
  /validateCase\(parseJson\(response\.text\),\s*playerCount,\s*mafiaCount,\s*true\)/,
  'Server AI generation must require gender variants',
);
assert.match(serverRoute, /بدون name|ممنوع name/, 'Server generator prompt must explicitly forbid fictional names');
assert.match(
  serverRoute,
  /characters:\s*item\.case\.characters\.map\(\(character\) => \(\{ bio: character\.bio \}\)\)/,
  'AI reference payload must strip legacy fictional names before prompting',
);

const installMigration = readFileSync('supabase/migrations/20260910233000_gender_case_text_variants.sql', 'utf8');
assert.match(installMigration, /roleByGender/, 'install_case migration must consume roleByGender');
assert.match(installMigration, /bioByGender/, 'install_case migration must consume bioByGender');
assert.match(installMigration, /order by random\(\)/i, 'install_case must retain randomized player assignment');
assert.match(installMigration, /mafiaCharacterIndexes/, 'install_case must retain mafiaCharacterIndexes assignment');

const types = readFileSync('lib/types.ts', 'utf8');
assert.match(types, /role\?: string;/, 'GeneratedCase must support neutral role fallback');
assert.match(types, /name\?: string;/, 'GeneratedCase must remain compatible with curated legacy cases');

console.log('Generated case gender wording contract passed for schema, prompt, and install handoff.');
