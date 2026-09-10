import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

import { BLUE_NOTEBOOK } from '../lib/server-stories/blue-notebook';
import { CLOCK_1117 } from '../lib/server-stories/clock-1117';
import { FOURTH_FLOOR } from '../lib/server-stories/fourth-floor';
import { LAST_REHEARSAL } from '../lib/server-stories/last-rehearsal';
import { ROOM_312 } from '../lib/server-stories/room-312';
import { SILENT_AUCTION } from '../lib/server-stories/silent-auction';
import type { GeneratedCase } from '../lib/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://bwxgzcppxdrfcaorobpm.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_76VPHfV-oe9rexR8B80Vkw_M0LhqckV';

const CASES = {
  'clock-1117': { playerCount: 5, case: CLOCK_1117 },
  'room-312': { playerCount: 5, case: ROOM_312 },
  'last-rehearsal': { playerCount: 6, case: LAST_REHEARSAL },
  'blue-notebook': { playerCount: 6, case: BLUE_NOTEBOOK },
  'fourth-floor': { playerCount: 7, case: FOURTH_FLOOR },
  'silent-auction': { playerCount: 7, case: SILENT_AUCTION },
} as const;

function mafiaCountFor(count: number) {
  if (count >= 10) return 3;
  if (count >= 6) return 2;
  return 1;
}

function parseBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) return String((error as any).message);
  try { return JSON.stringify(error); } catch { return 'Unknown error'; }
}

function parseJson(raw: string) {
  return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
}

function hasGenderText(value: any, minLength: number) {
  return value
    && typeof value === 'object'
    && typeof value.male === 'string'
    && value.male.length >= minLength
    && typeof value.female === 'string'
    && value.female.length >= minLength;
}

function validateCase(value: any, playerCount: number, mafiaCount: number, requireGenderVariants = false): GeneratedCase {
  if (!value || typeof value !== 'object') throw new Error('القضية الناتجة مش JSON صحيح.');
  if (typeof value.title !== 'string' || typeof value.premise !== 'string' || typeof value.solution !== 'string') throw new Error('القضية ناقصها نصوص أساسية.');
  if (!Array.isArray(value.characters) || value.characters.length !== playerCount) throw new Error('عدد الشخصيات غير صحيح.');
  if (!Array.isArray(value.mafiaCharacterIndexes) || value.mafiaCharacterIndexes.length !== mafiaCount) throw new Error('عدد المافيا غير صحيح.');
  if (new Set(value.mafiaCharacterIndexes).size !== mafiaCount) throw new Error('أدوار المافيا مكررة.');
  if (!Array.isArray(value.rounds) || value.rounds.length !== 4) throw new Error('القضية لازم يكون فيها 4 أدلة.');
  for (const character of value.characters) {
    const hasCaseIdentity = typeof character?.role === 'string' || typeof character?.name === 'string';
    if (!hasCaseIdentity || typeof character?.bio !== 'string' || character.bio.length < 30) throw new Error('في شخصية بياناتها ناقصة.');
    if (requireGenderVariants) {
      if (typeof character.role !== 'string' || !hasGenderText(character.roleByGender, 2) || !hasGenderText(character.bioByGender, 30)) {
        throw new Error('في شخصية ناقصها صياغة male/female لنفس الدور.');
      }
    }
  }
  for (const round of value.rounds) {
    if (typeof round?.clue !== 'string' || round.clue.length < 30 || typeof round?.discussionPrompt !== 'string') throw new Error('في دليل ناقص.');
  }
  return value as GeneratedCase;
}

function referenceCases(playerCount: number) {
  const entries = Object.entries(CASES);
  const matching = entries.filter(([, item]) => item.playerCount === playerCount);
  const fallbackCount = playerCount <= 5 ? 5 : 7;
  const picked = matching.length ? matching : entries.filter(([, item]) => item.playerCount === fallbackCount).slice(0, 2);
  return picked.map(([id, item]) => ({
    id,
    playerCount: item.playerCount,
    ...item.case,
    characters: item.case.characters.map((character) => ({ bio: character.bio })),
  }));
}

function genderTextJsonSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['male', 'female'],
    properties: { male: { type: 'string' }, female: { type: 'string' } },
  };
}

