import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const DEFAULT_SUPABASE_URL = 'https://bwxgzcppxdrfcaorobpm.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_76VPHfV-oe9rexR8B80Vkw_M0LhqckV';

const telemetrySchema = z.object({
  event: z.enum(['create', 'join', 'start', 'generation', 'vote', 'resolve', 'reconnect']),
  outcome: z.enum(['success', 'error', 'recovered']),
  durationMs: z.number().int().min(0).max(120000).optional(),
  errorClass: z.enum(['auth', 'rate_limit', 'network', 'not_found', 'conflict', 'server', 'unknown']).optional(),
  detail: z.enum(['preset', 'ai', 'pending', 'tie', 'eliminated', 'finished', 'retry']).optional(),
  release: z.string().max(80).optional(),
}).strict();

function headers() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Abuse-Key',
    'Cache-Control': 'no-store',
  };
}

export function OPTIONS() {
  return new Response(null, { headers: headers() });
}

export async function POST(request: Request) {
  const abuseKey = request.headers.get('X-Abuse-Key')?.trim();
  if (!abuseKey) {
    return Response.json({ error: 'missing_abuse_key' }, { status: 400, headers: headers() });
  }

  const raw = await request.text();
  if (raw.length > 2048) {
    return Response.json({ error: 'payload_too_large' }, { status: 413, headers: headers() });
  }

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: headers() });
  }

  const result = telemetrySchema.safeParse(parsed);
  if (!result.success) {
    return Response.json({ error: 'invalid_telemetry' }, { status: 400, headers: headers() });
  }

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data: slot, error: slotError } = await supabase.rpc('claim_public_abuse_slot', {
    p_abuse_key: abuseKey,
    p_action: 'telemetry',
  });
  if (slotError) {
    return Response.json({ error: 'telemetry_guard_unavailable' }, { status: 503, headers: headers() });
  }
  if (!slot?.allowed) {
    const retryAfterSeconds = Math.max(1, Number(slot?.retryAfterSeconds ?? 60));
    return Response.json(
      { error: 'rate_limited' },
      { status: 429, headers: { ...headers(), 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const serverRelease = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RELEASE_SHA ?? 'unknown';
  console.info(JSON.stringify({
    type: 'akher_kheit.gameplay',
    ...result.data,
    clientRelease: result.data.release ?? 'unknown',
    release: serverRelease,
  }));

  return Response.json({ ok: true }, { headers: headers() });
}
