import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

export function Screen({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-noir-950">
      <View pointerEvents="none" className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#4a3512] opacity-25" />
      <View pointerEvents="none" className="absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-[#241b3a] opacity-25" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
        <View className="mx-auto w-full max-w-5xl gap-5 px-4 pb-16 pt-5 sm:px-6 lg:px-8">{children}</View>
      </ScrollView>
    </View>
  );
}

export function Card({ children, tone = 'default', className = '' }: PropsWithChildren<{ tone?: 'default' | 'gold' | 'danger' | 'green'; className?: string }>) {
  const toneClass =
    tone === 'gold'
      ? 'border-case-gold/35 bg-[#121009]'
      : tone === 'danger'
        ? 'border-case-red/35 bg-[#170c10]'
        : tone === 'green'
          ? 'border-case-green/35 bg-[#0b1511]'
          : 'border-white/10 bg-noir-800/95';
  return <View className={`gap-4 rounded-[28px] border p-5 web:shadow-card ${toneClass} ${className}`}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text className="text-right text-[11px] font-black uppercase tracking-[2px] text-case-gold">{children}</Text>;
}

export function Title({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <Text className={`text-right text-4xl font-black leading-[46px] text-case-cream sm:text-5xl sm:leading-[58px] ${className}`}>{children}</Text>;
}

export function Body({ children, muted = false, className = '' }: PropsWithChildren<{ muted?: boolean; className?: string }>) {
  return <Text className={`text-right text-[15px] leading-7 ${muted ? 'text-case-muted' : 'text-case-cream'} ${className}`}>{children}</Text>;
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <View className="gap-1">
      <Text className="text-right text-xl font-black text-case-cream">{title}</Text>
      {caption ? <Text className="text-right text-xs leading-5 text-case-dim">{caption}</Text> : null}
    </View>
  );
}

export function Field({ className = '', ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#6e707e"
      {...props}
      className={`min-h-[58px] rounded-2xl border border-white/10 bg-noir-750 px-4 text-right text-base text-case-cream outline-none web:focus:border-case-gold/60 ${className}`}
    />
  );
}

export function Button({ label, onPress, disabled, loading, tone = 'gold', icon, className = '' }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'gold' | 'dark' | 'red';
  icon?: ReactNode;
  className?: string;
}) {
  const palette = tone === 'gold'
    ? 'border-case-gold bg-case-gold'
    : tone === 'red'
      ? 'border-case-red bg-case-red'
      : 'border-white/10 bg-noir-750';
  const text = tone === 'gold' ? 'text-noir-950' : 'text-case-cream';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-[58px] flex-row-reverse items-center justify-center gap-2 rounded-2xl border px-5 active:scale-[0.99] ${palette} ${(disabled || loading) ? 'opacity-40' : ''} ${className}`}>
      {loading ? <ActivityIndicator color={tone === 'gold' ? '#050507' : '#fff6dc'} /> : icon}
      <Text className={`text-center text-[15px] font-black ${text}`}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'gold' | 'red' | 'green' }) {
  const boxClass = tone === 'gold'
    ? 'border-case-gold/30 bg-case-gold/10'
    : tone === 'red'
      ? 'border-case-red/30 bg-case-red/10'
      : tone === 'green'
        ? 'border-case-green/30 bg-case-green/10'
        : 'border-white/10 bg-white/5';
  const textClass = tone === 'gold'
    ? 'text-case-gold'
    : tone === 'red'
      ? 'text-case-red'
      : tone === 'green'
        ? 'text-case-green'
        : 'text-case-muted';
  return (
    <View className={`self-start rounded-full border px-3 py-1.5 ${boxClass}`}>
      <Text className={`text-[10px] font-black tracking-wider ${textClass}`}>{label}</Text>
    </View>
  );
}

export function HeroMark() {
  return (
    <View className="h-20 w-20 rotate-[-5deg] items-center justify-center rounded-[26px] border border-case-gold/40 bg-case-gold/10 web:shadow-gold">
      <Text className="rotate-[5deg] text-4xl font-black text-case-gold">خ</Text>
    </View>
  );
}

export function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-w-[92px] flex-1 gap-1 rounded-2xl border border-white/[0.07] bg-noir-750 px-4 py-3">
      <Text className="text-right text-lg font-black text-case-cream">{value}</Text>
      <Text className="text-right text-[10px] font-bold text-case-dim">{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View className="h-px bg-white/[0.07]" />;
}

export function ErrorText({ message }: { message: string }) {
  return (
    <View className="rounded-2xl border border-case-red/30 bg-case-red/10 px-4 py-3">
      <Text className="text-right text-sm font-bold leading-6 text-[#ff9da5]">{message}</Text>
    </View>
  );
}
