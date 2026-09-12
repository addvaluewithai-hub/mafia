import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const requiredChecks = ['validate', 'qa'];

function fail(message) {
  console.error(`release-preflight: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) fail(`unknown argument: ${arg}`);
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) fail(`missing value for --${key}`);
    args[key] = value;
    i += 1;
  }
  return args;
}

function migrationVersions(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => /^\d{14}_.+\.sql$/.test(name))
    .map((name) => name.slice(0, 14))
    .sort();
}

function parseRemoteRecords(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('|');
      const version = separator === -1 ? line : line.slice(0, separator).trim();
      const name = separator === -1 ? '' : line.slice(separator + 1).trim();
      if (!/^\d{14}$/.test(version)) fail(`invalid production migration record: ${line}`);
      return { version, name };
    });
}

function loadMigrationHistoryMap(file) {
  if (!fs.existsSync(file)) fail(`migration history map not found: ${file}`);
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    canonicalAliases: parsed.canonicalAliases || {},
    historicalOnly: Array.isArray(parsed.historicalOnly) ? parsed.historicalOnly : [],
  };
}

function recordKey(record) {
  return `${record.version}|${record.name || ''}`;
}

async function loadChecks({ file, repo, sha, token }) {
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!repo) fail('GITHUB_REPOSITORY is required');
  if (!token) fail('GITHUB_TOKEN is required');

  const response = await fetch(
    `https://api.github.com/repos/${repo}/commits/${sha}/check-runs?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) fail(`GitHub check-runs request failed: ${response.status}`);
  return response.json();
}

function verifyChecks(payload, sha) {
  const runs = Array.isArray(payload.check_runs) ? payload.check_runs : [];

  for (const name of requiredChecks) {
    const matches = runs.filter((run) => run.name === name && run.head_sha === sha);
    if (matches.length === 0) fail(`required check ${name} is missing for ${sha}`);
    if (!matches.some((run) => run.status === 'completed' && run.conclusion === 'success')) {
      fail(`required check ${name} is not completed/success for ${sha}`);
    }
  }
}

function loadRemoteRecords({ file, dbUrl }) {
  if (file) return parseRemoteRecords(fs.readFileSync(file, 'utf8'));
  if (!dbUrl) fail('SUPABASE_PRODUCTION_DB_URL is required');

  const query = "select version || '|' || coalesce(name, '') from supabase_migrations.schema_migrations order by version;";
  const result = spawnSync(
    'psql',
    [dbUrl, '-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1', '-c', query],
    {
      encoding: 'utf8',
      env: { ...process.env, PGAPPNAME: 'akher-kheit-release-preflight' },
    },
  );

  if (result.error) fail(`could not run psql: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`production migration read failed: ${result.stderr.trim() || `psql exit ${result.status}`}`);
  }

  return parseRemoteRecords(result.stdout);
}

function verifyMigrationParity(local, remote, historyMap) {
  const localSet = new Set(local);
  const remoteKeys = new Set(remote.map(recordKey));
  const applied = new Set();
  const recognizedRemote = new Set();

  for (const canonical of Object.keys(historyMap.canonicalAliases)) {
    if (!localSet.has(canonical)) {
      fail(`migration history map references unknown local migration: ${canonical}`);
    }
  }

  for (const record of remote) {
    const key = recordKey(record);

    if (localSet.has(record.version)) {
      applied.add(record.version);
      recognizedRemote.add(key);
      continue;
    }

    const namedCanonical = record.name.match(/^(\d{14})_/i)?.[1];
    if (namedCanonical && localSet.has(namedCanonical)) {
      applied.add(namedCanonical);
      recognizedRemote.add(key);
      continue;
    }
  }

  for (const [canonical, aliases] of Object.entries(historyMap.canonicalAliases)) {
    if (!Array.isArray(aliases) || aliases.length === 0) {
      fail(`migration history map has empty alias set for ${canonical}`);
    }
    const aliasKeys = aliases.map(recordKey);
    for (const key of aliasKeys) {
      if (remoteKeys.has(key)) recognizedRemote.add(key);
    }
    if (aliasKeys.every((key) => remoteKeys.has(key))) applied.add(canonical);
  }

  for (const record of historyMap.historicalOnly) {
    const key = recordKey(record);
    if (remoteKeys.has(key)) recognizedRemote.add(key);
  }

  const missingRemote = local.filter((version) => !applied.has(version));
  const unexpectedRemote = remote
    .filter((record) => !recognizedRemote.has(recordKey(record)))
    .map((record) => recordKey(record));

  if (missingRemote.length || unexpectedRemote.length) {
    const details = [];
    if (missingRemote.length) details.push(`missing in production: ${missingRemote.join(', ')}`);
    if (unexpectedRemote.length) details.push(`unexpected in production: ${unexpectedRemote.join(', ')}`);
    fail(`migration drift detected (${details.join('; ')})`);
  }
}

const args = parseArgs(process.argv);
const sha = args.sha || process.env.RELEASE_SHA || process.env.GITHUB_SHA;
if (!sha || !/^[0-9a-f]{40}$/i.test(sha)) {
  fail('release SHA must be a full 40-character commit SHA');
}

const repoRoot = path.resolve(args.root || process.cwd());
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) fail(`migration directory not found: ${migrationsDir}`);
const historyMapPath = path.resolve(
  args['migration-history-map'] || path.join(repoRoot, 'scripts', 'release', 'migration-history-map.json'),
);

const checks = await loadChecks({
  file: args['checks-file'] || process.env.PREFLIGHT_CHECK_RUNS_FILE,
  repo: args.repo || process.env.GITHUB_REPOSITORY,
  sha,
  token: process.env.GITHUB_TOKEN,
});
verifyChecks(checks, sha);

const local = migrationVersions(migrationsDir);
const remote = loadRemoteRecords({
  file: args['remote-migrations-file'] || process.env.PREFLIGHT_REMOTE_MIGRATIONS_FILE,
  dbUrl: process.env.SUPABASE_PRODUCTION_DB_URL,
});
const historyMap = loadMigrationHistoryMap(historyMapPath);
verifyMigrationParity(local, remote, historyMap);

console.log(`release-preflight: PASS ${sha}`);
console.log(
  `release-preflight: checks ${requiredChecks.join(', ')} are green; ${local.length} repo migrations reconcile with ${remote.length} production ledger records`,
);
