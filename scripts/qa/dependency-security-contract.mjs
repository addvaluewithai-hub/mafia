import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const baselinePath = new URL('../../qa/reports/npm-audit-baseline.json', import.meta.url);
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const baselineNames = new Set((baseline.vulnerabilities ?? []).map((item) => item.name));
const baselineCounts = baseline.metadata?.vulnerabilities ?? {};

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

if (!audit.stdout.trim()) {
  console.error(audit.stderr || 'npm audit returned no JSON output');
  process.exit(1);
}

let current;
try {
  current = JSON.parse(audit.stdout);
} catch (error) {
  console.error('Could not parse npm audit JSON:', error);
  process.exit(1);
}

const counts = current.metadata?.vulnerabilities ?? {};
const vulnerabilities = Object.entries(current.vulnerabilities ?? {}).map(([name, detail]) => ({
  name,
  severity: detail.severity,
}));

const failures = [];
if ((counts.high ?? 0) > 0 || (counts.critical ?? 0) > 0) {
  failures.push(`high/critical vulnerabilities present: high=${counts.high ?? 0}, critical=${counts.critical ?? 0}`);
}

const newNames = vulnerabilities
  .filter((item) => !baselineNames.has(item.name))
  .map((item) => `${item.name}(${item.severity})`)
  .sort();
if (newNames.length > 0) {
  failures.push(`new vulnerability names outside the reviewed baseline: ${newNames.join(', ')}`);
}

if ((counts.moderate ?? 0) > (baselineCounts.moderate ?? 0)) {
  failures.push(`moderate vulnerability count regressed: ${counts.moderate ?? 0} > baseline ${baselineCounts.moderate ?? 0}`);
}

const removedNames = [...baselineNames]
  .filter((name) => !vulnerabilities.some((item) => item.name === name))
  .sort();

const summary = {
  baseline: {
    moderate: baselineCounts.moderate ?? 0,
    high: baselineCounts.high ?? 0,
    critical: baselineCounts.critical ?? 0,
    vulnerabilityNames: [...baselineNames].sort(),
  },
  current: {
    moderate: counts.moderate ?? 0,
    high: counts.high ?? 0,
    critical: counts.critical ?? 0,
    total: counts.total ?? vulnerabilities.length,
    vulnerabilityNames: vulnerabilities.map((item) => item.name).sort(),
  },
  improvements: {
    removedBaselineNames: removedNames,
    moderateCountReducedBy: Math.max(0, (baselineCounts.moderate ?? 0) - (counts.moderate ?? 0)),
  },
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  for (const failure of failures) console.error(`Dependency security contract failed: ${failure}`);
  process.exit(1);
}

console.log('Dependency security contract passed: no high/critical findings and no unreviewed audit regression.');
