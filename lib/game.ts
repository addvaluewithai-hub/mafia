import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';

import type { RoomSnapshot } from '@/lib/types';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';

export function normalizeRoomCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function suggestedMafiaCount(playerCount: number) {
  if (playerCount >= 10) return 3;
  if (playerCount >= 6) return 2;
  return 1;
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

  if (error) throw new Error(error.message);
  return String(data);
}

export async function joinRoom(code: string, nickname: string) {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc('join_room', {
    p_code: normalizeRoomCode(code),
    p_nickname: nickname.trim(),
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function getRoomSnapshot(code: string) {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc('room_snapshot', {
    p_code: normalizeRoomCode(code),
  });

  if (error) throw new Error(error.message);
  return data as RoomSnapshot;
}

export async function castVote(code: string, targetPlayerId: string) {
  const { error } = await supabase.rpc('cast_vote', {
    p_code: normalizeRoomCode(code),
    p_target_player_id: targetPlayerId,
  });
  if (error) throw new Error(error.message);
}

export async function resolveVote(code: string) {
  const { data, error } = await supabase.rpc('resolve_vote', {
    p_code: normalizeRoomCode(code),
  });
  if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
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
  const response = await fetch(apiUrl('/api/generate-case'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ roomCode: normalizeRoomCode(code) }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    model?: string;
    error?: string;
  };

  if (!response.ok || !body.ok) {
    throw new Error(body.error ?? 'تعذر توليد القضية');
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