function jsonSchema(playerCount: number, mafiaCount: number) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'premise', 'crime', 'characters', 'mafiaCharacterIndexes', 'rounds', 'solution'],
    properties: {
      title: { type: 'string' }, premise: { type: 'string' }, crime: { type: 'string' }, solution: { type: 'string' },
      characters: {
        type: 'array', minItems: playerCount, maxItems: playerCount,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['role', 'bio', 'roleByGender', 'bioByGender'],
          properties: {
            role: { type: 'string' },
            bio: { type: 'string' },
            roleByGender: genderTextJsonSchema(),
            bioByGender: genderTextJsonSchema(),
          },
        },
      },
      mafiaCharacterIndexes: { type: 'array', minItems: mafiaCount, maxItems: mafiaCount, items: { type: 'integer', minimum: 0, maximum: playerCount - 1 } },
      rounds: {
        type: 'array', minItems: 4, maxItems: 4,
        items: { type: 'object', additionalProperties: false, required: ['clue', 'discussionPrompt'], properties: { clue: { type: 'string' }, discussionPrompt: { type: 'string' } } },
      },
    },
  };
}

function buildPrompt(input: { playerCount: number; mafiaCount: number; theme: string; difficulty: string }) {
  const difficulty = input.difficulty === 'hard'
    ? 'صعب جدًا: كل مافيوزو يحتاج ربط 3 أدلة على الأقل قبل ما يبقى الاتهام منطقيًا.'
    : input.difficulty === 'easy'
      ? 'أسهل نسبيًا، لكن ممنوع أي دليل منفرد يكشف المجرم أو يجعل الحل بديهيًا قبل الدليل الثالث.'
      : 'متوسط مائل للصعوبة: كل دليل يفتح أكثر من تفسير والحل يظهر من تقاطع الأدلة.';

  return `أنت كاتب لعبة تحقيق اجتماعية أصلية باللهجة المصرية الطبيعية.
عدد اللاعبين: ${input.playerCount}. عدد المافيوزو: ${input.mafiaCount}. الجو: ${input.theme}. الصعوبة: ${difficulty}

الهدف الأهم: القضية لازم تكون صعبة وعادلة، مش متوقعة. اللاعب الذكي يقدر يبني نظرية غلط قوية في أول جولتين، وبعدها الاحتمالات تضيق بتقاطع الأدلة.

قواعد إلزامية:
- هوية كل لاعب هي الـnickname الحقيقي بتاعه. ممنوع اختراع اسم شخصية بديل.
- كل عنصر في characters يحتوي role وصفي قصير وbio كـfallback محايد، ومعهم roleByGender وbioByGender وكل واحد لازم يحتوي male وfemale.
- صياغتا male وfemale لنفس character لازم يكونوا نفس الدور الدلالي ونفس الحقائق والدافع والفرصة ودرجة الاشتباه؛ الاختلاف فقط في التذكير والتأنيث وصياغة المصري الطبيعي.
- ممنوع تغيير أو إضافة معلومة حسب الجنس، وممنوع استخدام gender في اختيار mafiaCharacterIndexes؛ توزيع المافيا مستقل تمامًا عن الصياغة.
- ممنوع name. الـrole يرتبط بصاحب الـnickname بدل ما يستبدله.
- الـbio علني بالكامل، والسر الوحيد للاعب هو Mafia أو Innocent.
- كل role عنده دافع أو فرصة أو تفصيلة مريبة حقيقية.
- كل أثر اتهام مهم في أول 3 جولات لازم يكون له تفسير بريء معقول لشخص آخر على الأقل.
- الدليل الأول يورط 3 لاعبين أو أكثر.
- بعد الدليل الثاني يظل أكثر من حل معقول، ولا يتحدد أي مافيوزو منفردًا.
- الدليل الثالث يسمح بنظريتين قويتين متعارضتين.
- الدليل الرابع يثبت قطعة من السلسلة فقط؛ لا يكفي وحده من غير الأدلة السابقة.
- كل مافيوزو يحتاج 3 أدلة على الأقل لبناء حجة كاملة ضده.
- استخدم تقاطع مجموعات مشتبهين، اختلاف التوقيت، آثار لها أكثر من مصدر، أو جريمة متعددة المراحل. ممنوع clue سحري.
- لو فيه أكثر من مافيوزو، هم لا يعرفون بعضهم. اجعل أفعالهم مستقلة ومنطقية: واحد يصنع فرصة والآخر يستغلها أو كل واحد يعمل مرحلة منفصلة.
- الحل النهائي يشرح كل خطوة ويشرح الـred herrings.
- عائلية وآمنة، بلا تفاصيل دموية أو جنسية أو مخدرات.
- premise افتتاحية من غير spoilers. discussionPrompt سؤال للنقاش من غير تلميح للحل.
- JSON خام فقط بلا Markdown.

دي قضايا مرجعية معمولة يدويًا. اتعلم منها هندسة الصعوبة والتدرج فقط، وممنوع نسخ المكان أو الشيء محل الجريمة أو التوقيت أو نفس الحل أو صياغة الأدلة. أسماء الشخصيات القديمة متشالة عمدًا لأن الـnickname الحقيقي هو الهوية:
${JSON.stringify(referenceCases(input.playerCount))}

راجع داخليًا قبل الإجابة: هل كل character فيه role وbio وroleByGender وbioByGender بدون name؟ هل male/female متطابقين في المعنى والحقائق؟ هل أول دليل يورط 3؟ هل بعد الثاني فيه نظرية بريئة قوية؟ هل كل مافيوزو يحتاج 3 أدلة؟ هل الرابع وحده غير كافٍ؟ لو لأ، أعد التصميم.
أرجع JSON مطابق للـschema فقط.`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = parseBody(req);
    const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
    const header = String(req.headers.authorization ?? '');
    const token = header.replace(/^Bearer\s+/i, '').trim() || String(body.sessionToken ?? '').trim();
    if (!roomCode) return res.status(400).json({ error: 'كود الروم ناقص.' });
    if (!token) return res.status(401).json({ error: 'جلسة الـBoss مش واصلة للسيرفر.' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: snapshot, error: snapshotError } = await supabase.rpc('room_snapshot', { p_code: roomCode });
    if (snapshotError || !snapshot) return res.status(404).json({ error: errorMessage(snapshotError ?? 'الروم مش موجود') });
    if (!snapshot.isHost) return res.status(403).json({ error: 'الـBoss فقط يقدر يبدأ القضية.' });
    if (snapshot.room.status !== 'lobby') return res.status(409).json({ error: 'القضية بدأت بالفعل.' });

    const playerCount = Number(snapshot.playerCount);
    if (playerCount < 4 || playerCount > 12) return res.status(400).json({ error: 'عدد اللاعبين لازم يكون من 4 لـ12.' });
    const mafiaCount = mafiaCountFor(playerCount);

    if (snapshot.room.caseMode === 'preset') {
      const id = String(snapshot.room.storyTemplateId ?? '') as keyof typeof CASES;
      const selected = CASES[id];
      if (!selected) return res.status(400).json({ error: 'القضية الجاهزة المختارة مش موجودة.' });
      if (selected.playerCount !== playerCount) return res.status(409).json({ error: `القضية دي معمولة لـ${selected.playerCount} لاعبين، والموجودين ${playerCount}.` });
      const curated = validateCase(selected.case, playerCount, mafiaCount);
      const { error } = await supabase.rpc('install_case', { p_code: roomCode, p_case: curated });
      if (error) return res.status(500).json({ error: errorMessage(error) });
      return res.status(200).json({ ok: true, source: 'preset', model: 'قضية جاهزة', storyTitle: curated.title });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY مش متسجل على السيرفر لسه.' });

    const models = (process.env.GEMINI_MODELS ?? 'gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-31b-it,gemma-4-26b-a4b-it')
      .split(',').map((x) => x.trim()).filter(Boolean);
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = buildPrompt({ playerCount, mafiaCount, theme: snapshot.room.theme, difficulty: snapshot.room.difficulty });
    let generated: GeneratedCase | null = null;
    let usedModel = '';
    let lastError = '';

    for (const model of models) {
      try {
        const isGemini = model.startsWith('gemini-');
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: isGemini
            ? { responseMimeType: 'application/json', responseJsonSchema: jsonSchema(playerCount, mafiaCount), maxOutputTokens: 8192, temperature: 0.92 }
            : { maxOutputTokens: 8192, temperature: 0.92 },
        });
        if (!response.text) throw new Error('Model returned empty response');
        generated = validateCase(parseJson(response.text), playerCount, mafiaCount, true);
        usedModel = model;
        break;
      } catch (error) {
        lastError = `${model}: ${errorMessage(error)}`;
        console.warn('case model failed:', lastError);
      }
    }

    if (!generated) return res.status(503).json({ error: `موديلات التوليد مش متاحة مؤقتًا. ${lastError}` });
    const { error: installError } = await supabase.rpc('install_case', { p_code: roomCode, p_case: generated });
    if (installError) return res.status(500).json({ error: errorMessage(installError) });
    return res.status(200).json({ ok: true, source: 'ai', model: usedModel });
  } catch (error) {
    console.error('case-start fatal:', errorMessage(error));
    return res.status(500).json({ error: errorMessage(error) });
  }
}
