import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const DEFAULT_SUPABASE_URL = 'https://bwxgzcppxdrfcaorobpm.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_76VPHfV-oe9rexR8B80Vkw_M0LhqckV';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}

function mafiaCountFor(playerCount: number) {
  if (playerCount >= 10) return 3;
  if (playerCount >= 6) return 2;
  return 1;
}

function schemaFor(playerCount: number, mafiaCount: number) {
  return z
    .object({
      title: z.string().min(3).max(80),
      premise: z.string().min(80).max(1100),
      crime: z.string().min(10).max(180),
      characters: z
        .array(
          z.object({
            name: z.string().min(2).max(45),
            bio: z.string().min(30).max(330),
          }),
        )
        .length(playerCount),
      mafiaCharacterIndexes: z
        .array(z.number().int().min(0).max(playerCount - 1))
        .length(mafiaCount),
      rounds: z
        .array(
          z.object({
            clue: z.string().min(30).max(650),
            discussionPrompt: z.string().min(10).max(220),
          }),
        )
        .length(4),
      solution: z.string().min(100).max(1600),
    })
    .superRefine((value, context) => {
      if (new Set(value.mafiaCharacterIndexes).size !== mafiaCount) {
        context.addIssue({ code: 'custom', message: 'mafia indexes must be unique' });
      }
      const names = value.characters.map((item) => item.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        context.addIssue({ code: 'custom', message: 'character names must be unique' });
      }
    });
}

function jsonSchema(playerCount: number, mafiaCount: number) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'premise', 'crime', 'characters', 'mafiaCharacterIndexes', 'rounds', 'solution'],
    properties: {
      title: { type: 'string' },
      premise: { type: 'string' },
      crime: { type: 'string' },
      characters: {
        type: 'array',
        minItems: playerCount,
        maxItems: playerCount,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'bio'],
          properties: {
            name: { type: 'string' },
            bio: { type: 'string' },
          },
        },
      },
      mafiaCharacterIndexes: {
        type: 'array',
        minItems: mafiaCount,
        maxItems: mafiaCount,
        items: { type: 'integer', minimum: 0, maximum: playerCount - 1 },
      },
      rounds: {
        type: 'array',
        minItems: 4,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['clue', 'discussionPrompt'],
          properties: {
            clue: { type: 'string' },
            discussionPrompt: { type: 'string' },
          },
        },
      },
      solution: { type: 'string' },
    },
  };
}

function buildPrompt(input: {
  playerCount: number;
  mafiaCount: number;
  theme: string;
  difficulty: string;
}) {
  const difficultyInstruction =
    input.difficulty === 'hard'
      ? 'صعب: الأدلة لا تصبح حاسمة إلا عند ربط 3 أدلة أو أكثر.'
      : input.difficulty === 'easy'
        ? 'سهل نسبيًا: الحل منطقي وواضح بعد الدليل الثالث، لكن لا يوجد دليل منفرد يفضح المجرم.'
        : 'متوسط: كل دليل يفتح أكثر من تفسير، والحل يظهر من ربط الأدلة معًا.';

  return `
أنت كاتب لعبة تحقيق اجتماعية أصلية للعائلة والأصدقاء. اكتب قضية جديدة بالكامل باللهجة المصرية الطبيعية.

عدد المشتبه فيهم: ${input.playerCount}
عدد المافيوزو: ${input.mafiaCount}
جو القضية المطلوب: ${input.theme}
الصعوبة: ${difficultyInstruction}

قواعد أساسية لا يجوز كسرها:
- كل معلومات الشخصيات في bio معلومات علنية يسمعها كل اللاعبين. لا توجد أسرار شخصية خاصة.
- السر الوحيد الذي يراه اللاعب على هاتفه هو هل هو Mafia أم Innocent.
- المافيوزو لا يعرفون بعضهم. اجعل تعاونهم في الجريمة ممكنًا بدون معرفة الهوية: فرصة صنعها شخص مجهول واستغلها الآخر، تعليمات مجهولة، أو خطتان التقتا بالصدفة.
- اختر mafiaCharacterIndexes من فهارس الشخصيات ابتداءً من صفر، ولا تذكر في النصوص العلنية من هم.
- كل شخصية لازم يكون عندها دافع أو فرصة أو تفصيلة مريبة تجعل اتهامها منطقيًا.
- لازم توجد تفاصيل مضللة حقيقية تخص الأبرياء، لكنها ليست كذبًا من الراوي.
- ممنوع أن يقول أي دليل بشكل مباشر وظيفة أو صفة لا تنطبق إلا على مافيوزو واحد.
- الدليل الأول يورط على الأقل 3 شخصيات منطقيًا.
- الدليل الثاني يضيف زاوية مختلفة ولا يحسم الأول.
- الدليل الثالث يسمح بعمل نظريات قوية متعارضة.
- الدليل الرابع قوي، لكنه لا يحدد المجرمين وحده إلا لو اتربط بالأدلة السابقة.
- الحل النهائي يشرح الجريمة خطوة بخطوة ويشرح لماذا الأدلة المضللة لم تكن دليل إدانة.
- القضية عائلية وآمنة: لا تفاصيل دموية أو جنسية أو مخدرات.
- لا تستخدم أسماء برامج أو ألعاب أو شخصيات مشهورة، ولا تقلد نصوصًا أو مقدمات معروفة.
- اجعل أسماء الشخصيات مصرية خفيفة ومضحكة قليلًا لكن غير مهينة.
- premise هي القصة الافتتاحية التي سيقرأها الـBoss للجميع، بدون كشف الحل.
- discussionPrompt سؤال قصير يساعد النقاش بعد كل دليل من غير تلميح للإجابة.
- لا تضع Markdown ولا code fences. أرجع JSON خام فقط.

أرجع JSON فقط مطابقًا للـschema.
`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
  return String(error);
}

