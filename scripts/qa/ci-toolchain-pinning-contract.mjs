import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const workflowPaths = [
  '.github/workflows/ci.yml',
  '.github/workflows/game-qa.yml',
  '.github/workflows/package-vercel-source.yml',
];

const failures = [];
const actionRefPattern = /^\s*-?\s*uses:\s*([^\s@]+)@([^\s#]+)(?:\s*#.*)?$/gm;
const fullShaPattern = /^[0-9a-f]{40}$/i;

for (const workflowPath of workflowPaths) {
  const source = fs.readFileSync(path.join(repoRoot, workflowPath), 'utf8');
  let match;
  let actionCount = 0;

  while ((match = actionRefPattern.exec(source)) !== null) {
    actionCount += 1;
    const [, action, ref] = match;
    if (action.startsWith('./')) continue;
    if (!fullShaPattern.test(ref)) {
      failures.push(`${workflowPath}: ${action}@${ref} is not pinned to a full commit SHA`);
    }
  }

  if (actionCount === 0) failures.push(`${workflowPath}: expected at least one GitHub Action reference`);
}

const gameQa = fs.readFileSync(path.join(repoRoot, '.github/workflows/game-qa.yml'), 'utf8');
if (/version:\s*latest\b/i.test(gameQa)) failures.push('.github/workflows/game-qa.yml: Supabase CLI must not use version: latest');
if (!/version:\s*['"]?\d+\.\d+\.\d+['"]?\s*(?:#.*)?$/m.test(gameQa)) failures.push('.github/workflows/game-qa.yml: expected an exact Supabase CLI x.y.z version');
if (!/@playwright\/test@\d+\.\d+\.\d+\b/.test(gameQa)) failures.push('.github/workflows/game-qa.yml: Playwright runtime must use an exact x.y.z version');

if (failures.length > 0) {
  console.error('CI toolchain pinning contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`CI toolchain pinning contract passed for ${workflowPaths.length} workflows.`);
