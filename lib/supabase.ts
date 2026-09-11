import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://bwxgzcppxdrfcaorobpm.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_76VPHfV-oe9rexR8B80Vkw_M0LhqckV';
const ABUSE_KEY_STORAGE = 'akher-kheit:abuse-installation-key:v1';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: globalThis.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function newAbuseInstallationKey() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return randomUuid;
  const randomPart = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
  return `ak-${Date.now().toString(36)}-${randomPart}`;
}

export function getAbuseInstallationKey() {
  const existing = globalThis.localStorage?.getItem(ABUSE_KEY_STORAGE)?.trim();
  if (existing && existing.length >= 32 && existing.length <= 128) return existing;
  const created = newAbuseInstallationKey();
  globalThis.localStorage?.setItem(ABUSE_KEY_STORAGE, created);
  return created;
}

export async function ensureAnonymousSession() {
  const { data: current } = await supabase.auth.getSession();
  if (current.session) return current.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(error?.message ?? 'تعذر إنشاء جلسة دخول مؤقتة');
  }
  return data.session;
}

export function subscribeToRoomEvents(roomId: string, onChange: () => void) {
  const channel = supabase
    .channel(`room-events-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_events',
        filter: `room_id=eq.${roomId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