function parseModelJson(raw: string) {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(withoutFence);
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return Response.json({ error: 'GEMINI_API_KEY مش متسجل على السيرفر لسه.' }, { status: 500, headers: corsHeaders() });
    }

    const body = (await request.json().catch(() => ({}))) as {
      roomCode?: string;
      sessionToken?: string;
    };
    const roomCode = body.roomCode?.trim().toUpperCase();
    const headerToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    const token = headerToken || body.sessionToken?.trim();

    if (!roomCode) {
      return Response.json({ error: 'كود الروم ناقص.' }, { status: 400, headers: corsHeaders() });
    }
    if (!token) {
      console.warn('generate-case rejected: no session token received');
      return Response.json({ error: 'جلسة الـBoss مش واصلة للسيرفر. اعمل Refresh وجرب تاني.' }, { status: 401, headers: corsHeaders() });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // room_snapshot itself is authenticated and tells us whether this exact user is the Boss.
    // Avoid a second auth round-trip here; the RPC is the source of truth for game permissions.
    const { data: snapshot, error: snapshotError } = await supabase.rpc('room_snapshot', { p_code: roomCode });
    if (snapshotError || !snapshot) {
      const message = errorMessage(snapshotError ?? 'Room not found');
      const unauthorized = message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('jwt');
      console.warn('generate-case snapshot rejected:', message);
      return Response.json(
        { error: unauthorized ? 'جلسة الـBoss انتهت. اعمل Refresh وجرب تاني.' : message },
        { status: unauthorized ? 401 : 404, headers: corsHeaders() },
      );
    }
    if (!snapshot.isHost) {
      return Response.json({ error: 'الـBoss فقط يقدر يبدأ القضية.' }, { status: 403, headers: corsHeaders() });
    }
    if (snapshot.room.status !== 'lobby') {
      return Response.json({ error: 'القضية بدأت بالفعل.' }, { status: 409, headers: corsHeaders() });
    }

    const playerCount = Number(snapshot.playerCount);
    if (playerCount < 4 || playerCount > 12) {
      return Response.json({ error: 'عدد اللاعبين لازم يكون من 4 لـ12.' }, { status: 400, headers: corsHeaders() });
    }

    const mafiaCount = mafiaCountFor(playerCount);
    const validator = schemaFor(playerCount, mafiaCount);
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const models = (
      process.env.GEMINI_MODELS ??
      'gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-31b-it,gemma-4-26b-a4b-it'
    )
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);

    const prompt = buildPrompt({
      playerCount,
      mafiaCount,
      theme: snapshot.room.theme,
      difficulty: snapshot.room.difficulty,
    });

    let generated: z.infer<typeof validator> | null = null;
    let usedModel = '';
    let lastError = '';

    for (const model of models) {
      try {
        const isGemini = model.startsWith('gemini-');
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: isGemini
            ? {
                responseMimeType: 'application/json',
                responseJsonSchema: jsonSchema(playerCount, mafiaCount),
                maxOutputTokens: 8192,
              }
            : {
                maxOutputTokens: 8192,
                temperature: 0.7,
              },
        });

        const raw = response.text;
        if (!raw) throw new Error('Model returned an empty response.');
        generated = validator.parse(parseModelJson(raw));
        usedModel = model;
        break;
      } catch (error) {
        lastError = `${model}: ${errorMessage(error)}`;
        console.warn('AI model failed, trying fallback:', lastError);
      }
    }

    if (!generated) {
      return Response.json(
        { error: `موديلات التوليد مش متاحة مؤقتًا. ${lastError}` },
        { status: 503, headers: corsHeaders() },
      );
    }

    const { error: installError } = await supabase.rpc('install_case', {
      p_code: roomCode,
      p_case: generated,
    });
    if (installError) {
      return Response.json({ error: errorMessage(installError) }, { status: 500, headers: corsHeaders() });
    }

    return Response.json({ ok: true, model: usedModel }, { headers: corsHeaders() });
  } catch (error) {
    const message = errorMessage(error);
    console.error('generate-case fatal:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders() });
  }
}
