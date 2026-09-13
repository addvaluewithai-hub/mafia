import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'akher-kheit-observability-'));
const fixture = join(dir, 'logs.jsonl');

const lines = [
  JSON.stringify({ type: 'akher_kheit.gameplay', event: 'join', outcome: 'success', release: 'sha-a', nickname: 'SECRET_NICK' }),
  JSON.stringify({ type: 'akher_kheit.gameplay', event: 'vote', outcome: 'error', errorClass: 'conflict', release: 'sha-a', roomCode: 'SECRET_ROOM' }),
  JSON.stringify({ message: JSON.stringify({ type: 'akher_kheit.gameplay', event: 'reconnect', outcome: 'recovered', release: 'sha-a' }) }),
  JSON.stringify({ text: JSON.stringify({ type: 'akher_kheit.telemetry_ingest', outcome: 'error', reason: 'rate_limited', status: 429, release: 'sha-a', abuseKey: 'SECRET_KEY' }) }),
  JSON.stringify({ type: 'akher_kheit.gameplay', event: 'vote', outcome: 'error', errorClass: 'server', release: 'sha-b' }),
  JSON.stringify({ type: 'other', message: 'ignore me' }),
].join('\n');

await writeFile(fixture, fixtureContent());

function fixtureContent() {
  return lines;
}

function run(...args) {
  const result = spawnSync(process.execPath, ['scripts/operations/observability-summary.mjs', '--file', fixture, ...args], {
    cwd: new URL('../../', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || 'observability summary failed');
  return result.stdout;
}

try {
  const failures = run('--release', 'sha-a');
  assert.match(failures, /sha-a\tvote\terror\tconflict\t1/);
  assert.match(failures, /sha-a\treconnect\trecovered\tnone\t1/);
  assert.match(failures, /sha-a\trate_limited\t429\t1/);
  assert.doesNotMatch(failures, /\tjoin\tsuccess\t/);
  assert.doesNotMatch(failures, /sha-b/);

  const all = run('--release', 'sha-a', '--all');
  assert.match(all, /sha-a\tjoin\tsuccess\tnone\t1/);

  for (const secret of ['SECRET_NICK', 'SECRET_ROOM', 'SECRET_KEY']) {
    assert.equal(failures.includes(secret), false, `operator summary must not echo sensitive value: ${secret}`);
    assert.equal(all.includes(secret), false, `operator summary must not echo sensitive value: ${secret}`);
  }

  assert.match(failures, /mode=failures-only/);
  assert.match(all, /mode=all/);
  console.log('observability operations contract: PASS');
} finally {
  await rm(dir, { recursive: true, force: true });
}
