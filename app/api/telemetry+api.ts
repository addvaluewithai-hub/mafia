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

type TelemetryIngestFailureReason =
  | 'missing_abuse_key'
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_telemetry'
  | 'guard_unavailable'
  | 'rate_limited';

function headers() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Abuse-Key',
    'Cache-Control': 'no-store',
  };
}

function serverRelease() {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RELEASE_SHA ?? 'unknown';
}

function logTelemetryIngestFailure(reason: TelemetryIngestFailureReason, status: number) {
  console.warn(JSON.stringify({
    type: 'akher_kheit.telemetry_ingest',
    outcome: 'error',
    reason,
    status,
    release: serverRelease(),
  }));
}

function errorResponse(error: string, status: number, reason: TelemetryIngestFailureReason, extraHeaders?: Record<string, string>) {
  logTelemetryIngestFailure(reason, status);
  return Response.json({ error }, { status, headers: { ...headers(), ...extraHeaders } });
}

export function OPTIONS() {
  return new Response(null, { headers: headers() });
}

export async function POST(request: Request) {
  const abuseKey = request.headers.get('X-Abuse-Key')?.trim();
  if (!abuseKey) {
    return errorResponse('missing_abuse_key', 400, 'missing_abuse_key');
  }

  const raw = await request.text();
  if (raw.length > 2048) {
    return errorResponse('payload_too_large', 413, 'payload_too_large');
  }

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return errorResponse('invalid_json', 400, 'invalid_json');
  }

  const result = telemetrySchema.safeParse(parsed);
  if (!result.success) {
    return errorResponse('invalid_telemetry', 400, 'invalid_telemetry');
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
    return errorResponse('telemetry_guard_unavailable', 503, 'guard_unavailable');
  }
  if (!slot?.allowed) {
    const retryAfterSeconds = Math.max(1, Number(slot?.retryAfterSeconds ?? 60));
    return errorResponse('rate_limited', 429, 'rate_limited', { 'Retry-After': String(retryAfterSeconds) });
  }

  console.info(JSON.stringify({
    type: 'akher_kheit.gameplay',
    ...result.data,
    clientRelease: result.data.release ?? 'unknown',
    release: serverRelease(),
  }));

  return Response.json({ ok: true }, { headers: headers() });
}
