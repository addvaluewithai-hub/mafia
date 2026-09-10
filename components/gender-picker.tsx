import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import type { PlayerGender } from '@/lib/types';

export function GenderPicker({ value, onChange }: { value: PlayerGender | null; onChange: (value: PlayerGender) => void }) {
  const options: Array<{ value: PlayerGender; label: string }> = [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ];

  return (
    <View className="flex-row-reverse gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value);
              void Haptics.selectionAsync();
            }}
            className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-4 active:scale-[0.98] ${selected ? 'border-case-gold/60 bg-case-gold/10' : 'border-white/10 bg-noir-800'}`}>
            <Text className={`font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
