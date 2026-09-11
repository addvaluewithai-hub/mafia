import { z } from 'zod';

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  };
}

export function OPTIONS() {
  return new Response(null, { headers: headers() });
}

export async function POST(request: Request) {
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

  const serverRelease = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RELEASE_SHA ?? 'unknown';
  console.info(JSON.stringify({
    type: 'akher_kheit.gameplay',
    ...result.data,
    clientRelease: result.data.release ?? 'unknown',
    release: serverRelease,
  }));

  return Response.json({ ok: true }, { headers: headers() });
}
