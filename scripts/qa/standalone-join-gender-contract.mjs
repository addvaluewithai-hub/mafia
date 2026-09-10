import assert from 'node:assert/strict';
import fs from 'node:fs';

const join = fs.readFileSync('app/join.tsx', 'utf8');

assert(join.includes("import { GenderPicker } from '@/components/gender-picker';"), 'Standalone join screen must import GenderPicker');
assert(join.includes('useState<PlayerGender | null>(null)'), 'Standalone join screen must track selected gender');
assert(join.includes('<GenderPicker value={gender} onChange={setGender} />'), 'Standalone join screen must render gender picker');
assert(join.includes('joinRoom(normalized, nickname, gender)'), 'Standalone join screen must pass gender to joinRoom');
assert(join.includes("if (!gender)"), 'Standalone join screen must block submit until gender is selected');

console.log('QA standalone join gender contract: /join requires and submits gender.');
