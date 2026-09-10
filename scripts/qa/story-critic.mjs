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

function countMatches(text, terms) {
  return terms.reduce((n, term) => n + (text.split(term).length - 1), 0);
}

function extractQuotedValues(source, key) {
  const regex = new RegExp(`${key}\\s*:\\s*'([^']*)'`, 'g');
  return [...source.matchAll(regex)].map((m) => m[1]);
}

const stories = files.map((file) => {
  const source = fs.readFileSync(path.join(storyDir, file), 'utf8');
  const titles = extractQuotedValues(source, 'title');
  const premise = extractQuotedValues(source, 'premise')[0] ?? '';
  const clues = extractQuotedValues(source, 'clue');
  const bios = extractQuotedValues(source, 'bio');
  const prompts = extractQuotedValues(source, 'discussionPrompt');
  const solution = extractQuotedValues(source, 'solution')[0] ?? '';
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

  return {
    file,
    title: titles[0] ?? file,
    score: Number(score.toFixed(1)),
    metrics: { jargonHits, stiffHits, longClues, longBios, clues: clues.length, bios: bios.length },
    issues,
  };
});

const average = stories.reduce((sum, story) => sum + story.score, 0) / Math.max(1, stories.length);
const report = {
  ok: stories.every((s) => s.score >= 8),
  strict: process.env.STRICT_STORY_QA === '1',
  averageScore: Number(average.toFixed(1)),
  threshold: 8,
  note: 'This heuristic critic measures language burden and structural basics. It does not replace human/LLM logic criticism.',
  stories,
};
fs.writeFileSync(path.join(reportDir, 'story-critic.json'), JSON.stringify(report, null, 2));

for (const story of stories) {
  const icon = story.score >= 8 ? 'PASS' : 'REWRITE';
  console.log(`${icon} ${story.title}: ${story.score}/10${story.issues.length ? ` — ${story.issues.join('; ')}` : ''}`);
}
console.log(`Story critic average: ${report.averageScore}/10`);
if (report.strict && !report.ok) process.exit(1);
