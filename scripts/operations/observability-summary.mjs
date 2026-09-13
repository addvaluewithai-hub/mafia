#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const GAMEPLAY_TYPE = 'akher_kheit.gameplay';
const INGEST_TYPE = 'akher_kheit.telemetry_ingest';
const GAMEPLAY_EVENTS = new Set(['create', 'join', 'start', 'generation', 'vote', 'resolve', 'reconnect']);
const OUTCOMES = new Set(['success', 'error', 'recovered']);
const ERROR_CLASSES = new Set(['auth', 'rate_limit', 'network', 'not_found', 'conflict', 'server', 'unknown']);
const INGEST_REASONS = new Set(['missing_abuse_key', 'payload_too_large', 'invalid_json', 'invalid_telemetry', 'guard_unavailable', 'rate_limited']);

function parseArgs(argv) {
  const args = { file: null, release: null, all: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') args.file = argv[++index] ?? null;
    else if (arg === '--release') args.release = argv[++index] ?? null;
    else if (arg === '--all') args.all = true;
    else if (arg === '--help') {
      console.log('Usage: node scripts/operations/observability-summary.mjs [--file logs.jsonl] [--release SHA] [--all]');
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function maybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
}

function extractRecord(line) {
  const parsed = maybeJson(line);
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.type === GAMEPLAY_TYPE || parsed.type === INGEST_TYPE) return parsed;
  for (const key of ['message', 'text', 'msg']) {
    const nested = maybeJson(parsed[key]);
    if (nested?.type === GAMEPLAY_TYPE || nested?.type === INGEST_TYPE) return nested;
  }
  return null;
}

function inc(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sanitizeRelease(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 80 ? value : 'unknown';
}

function sortEntries(map) {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const args = parseArgs(process.argv.slice(2));
const raw = args.file ? await readFile(args.file, 'utf8') : await new Promise((resolve, reject) => {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => resolve(input));
  process.stdin.on('error', reject);
});

const gameplay = new Map();
const ingest = new Map();
let accepted = 0;
let ignored = 0;

for (const line of raw.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const record = extractRecord(line);
  if (!record) { ignored += 1; continue; }
  const release = sanitizeRelease(record.release);
  if (args.release && release !== args.release) continue;

  if (record.type === GAMEPLAY_TYPE) {
    if (!GAMEPLAY_EVENTS.has(record.event) || !OUTCOMES.has(record.outcome)) { ignored += 1; continue; }
    if (!args.all && record.outcome === 'success') continue;
    const errorClass = ERROR_CLASSES.has(record.errorClass) ? record.errorClass : 'none';
    inc(gameplay, `${release}\t${record.event}\t${record.outcome}\t${errorClass}`);
    accepted += 1;
    continue;
  }

  if (record.type === INGEST_TYPE) {
    if (record.outcome !== 'error' || !INGEST_REASONS.has(record.reason) || !Number.isInteger(record.status)) { ignored += 1; continue; }
    inc(ingest, `${release}\t${record.reason}\t${record.status}`);
    accepted += 1;
  }
}

console.log('# Akher Kheit observability summary');
console.log(`accepted=${accepted} ignored=${ignored} mode=${args.all ? 'all' : 'failures-only'}${args.release ? ` release=${args.release}` : ''}`);
console.log('\n## Gameplay');
console.log('release\tevent\toutcome\terrorClass\tcount');
for (const [key, count] of sortEntries(gameplay)) console.log(`${key}\t${count}`);
console.log('\n## Telemetry ingest');
console.log('release\treason\tstatus\tcount');
for (const [key, count] of sortEntries(ingest)) console.log(`${key}\t${count}`);
