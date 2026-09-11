import { Platform } from 'react-native';

export type GameplayTelemetryEvent =
  | 'create'
  | 'join'
  | 'start'
  | 'generation'
  | 'vote'
  | 'resolve'
  | 'reconnect';

export type GameplayTelemetryOutcome = 'success' | 'error' | 'recovered';

export type GameplayTelemetryPayload = {
  event: GameplayTelemetryEvent;
  outcome: GameplayTelemetryOutcome;
  durationMs?: number;
  errorClass?: 'auth' | 'rate_limit' | 'network' | 'not_found' | 'conflict' | 'server' | 'unknown';
  detail?: 'preset' | 'ai' | 'pending' | 'tie' | 'eliminated' | 'finished' | 'retry';
  release?: string;
};

function telemetryUrl() {
  if (Platform.OS === 'web') return '/api/telemetry';
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_APP_URL)?.replace(/\/$/, '');
  return base ? `${base}/api/telemetry` : null;
}

export function classifyTelemetryError(error: unknown): GameplayTelemetryPayload['errorClass'] {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();
  if (message.includes('jwt') || message.includes('session') || message.includes('unauthorized') || message.includes('auth')) return 'auth';
  if (message.includes('429') || message.includes('rate') || message.includes('too many') || message.includes('استنى')) return 'rate_limit';
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout') || message.includes('load failed')) return 'network';
  if (message.includes('404') || message.includes('not found') || message.includes('مش موجود')) return 'not_found';
  if (message.includes('409') || message.includes('already') || message.includes('بدأت بالفعل') || message.includes('ممتل')) return 'conflict';
  if (message.includes('500') || message.includes('503') || message.includes('server')) return 'server';
  return 'unknown';
}

export function emitGameplayTelemetry(payload: Omit<GameplayTelemetryPayload, 'release'>) {
  const url = telemetryUrl();
  if (!url) return;
  const release = process.env.EXPO_PUBLIC_RELEASE_SHA ?? 'unknown';
  const body: GameplayTelemetryPayload = {
    ...payload,
    ...(typeof payload.durationMs === 'number' ? { durationMs: Math.max(0, Math.round(payload.durationMs)) } : {}),
    release,
  };
  void globalThis.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    keepalive: true,
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

export async function observeGameplayOperation<T>(
  event: GameplayTelemetryEvent,
  operation: () => Promise<T>,
  options?: {
    successDetail?: GameplayTelemetryPayload['detail'] | ((result: T) => GameplayTelemetryPayload['detail'] | undefined);
  },
) {
  const startedAt = Date.now();
  try {
    const result = await operation();
    const successDetail = typeof options?.successDetail === 'function' ? options.successDetail(result) : options?.successDetail;
    emitGameplayTelemetry({ event, outcome: 'success', durationMs: Date.now() - startedAt, ...(successDetail ? { detail: successDetail } : {}) });
    return result;
  } catch (error) {
    emitGameplayTelemetry({ event, outcome: 'error', durationMs: Date.now() - startedAt, errorClass: classifyTelemetryError(error) });
    throw error;
  }
}
