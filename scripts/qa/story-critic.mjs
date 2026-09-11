import fs from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('qa/reports');
fs.mkdirSync(reportDir, { recursive: true });
const storyDir = path.resolve('lib/server-stories');
const files = fs.readdirSync(storyDir).filter((name) => name.endsWith('.ts') && name !== 'index.ts').sort();

const jargon = [
  'ريلاي', 'لسان قفل', 'تحليل الغبار', 'بصمة دخول', 'ميكانيزم', 'معايرة', 'سجل ريلاي',
  'اهتزاز', 'كونسول', 'checksum', 'metadata', 'RFID', 'بروتوكول', 'فورينزك',
];
const stiffPhrases = ['الفحص بيشير', 'يثبت إن', 'مطابق لـ', 'المرحلة الأولى', 'المرحلة الثانية', 'تحليل'];
const decisivePhrases = ['يثبت إنه', 'يثبت إنها', 'ده يثبت', 'ده يحدد', 'يحدد مين', 'يحدد الشخص'];

function countMatches(text, terms) {
  return terms.reduce((n, term) => n + (text.split(term).length - 1), 0);
}

function extractQuotedValues(source, key) {
  const regex = new RegExp(`${key}\\s*:\\s*'([^']*)'`, 'g');
  return [...source.matchAll(regex)].map((m) => m[1]);
}

