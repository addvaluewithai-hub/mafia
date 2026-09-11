import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const script = path.join(repoRoot, 'scripts', 'release', 'preflight.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'akher-kheit-preflight-'));
const migrationsDir = path.join(fixtureRoot, 'supabase', 'migrations');
fs.mkdirSync(migrationsDir, { recursive: true });
fs.writeFileSync(path.join(migrationsDir, '20260101000000_first.sql'), '-- fixture\n');
fs.writeFileSync(path.join(migrationsDir, '20260102000000_second.sql'), '-- fixture\n');

const sha = 'a'.repeat(40);
const checksFile = path.join(fixtureRoot, 'checks.json');
const remoteFile = path.join(fixtureRoot, 'remote.txt');
const greenChecks = {
  check_runs: [
    { name: 'validate', head_sha: sha, status: 'completed', conclusion: 'success' },
    { name: 'qa', head_sha: sha, status: 'completed', conclusion: 'success' },
  ],
};

function writeGreenFixtures() {
  fs.writeFileSync(checksFile, JSON.stringify(greenChecks));
  fs.writeFileSync(remoteFile, '20260101000000\n20260102000000\n');
}

function run() {
  return spawnSync(
    process.execPath,
    [
      script,
      '--root',
      fixtureRoot,
      '--sha',
      sha,
      '--checks-file',
      checksFile,
      '--remote-migrations-file',
      remoteFile,
    ],
    { encoding: 'utf8' },
  );
}

writeGreenFixtures();
let result = run();
if (result.status !== 0 || !result.stdout.includes('release-preflight: PASS')) {
  throw new Error(`green fixture should pass\n${result.stdout}\n${result.stderr}`);
}

const failedChecks = structuredClone(greenChecks);
failedChecks.check_runs[1].conclusion = 'failure';
fs.writeFileSync(checksFile, JSON.stringify(failedChecks));
result = run();
if (result.status === 0 || !result.stderr.includes('required check qa is not completed/success')) {
  throw new Error(`failed QA fixture should block\n${result.stdout}\n${result.stderr}`);
}

writeGreenFixtures();
fs.writeFileSync(remoteFile, '20260101000000\n');
result = run();
if (result.status === 0 || !result.stderr.includes('missing in production: 20260102000000')) {
  throw new Error(`migration drift fixture should block\n${result.stdout}\n${result.stderr}`);
}

writeGreenFixtures();
fs.appendFileSync(remoteFile, '20260103000000\n');
result = run();
if (result.status === 0 || !result.stderr.includes('unexpected in production: 20260103000000')) {
  throw new Error(`unexpected production migration should block\n${result.stdout}\n${result.stderr}`);
}

console.log('release preflight contract: PASS');
