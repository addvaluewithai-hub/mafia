import { Platform } from 'react-native';

import type { PlayerGender, RoomSnapshot } from '@/lib/types';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';

export function normalizeRoomCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function suggestedMafiaCount(playerCount: number) {
  if (playerCount >= 10) return 3;
  if (playerCount >= 6) return 2;
  return 1;
}

export function errorToMessage(error: unknown, fallback = 'حصلت مشكلة غير متوقعة') {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    if (typeof record.error_description === 'string' && record.error_description.trim()) return record.error_description;
    if (typeof record.error === 'string' && record.error.trim()) return record.error;
    if (record.error && typeof record.error === 'object') return errorToMessage(record.error, fallback);
    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') return json;
    } catch {
      // Ignore serialization failures and use the friendly fallback below.
    }
  }
  return fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksTransient(error: unknown) {
  const message = errorToMessage(error, '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('timeout') ||
    message.includes('fetch')
  );
}

export async function createRoom(input: {
  bossName: string;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
}) {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc('create_room', {
    p_boss_name: input.bossName.trim(),
    p_max_players: input.maxPlayers,
    p_difficulty: input.difficulty,
    p_theme: input.theme.trim(),
  });

  if (error) throw new Error(errorToMessage(error, 'تعذر إنشاء الروم'));
  return String(data);
}

export async function joinRoom(code: string, nickname: string, gender: PlayerGender) {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc('join_room_v2', {
    p_code: normalizeRoomCode(code),
    p_nickname: nickname.trim(),
    p_gender: gender,
  });

  if (error) throw new Error(errorToMessage(error, 'تعذر دخول الروم'));
  return String(data);
}

export async function addAiPlayer(code: string) {
  const { data, error } = await supabase.rpc('add_ai_player', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر إضافة لاعب AI'));
  return data as { playerId: string; nickname: string; gender: PlayerGender };
}

export async function removeAiPlayer(code: string, playerId: string) {
  const { error } = await supabase.rpc('remove_ai_player', {
    p_code: normalizeRoomCode(code),
    p_player_id: playerId,
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر إزالة لاعب AI'));
}

export async function castAiVotes(code: string) {
  const { data, error } = await supabase.rpc('cast_ai_votes', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(errorToMessage(error, 'لاعبين AI معرفوش يصوتوا'));
  return data as { votesCast: number };
}

export async function getRoomSnapshot(code: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await ensureAnonymousSession();
      const { data, error } = await supabase.rpc('room_snapshot', {
        p_code: normalizeRoomCode(code),
      });

      if (error) throw error;
      return data as RoomSnapshot;
    } catch (error) {
      lastError = error;
      if (!looksTransient(error) || attempt === 2) break;
      await sleep(350 * (attempt + 1));
    }
  }

  throw new Error(errorToMessage(lastError, 'تعذر تحميل الروم. جرّب تاني بعد لحظة.'));
}

export async function castVote(code: string, targetPlayerId: string) {
  const { error } = await supabase.rpc('cast_vote', {
    p_code: normalizeRoomCode(code),
    p_target_player_id: targetPlayerId,
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر تسجيل الصوت'));
}

export async function resolveVote(code: string) {
  const { data, error } = await supabase.rpc('resolve_vote', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر حسم التصويت'));
  return data as {
    status: 'pending' | 'tie' | 'eliminated' | 'finished';
    missing?: number;
    nickname?: string;
    role?: 'mafia' | 'innocent';
    winner?: 'mafia' | 'innocents';
  };
}

export async function revealNextRound(code: string) {
  const { error } = await supabase.rpc('reveal_next_round', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر كشف الدليل التالي'));
}

export async function restartDiscussionTimer(code: string, seconds: number) {
  const { error } = await supabase.rpc('restart_discussion_timer', {
    p_code: normalizeRoomCode(code),
    p_seconds: seconds,
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر إعادة العداد'));
}

export async function rematchRoom(code: string) {
  const { error } = await supabase.rpc('reset_room_for_rematch', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(errorToMessage(error, 'تعذر تجهيز الروم لماتش جديد'));
}

function apiUrl(path: string) {
  if (Platform.OS === 'web') return path;

  const base = (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_APP_URL
  )?.replace(/\/$/, '');

  if (!base) {
    throw new Error('حط EXPO_PUBLIC_APP_URL علشان تطبيق الموبايل يوصل لسيرفر اللعبة');
  }

  return `${base}${path}`;
}

export async function generateAndStartCase(code: string) {
  const session = await ensureAnonymousSession();
  let response: Response;

  try {
    response = await globalThis.fetch(apiUrl('/api/generate-case'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        roomCode: normalizeRoomCode(code),
        sessionToken: session.access_token,
      }),
    });
  } catch (error) {
    throw new Error(errorToMessage(error, 'مش قادرين نوصل لسيرفر تجهيز القضية. جرّب تاني.'));
  }

  const raw = await response.text();
  let body: {
    ok?: boolean;
    model?: string;
    source?: 'ai' | 'preset';
    storyTitle?: string;
    error?: unknown;
  } = {};
  if (raw) {
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      body = { error: raw };
    }
  }

  if (!response.ok || !body.ok) {
    const fallback = response.status === 401
      ? 'جلسة الـBoss محتاجة تتجدد. اعمل Refresh واضغط تاني.'
      : 'تعذر تجهيز القضية';
    throw new Error(errorToMessage(body.error, fallback));
  }

  return body;
}

export function shareRoomUrl(code: string) {
  const configured = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return `${configured}/room/${normalizeRoomCode(code)}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/room/${normalizeRoomCode(code)}`;
  }

  return normalizeRoomCode(code);
}