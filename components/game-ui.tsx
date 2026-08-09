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

import { colors, rtlText, shadow } from '@/lib/theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          right: -90,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: '#2A2111',
          opacity: 0.55,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -160,
          left: -120,
          width: 340,
          height: 340,
          borderRadius: 999,
          backgroundColor: '#181322',
          opacity: 0.62,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          gap: 18,
          paddingHorizontal: 18,
          paddingTop: 20,
          paddingBottom: 56,
        }}>
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({
  children,
  danger = false,
  accent = false,
}: PropsWithChildren<{ danger?: boolean; accent?: boolean }>) {
  const borderColor = danger ? '#6C2D35' : accent ? '#65501F' : colors.border;
  const backgroundColor = danger ? colors.redSoft : accent ? '#16130E' : colors.surface;
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 24,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor,
        backgroundColor,
        ...shadow,
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
        fontWeight: '900',
        letterSpacing: 0.8,
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
        lineHeight: size * 1.22,
        fontWeight: '900',
        letterSpacing: -0.5,
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
        lineHeight: 26,
      }}>
      {children}
    </Text>
  );
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ ...rtlText, color: colors.text, fontSize: 21, fontWeight: '900' }}>{title}</Text>
      {caption ? <Text style={{ ...rtlText, color: colors.muted2, fontSize: 13, lineHeight: 20 }}>{caption}</Text> : null}
    </View>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted2}
      {...props}
      style={[
        {
          minHeight: 56,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          borderCurve: 'continuous',
          paddingHorizontal: 16,
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
  const foreground = tone === 'gold' ? colors.ink : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 18,
        borderRadius: 19,
        borderCurve: 'continuous',
        borderWidth: tone === 'dark' ? 1 : 0,
        borderColor: colors.border,
        backgroundColor,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: disabled || loading ? 0.42 : 1,
      })}>
      {loading ? <ActivityIndicator color={foreground} /> : icon}
      <Text style={{ color: foreground, fontSize: 16, fontWeight: '900', letterSpacing: 0.1 }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'gold' | 'red' | 'green' }) {
  const color =
    tone === 'gold' ? colors.gold : tone === 'red' ? colors.red : tone === 'green' ? colors.green : colors.muted;
  const backgroundColor =
    tone === 'gold' ? colors.goldSoft : tone === 'red' ? colors.redSoft : tone === 'green' ? colors.greenSoft : colors.surface2;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${color}55`,
        backgroundColor,
      }}>
      <Text style={{ color, fontWeight: '900', fontSize: 11, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

export function HeroMark() {
  return (
    <View
      style={{
        width: 74,
        height: 74,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#6D5623',
        backgroundColor: colors.goldSoft,
        transform: [{ rotate: '-4deg' }],
        ...shadow,
      }}>
      <Text style={{ color: colors.gold, fontSize: 34, fontWeight: '900', transform: [{ rotate: '4deg' }] }}>خ</Text>
    </View>
  );
}

export function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2, paddingVertical: 12, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderSoft }}>
      <Text style={{ ...rtlText, color: colors.text, fontSize: 18, fontWeight: '900' }}>{value}</Text>
      <Text style={{ ...rtlText, color: colors.muted2, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.borderSoft }} />;
}

export function ErrorText({ message }: { message: string }) {
  return (
    <View style={{ padding: 13, borderRadius: 16, backgroundColor: colors.redSoft, borderWidth: 1, borderColor: '#5A272D' }}>
      <Text selectable style={{ ...rtlText, color: '#FF9EA5', lineHeight: 22, fontWeight: '700' }}>{message}</Text>
    </View>
  );
}
