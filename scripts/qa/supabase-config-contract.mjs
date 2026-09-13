import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile(new URL('../../supabase/config.toml', import.meta.url), 'utf8');

assert.equal(
  /^\[inbucket\]$/m.test(config),
  false,
  'supabase/config.toml must not restore the deprecated [inbucket] section',
);
assert.match(config, /^\[api\]$/m, 'local Supabase API config must remain explicit');
assert.match(config, /^\[db\]$/m, 'local Supabase DB config must remain explicit');
assert.match(config, /^\[auth\]$/m, 'local Supabase auth config must remain explicit');
assert.match(config, /^enable_anonymous_sign_ins = true$/m, 'anonymous auth is required by gameplay QA');

console.log('Supabase config contract passed: deprecated [inbucket] config is absent and gameplay-required local services remain explicit.');
