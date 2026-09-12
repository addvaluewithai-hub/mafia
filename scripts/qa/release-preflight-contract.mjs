import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const script = path.join(repoRoot, 'scripts', 'release', 'preflight.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'akher-kheit-preflight-'));
const migrationsDir = path.join(fixtureRoot, 'supabase', 'migrations');
const releaseDir = path.join(fixtureRoot, 'scripts', 'release');
fs.mkdirSync(migrationsDir, { recursive: true });
fs.mkdirSync(releaseDir, { recursive: true });

for (const name of [
  '20260809180000_initial_game.sql',
  '20260910074600_sync_case_mode_and_snapshot.sql',
  '20260911204500_public_abuse_perimeter.sql',
  '20260912113500_ai_snapshot_identity.sql',
]) {
  fs.writeFileSync(path.join(migrationsDir, name), '-- fixture\n');
}

const historyMap = {
  canonicalAliases: {
    '20260809180000': [{ version: '20260809180854', name: 'initial_game' }],
    '20260910074600': [
      { version: '20260813165239', name: 'add_curated_story_mode' },
      { version: '20260813172916', name: 'harden_curated_room_rpc' },
    ],
    '20260912113500': [{ version: '20260912113608', name: 'ai_snapshot_identity' }],
  },
  historicalOnly: [
    { version: '20260813150033', name: 'temporary_deploy_source_bridge' },
    { version: '20260813151651', name: 'remove_temporary_deploy_source_bridge' },
  ],
};
fs.writeFileSync(
  path.join(releaseDir, 'migration-history-map.json'),
  `${JSON.stringify(historyMap, null, 2)}\n`,
);

const sha = 'a'.repeat(40);
const checksFile = path.join(fixtureRoot, 'checks.json');
const remoteFile = path.join(fixtureRoot, 'remote.txt');
const greenChecks = {
  check_runs: [
    { name: 'validate', head_sha: sha, status: 'completed', conclusion: 'success' },
    { name: 'qa', head_sha: sha, status: 'completed', conclusion: 'success' },
  ],
};

const knownLegacyHistory = [
  '20260809180854|initial_game',
  '20260813150033|temporary_deploy_source_bridge',
  '20260813151651|remove_temporary_deploy_source_bridge',
  '20260813165239|add_curated_story_mode',
  '20260813172916|harden_curated_room_rpc',
];

function writeGreenFixtures() {
  fs.writeFileSync(checksFile, JSON.stringify(greenChecks));
  fs.writeFileSync(
    remoteFile,
    `${[
      ...knownLegacyHistory,
      '20260912010101|20260911204500_public_abuse_perimeter',
      '20260912113608|ai_snapshot_identity',
    ].join('\n')}\n`,
  );
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
  throw new Error(`known legacy and rollout history should reconcile\n${result.stdout}\n${result.stderr}`);
}

const failedChecks = structuredClone(greenChecks);
failedChecks.check_runs[1].conclusion = 'failure';
fs.writeFileSync(checksFile, JSON.stringify(failedChecks));
result = run();
if (result.status === 0 || !result.stderr.includes('required check qa is not completed/success')) {
  throw new Error(`failed QA fixture should block\n${result.stdout}\n${result.stderr}`);
}

fs.writeFileSync(checksFile, JSON.stringify(greenChecks));
fs.writeFileSync(
  remoteFile,
  `${[
    ...knownLegacyHistory,
    '20260912010101|20260911204500_public_abuse_perimeter',
  ].join('\n')}\n`,
);
result = run();
if (result.status === 0 || !result.stderr.includes('missing in production: 20260912113500')) {
  throw new Error(`pending AI snapshot migration must remain missing\n${result.stdout}\n${result.stderr}`);
}

fs.writeFileSync(
  remoteFile,
  `${[
    '20260809180854|initial_game',
    '20260813150033|temporary_deploy_source_bridge',
    '20260813151651|remove_temporary_deploy_source_bridge',
    '20260813165239|add_curated_story_mode',
    '20260912010101|20260911204500_public_abuse_perimeter',
    '20260912113608|ai_snapshot_identity',
  ].join('\n')}\n`,
);
result = run();
if (result.status === 0 || !result.stderr.includes('missing in production: 20260910074600')) {
  throw new Error(`incomplete composite legacy alias must block\n${result.stdout}\n${result.stderr}`);
}

writeGreenFixtures();
fs.appendFileSync(remoteFile, '20260912020202|unknown_manual_change\n');
result = run();
if (result.status === 0 || !result.stderr.includes('unexpected in production: 20260912020202|unknown_manual_change')) {
  throw new Error(`unknown production history must block\n${result.stdout}\n${result.stderr}`);
}

console.log('release preflight contract: PASS');
