import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.gold,
          headerShadowVisible: false,
          headerBackTitle: '',
          headerTitleStyle: { color: colors.text, fontWeight: '900', fontSize: 15 },
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ title: 'إنشاء روم' }} />
        <Stack.Screen name="join" options={{ title: 'دخول روم' }} />
        <Stack.Screen name="room/[code]" options={{ title: 'آخر خيط' }} />
      </Stack>
    </>
  );
}
