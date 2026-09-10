import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/room/[code].tsx', 'utf8');

assert.match(source, /const votePhaseOpen = snapshot\.phase === 'voting';/, 'vote UI must use server-authoritative phase');
assert.match(source, /if \(!selectedVote \|\| !snapshot\.canVote\) return;/, 'submitVote must guard with server-authoritative canVote');
assert.match(source, /disabled=\{!snapshot\.canVote\}/, 'vote targets must disable from canVote');
assert.match(source, /disabled=\{!selectedVote \|\| !snapshot\.canVote\}/, 'vote submit button must disable from canVote');
assert.match(source, /snapshot\.phase === 'round_resolved'/, 'Boss reveal control must use round_resolved phase');
assert.match(source, /snapshot\.voteSubmitted \? 'صوتك اتحسب' : 'ثبّت صوتي'/, 'submitted vote state must remain visible');

assert.doesNotMatch(source, /safeLastResolvedRound/, 'UI must not restore defensive counter-derived vote phase');
assert.doesNotMatch(source, /const voteOpen\s*=/, 'UI must not derive voteOpen locally');
assert.doesNotMatch(source, /lastResolvedRound\s*</, 'UI must not infer voting from round counters');

console.log('QA vote UI contract: authoritative phase/canVote wiring passed.');
