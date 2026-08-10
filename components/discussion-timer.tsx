import * as Haptics from 'expo-haptics';
import { RotateCcw, TimerReset } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { playGameSfx } from '@/lib/game-sfx';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function DiscussionTimer({
  endsAt,
  durationSeconds,
  isHost,
  disabled,
  onRestart,
}: {
  endsAt: string | null;
  durationSeconds: number;
  isHost: boolean;
  disabled?: boolean;
  onRestart: (seconds: number) => Promise<void>;
}) {
  const calculateRemaining = () => {
    if (!endsAt) return 0;
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(calculateRemaining);
  const warningPlayed = useRef(false);
  const timeoutPlayed = useRef(false);

  useEffect(() => {
    warningPlayed.current = false;
    timeoutPlayed.current = false;
    setRemaining(calculateRemaining());
    const interval = setInterval(() => setRemaining(calculateRemaining()), 500);
    return () => clearInterval(interval);
  }, [endsAt]);

  useEffect(() => {
    if (remaining <= 10 && remaining > 0 && !warningPlayed.current) {
      warningPlayed.current = true;
      void playGameSfx('warning');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    if (remaining === 0 && endsAt && !timeoutPlayed.current) {
      timeoutPlayed.current = true;
      void playGameSfx('timeout');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
  }, [remaining, endsAt]);

  const ratio = useMemo(() => Math.max(0, Math.min(1, remaining / Math.max(1, durationSeconds))), [remaining, durationSeconds]);
  const urgent = remaining <= 30;
  const caution = !urgent && remaining <= 60;
  const accentClass = urgent ? 'text-case-red' : caution ? 'text-case-gold' : 'text-case-green';
  const barClass = urgent ? 'bg-case-red' : caution ? 'bg-case-gold' : 'bg-case-green';
  const width = `${ratio * 100}%` as `${number}%`;

  return (
    <Animated.View entering={FadeInDown.duration(240)} className="overflow-hidden rounded-[28px] border border-white/10 bg-noir-800/95 web:shadow-card">
      <View className="gap-4 p-5">
        <View className="flex-row-reverse items-center justify-between gap-4">
          <View className="flex-row-reverse items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-noir-700">
              <TimerReset size={20} color={urgent ? '#ef5d68' : caution ? '#f2c14e' : '#66d6a0'} strokeWidth={2.2} />
            </View>
            <View className="gap-0.5">
              <Text className="text-right text-base font-black text-case-cream">وقت النقاش</Text>
              <Text className="text-right text-[10px] text-case-dim">العداد نفسه ظاهر لكل الأجهزة</Text>
            </View>
          </View>

          <Text selectable className={`text-4xl font-black tabular-nums ${accentClass}`}>{formatTime(remaining)}</Text>
        </View>

        <View className="h-2 overflow-hidden rounded-full bg-noir-700">
          <View style={{ width }} className={`h-full rounded-full ${barClass}`} />
        </View>

        {isHost ? (
          <View className="flex-row-reverse gap-2">
            {[60, 180, 300].map((seconds) => (
              <Pressable
                key={seconds}
                disabled={disabled}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  void onRestart(seconds);
                }}
                className={`min-h-[42px] flex-1 flex-row-reverse items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-noir-750 px-2 active:scale-[0.98] ${disabled ? 'opacity-40' : ''}`}>
                <RotateCcw size={13} color="#f2c14e" strokeWidth={2.2} />
                <Text className="text-[11px] font-black text-case-cream">{seconds / 60} د</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
