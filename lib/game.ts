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

export async function generateAndStartCase(code: string) {
  await ensureAnonymousSession();

  const { data, error } = await supabase.functions.invoke('generate-case', {
    body: { roomCode: normalizeRoomCode(code) },
  });

  if (error) {
    let message = error.message || 'تعذر توليد القضية';
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = (await context.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // Keep the SDK error message.
      }
    }
    throw new Error(message);
  }

  const body = (data ?? {}) as { ok?: boolean; model?: string; error?: string };
  if (!body.ok) throw new Error(body.error ?? 'تعذر توليد القضية');
  return body;
}

export function shareRoomUrl(code: string) {
  const base = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
  return base ? `${base}/room/${normalizeRoomCode(code)}` : normalizeRoomCode(code);
}
