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

import { colors, rtlText } from '@/lib/theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        gap: 18,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: colors.background,
      }}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, danger = false }: PropsWithChildren<{ danger?: boolean }>) {
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 22,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: danger ? '#6A2A30' : colors.border,
        backgroundColor: colors.surface,
        boxShadow: '0 12px 34px rgba(0,0,0,0.24)',
      }}>
      {children}
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return (
    <Text
      selectable
      style={{
        ...rtlText,
        color: colors.gold,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
      }}>
      {children}
    </Text>
  );
}

export function Title({ children, size = 34 }: PropsWithChildren<{ size?: number }>) {
  return (
    <Text
      selectable
      style={{
        ...rtlText,
        color: colors.text,
        fontSize: size,
        lineHeight: size * 1.25,
        fontWeight: '900',
      }}>
      {children}
    </Text>
  );
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return (
    <Text
      selectable
      style={{
        ...rtlText,
        color: muted ? colors.muted : colors.text,
        fontSize: 16,
        lineHeight: 25,
      }}>
      {children}
    </Text>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#6E727C"
      {...props}
      style={[
        {
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          borderCurve: 'continuous',
          paddingHorizontal: 15,
          backgroundColor: colors.surface2,
          color: colors.text,
          fontSize: 16,
          textAlign: 'right',
          writingDirection: 'rtl',
        },
        props.style,
      ]}
    />
  );
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  tone = 'gold',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'gold' | 'dark' | 'red';
  icon?: ReactNode;
}) {
  const backgroundColor = tone === 'gold' ? colors.gold : tone === 'red' ? colors.red : colors.surface2;
  const foreground = tone === 'gold' ? colors.black : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 18,
        borderRadius: 17,
        borderCurve: 'continuous',
        borderWidth: tone === 'dark' ? 1 : 0,
        borderColor: colors.border,
        backgroundColor,
        opacity: disabled || loading ? 0.45 : pressed ? 0.82 : 1,
      })}>
      {loading ? <ActivityIndicator color={foreground} /> : icon}
      <Text style={{ color: foreground, fontSize: 16, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'gold' | 'red' | 'green' }) {
  const color =
    tone === 'gold' ? colors.gold : tone === 'red' ? colors.red : tone === 'green' ? colors.green : colors.muted;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${color}66`,
        backgroundColor: `${color}14`,
      }}>
      <Text style={{ color, fontWeight: '800', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Text selectable style={{ ...rtlText, color: '#FF858D', lineHeight: 22 }}>{message}</Text>;
}
