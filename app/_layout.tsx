import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#050507' },
          headerTintColor: '#f2c14e',
          headerShadowVisible: false,
          headerBackTitle: '',
          headerTitleStyle: { color: '#fff6dc', fontWeight: '900', fontSize: 15 },
          contentStyle: { backgroundColor: '#050507' },
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
