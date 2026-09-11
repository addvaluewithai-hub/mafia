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
  return match[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value));
}

function countObjectKey(source, key) {
  return [...source.matchAll(new RegExp(`${key}\\s*:`, 'g'))].length;
}

const stories = files.map((file) => {
  const source = fs.readFileSync(path.join(storyDir, file), 'utf8');
  const titles = extractQuotedValues(source, 'title');
  const premise = extractQuotedValues(source, 'premise')[0] ?? '';
  const clues = extractQuotedValues(source, 'clue');
  const bios = extractQuotedValues(source, 'bio');
  const roles = extractQuotedValues(source, 'role');
  const names = extractQuotedValues(source, 'name');
  const prompts = extractQuotedValues(source, 'discussionPrompt');
  const solution = extractQuotedValues(source, 'solution')[0] ?? '';
  const mafiaCharacterIndexes = extractNumberArray(source, 'mafiaCharacterIndexes');
  const mafiaNames = mafiaCharacterIndexes.map((index) => names[index]).filter(Boolean);
  const nonMafiaNames = names.filter((_, index) => !mafiaCharacterIndexes.includes(index));
  const roleByGenderCount = countObjectKey(source, 'roleByGender');
  const bioByGenderCount = countObjectKey(source, 'bioByGender');
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
  if (!names.length) integrityErrors.push('no character names parsed');
  if (!mafiaCharacterIndexes.length) integrityErrors.push('no mafiaCharacterIndexes parsed');
  for (const index of mafiaCharacterIndexes) {
    if (!Number.isInteger(index) || index < 0 || index >= names.length) {
      integrityErrors.push(`mafiaCharacterIndexes contains invalid index ${index}`);
    }
  }
  if (!clues.length) integrityErrors.push('no clues parsed');

  const clueMatrix = clues.map((clue, clueIndex) => {
    const namedSuspects = names.filter((name) => clue.includes(name));
    const mafiaNamedSuspects = namedSuspects.filter((name) => mafiaNames.includes(name));
    const nonMafiaNamedSuspects = namedSuspects.filter((name) => nonMafiaNames.includes(name));
    const exclusiveNamedSuspect = namedSuspects.length === 1 ? namedSuspects[0] : null;
    const isFinalClue = clueIndex === clues.length - 1;
    const decisiveLanguageHits = decisivePhrases.filter((phrase) => clue.includes(phrase));
    const earlyExclusiveMafia = Boolean(
      !isFinalClue &&
      exclusiveNamedSuspect &&
      mafiaNames.includes(exclusiveNamedSuspect)
    );
    const earlyDecisiveMafia = Boolean(
      !isFinalClue &&
      mafiaNamedSuspects.length > 0 &&
      nonMafiaNamedSuspects.length === 0 &&
      decisiveLanguageHits.length > 0
    );

    return {
      round: clueIndex + 1,
      namedSuspects,
      mafiaNamedSuspects,
      nonMafiaNamedSuspects,
      exclusiveNamedSuspect,
      decisiveLanguageHits,
      warnings: [
        ...(earlyExclusiveMafia ? ['early-exclusive-mafia-mention'] : []),
        ...(earlyDecisiveMafia ? ['early-decisive-mafia-language'] : []),
        ...(namedSuspects.length === 0 ? ['no-explicit-suspect-mention'] : []),
      ],
      mentionMatrix: Object.fromEntries(names.map((name) => [name, clue.includes(name)])),
    };
  });

  const mentionCounts = Object.fromEntries(
    names.map((name) => [name, clueMatrix.filter((row) => row.namedSuspects.includes(name)).length])
  );
  const unmentionedSuspects = names.filter((name) => mentionCounts[name] === 0);
  const earlyRevealWarnings = clueMatrix.flatMap((row) =>
    row.warnings
      .filter((warning) => warning.startsWith('early-'))
      .map((warning) => ({ round: row.round, warning }))
  );
  const identityWarnings = [
    ...(roles.length < names.length ? ['legacy-fictional-name-contract'] : []),
    ...(roleByGenderCount < names.length ? ['missing-roleByGender-coverage'] : []),
    ...(bioByGenderCount < names.length ? ['missing-bioByGender-coverage'] : []),
  ];

  return {
    file,
    title: titles[0] ?? file,
    score: Number(score.toFixed(1)),
    metrics: {
      playerCount: names.length,
      mafiaCount: mafiaCharacterIndexes.length,
      jargonHits,
      stiffHits,
      longClues,
      longBios,
      clues: clues.length,
      bios: bios.length,
      roles: roles.length,
      roleByGender: roleByGenderCount,
      bioByGender: bioByGenderCount,
    },
    issues,
    integrityErrors,
    fairnessBaseline: {
      method: 'lexical character-name mentions per clue; deterministic baseline, not semantic guilt scoring',
      mafiaCharacterIndexes,
      mafiaNames,
      nonMafiaNames,
      clueMatrix,
      mentionCounts,
      unmentionedSuspects,
      earlyRevealWarnings,
      identityWarnings,
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
  stories: stories.map((story) => ({
    file: story.file,
    title: story.title,
    playerCount: story.metrics.playerCount,
    mafiaCount: story.metrics.mafiaCount,
    identityWarnings: story.fairnessBaseline.identityWarnings,
    mentionCounts: story.fairnessBaseline.mentionCounts,
    unmentionedSuspects: story.fairnessBaseline.unmentionedSuspects,
    earlyRevealWarnings: story.fairnessBaseline.earlyRevealWarnings,
    clueMatrix: story.fairnessBaseline.clueMatrix,
  })),
};

const report = {
  ok: stories.every((story) => story.score >= 8),
  strict: process.env.STRICT_STORY_QA === '1',
  averageScore: Number(average.toFixed(1)),
  threshold: 8,
  integrityOk: integrityErrors.length === 0,
  integrityErrors,
  playerCountCoverage,
  note: 'Language score is heuristic. fairnessBaseline is deterministic lexical evidence inventory and does not replace semantic/human logic criticism.',
  stories,
};
fs.writeFileSync(path.join(reportDir, 'story-critic.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(reportDir, 'story-fairness-baseline.json'), JSON.stringify(baseline, null, 2));

for (const story of stories) {
  const icon = story.score >= 8 ? 'PASS' : 'REWRITE';
  const fairnessWarnings = story.fairnessBaseline.earlyRevealWarnings.length;
  console.log(`${icon} ${story.title}: ${story.score}/10 — players=${story.metrics.playerCount}, mafia=${story.metrics.mafiaCount}, earlyFairnessWarnings=${fairnessWarnings}${story.issues.length ? ` — ${story.issues.join('; ')}` : ''}`);
}
console.log(`Story critic average: ${report.averageScore}/10`);
console.log(`Story fairness baseline: ${stories.length} stories; player counts ${playerCountCoverage.join('/')}; early warnings ${baseline.totalEarlyRevealWarnings}`);
if (!report.integrityOk) {
  console.error(`Story baseline integrity failed: ${integrityErrors.join('; ')}`);
  process.exit(1);
}
if (report.strict && !report.ok) process.exit(1);