function extractNumberArray(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`));
  if (!match) return [];
  return match[1].split(',').map((value) => value.trim()).filter(Boolean).map(Number);
}

function countObjectKey(source, key) {
  return [...source.matchAll(new RegExp(`${key}\\s*:`, 'g'))].length;
}

const stories = files.map((file) => {
  const source = fs.readFileSync(path.join(storyDir, file), 'utf8');
  const title = extractQuotedValues(source, 'title')[0] ?? file;
  const premise = extractQuotedValues(source, 'premise')[0] ?? '';
  const clues = extractQuotedValues(source, 'clue');
  const bios = extractQuotedValues(source, 'bio');
  const roles = extractQuotedValues(source, 'role');
  const names = extractQuotedValues(source, 'name');
  const prompts = extractQuotedValues(source, 'discussionPrompt');
  const solution = extractQuotedValues(source, 'solution')[0] ?? '';
  const mafiaCharacterIndexes = extractNumberArray(source, 'mafiaCharacterIndexes');
  const roleByGenderCount = countObjectKey(source, 'roleByGender');
  const bioByGenderCount = countObjectKey(source, 'bioByGender');
  const identities = roles.length ? roles : names;
  const mafiaIdentities = mafiaCharacterIndexes.map((index) => identities[index]).filter(Boolean);
  const nonMafiaIdentities = identities.filter((_, index) => !mafiaCharacterIndexes.includes(index));

  const publicText = [premise, ...bios, ...clues, ...prompts].join(' ');
  const jargonHits = countMatches(publicText, jargon);
  const stiffHits = countMatches(publicText, stiffPhrases);
  const longClues = clues.filter((clue) => clue.length > 430).length;
  const longBios = bios.filter((bio) => bio.length > 250).length;
  const clueCountOk = clues.length === 4;
  const score = Math.max(0, 10 - jargonHits * 0.6 - stiffHits * 0.25 - longClues * 0.5 - longBios * 0.25 - (clueCountOk ? 0 : 3));

  const issues = [];
  if (jargonHits) issues.push(`${jargonHits} technical/jargon hit(s) make comprehension harder than deduction`);
  if (stiffHits >= 3) issues.push(`${stiffHits} formal/stiff phrases; rewrite for spoken Egyptian Arabic`);
  if (longClues) issues.push(`${longClues} clue(s) are too dense for a live social game`);
  if (longBios) issues.push(`${longBios} bio(s) are too long`);
  if (!clueCountOk) issues.push(`expected 4 clues, found ${clues.length}`);
  if (!solution) issues.push('solution missing or parser could not find it');

  const integrityErrors = [];
  if (!identities.length) integrityErrors.push('no character roles parsed');
  if (names.length) integrityErrors.push(`legacy fictional name contract still present (${names.length} name fields)`);
  if (roles.length !== identities.length) integrityErrors.push(`semantic role coverage ${roles.length}/${identities.length}`);
  if (bios.length !== identities.length) integrityErrors.push(`neutral bio coverage ${bios.length}/${identities.length}`);
  if (roleByGenderCount !== identities.length) integrityErrors.push(`roleByGender coverage ${roleByGenderCount}/${identities.length}`);
  if (bioByGenderCount !== identities.length) integrityErrors.push(`bioByGender coverage ${bioByGenderCount}/${identities.length}`);
  if (!mafiaCharacterIndexes.length) integrityErrors.push('no mafiaCharacterIndexes parsed');
  for (const index of mafiaCharacterIndexes) {
    if (!Number.isInteger(index) || index < 0 || index >= identities.length) integrityErrors.push(`mafiaCharacterIndexes contains invalid index ${index}`);
  }
  if (!clues.length) integrityErrors.push('no clues parsed');

  const clueMatrix = clues.map((clue, clueIndex) => {
    const mentioned = identities.filter((identity) => clue.includes(identity));
    const mafiaMentioned = mentioned.filter((identity) => mafiaIdentities.includes(identity));
    const nonMafiaMentioned = mentioned.filter((identity) => nonMafiaIdentities.includes(identity));
    const exclusive = mentioned.length === 1 ? mentioned[0] : null;
    const isFinalClue = clueIndex === clues.length - 1;
    const decisiveLanguageHits = decisivePhrases.filter((phrase) => clue.includes(phrase));
    const earlyExclusiveMafia = Boolean(!isFinalClue && exclusive && mafiaIdentities.includes(exclusive));
    const earlyDecisiveMafia = Boolean(!isFinalClue && mafiaMentioned.length > 0 && nonMafiaMentioned.length === 0 && decisiveLanguageHits.length > 0);
    return {
      round: clueIndex + 1,
      mentionedRoles: mentioned,
      mafiaMentionedRoles: mafiaMentioned,
      nonMafiaMentionedRoles: nonMafiaMentioned,
      exclusiveRole: exclusive,
      decisiveLanguageHits,
      warnings: [
        ...(earlyExclusiveMafia ? ['early-exclusive-mafia-mention'] : []),
        ...(earlyDecisiveMafia ? ['early-decisive-mafia-language'] : []),
        ...(mentioned.length === 0 ? ['no-explicit-role-mention'] : []),
      ],
      mentionMatrix: Object.fromEntries(identities.map((identity) => [identity, clue.includes(identity)])),
    };
  });

  const mentionCounts = Object.fromEntries(identities.map((identity) => [identity, clueMatrix.filter((row) => row.mentionedRoles.includes(identity)).length]));
  const unmentionedRoles = identities.filter((identity) => mentionCounts[identity] === 0);
  const earlyRevealWarnings = clueMatrix.flatMap((row) => row.warnings.filter((warning) => warning.startsWith('early-')).map((warning) => ({ round: row.round, warning })));

  return {
    file,
    title,
    score: Number(score.toFixed(1)),
    metrics: { playerCount: identities.length, mafiaCount: mafiaCharacterIndexes.length, jargonHits, stiffHits, longClues, longBios, clues: clues.length, bios: bios.length, roles: roles.length, legacyNames: names.length, roleByGender: roleByGenderCount, bioByGender: bioByGenderCount },
    issues,
    integrityErrors,
    fairnessBaseline: {
      method: 'lexical semantic-role mentions per clue; deterministic baseline, not semantic guilt scoring',
      mafiaCharacterIndexes,
      mafiaRoles: mafiaIdentities,
      nonMafiaRoles: nonMafiaIdentities,
      clueMatrix,
      mentionCounts,
      unmentionedRoles,
      earlyRevealWarnings,
      identityWarnings: integrityErrors.filter((error) => error.includes('role') || error.includes('name') || error.includes('bio')),
    },
  };
});

const average = stories.reduce((sum, story) => sum + story.score, 0) / Math.max(1, stories.length);
const integrityErrors = stories.flatMap((story) => story.integrityErrors.map((error) => `${story.file}: ${error}`));
const playerCountCoverage = [...new Set(stories.map((story) => story.metrics.playerCount))].sort((a, b) => a - b);
const baseline = {
  generatedBy: 'scripts/qa/story-critic.mjs',
  storyCount: stories.length,
  playerCountCoverage,
  totalEarlyRevealWarnings: stories.reduce((sum, story) => sum + story.fairnessBaseline.earlyRevealWarnings.length, 0),
  stories: stories.map((story) => ({ file: story.file, title: story.title, playerCount: story.metrics.playerCount, mafiaCount: story.metrics.mafiaCount, identityWarnings: story.fairnessBaseline.identityWarnings, mentionCounts: story.fairnessBaseline.mentionCounts, unmentionedRoles: story.fairnessBaseline.unmentionedRoles, earlyRevealWarnings: story.fairnessBaseline.earlyRevealWarnings, clueMatrix: story.fairnessBaseline.clueMatrix })),
};

const report = {
  ok: stories.every((story) => story.score >= 8),
  strict: process.env.STRICT_STORY_QA === '1',
  averageScore: Number(average.toFixed(1)),
  threshold: 8,
  integrityOk: integrityErrors.length === 0,
  integrityErrors,
  playerCountCoverage,
  note: 'Language score is heuristic. fairnessBaseline uses semantic-role lexical evidence and does not replace semantic/human logic criticism.',
  stories,
};

fs.writeFileSync(path.join(reportDir, 'story-critic.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(reportDir, 'story-fairness-baseline.json'), JSON.stringify(baseline, null, 2));
for (const story of stories) {
  const icon = story.score >= 8 ? 'PASS' : 'REWRITE';
  console.log(`${icon} ${story.title}: ${story.score}/10 — players=${story.metrics.playerCount}, mafia=${story.metrics.mafiaCount}, earlyFairnessWarnings=${story.fairnessBaseline.earlyRevealWarnings.length}${story.issues.length ? ` — ${story.issues.join('; ')}` : ''}`);
}
console.log(`Story critic average: ${report.averageScore}/10`);
console.log(`Story fairness baseline: ${stories.length} stories; player counts ${playerCountCoverage.join('/')}; early warnings ${baseline.totalEarlyRevealWarnings}`);
if (!report.integrityOk) {
  console.error(`Story baseline integrity failed: ${integrityErrors.join('; ')}`);
  process.exit(1);
}
if (report.strict && !report.ok) process.exit(1);
