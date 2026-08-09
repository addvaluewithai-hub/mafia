import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Field, Screen } from '@/components/game-ui';
import { joinRoom, normalizeRoomCode } from '@/lib/game';
import { colors, rtlText } from '@/lib/theme';

export default function JoinRoomScreen() {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const normalized = normalizeRoomCode(code);
    if (normalized.length !== 6 || nickname.trim().length < 2) {
      setError('اكتب كود الروم المكوّن من 6 حروف واسمك.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinRoom(normalized, nickname);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/room/${normalized}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مش عارفين ندخلك الروم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Body>خد الكود من الـBoss. أول ما تدخل هتظهر في اللوبي، والدور السري مش هيبان غير لك بعد بداية القضية.</Body>
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '800' }}>كود الروم</Text>
        <Field
          value={code}
          onChangeText={(value) => setCode(normalizeRoomCode(value))}
          placeholder="A1B2C3"
          autoCapitalize="characters"
          maxLength={6}
          style={{ textAlign: 'center', writingDirection: 'ltr', fontSize: 24, letterSpacing: 5, fontWeight: '900' }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '800' }}>اسمك</Text>
        <Field value={nickname} onChangeText={setNickname} placeholder="الاسم اللي هيظهر للناس" maxLength={24} />
      </View>

      {error ? <ErrorText message={error} /> : null}
      <Button label="ادخل الروم" onPress={submit} loading={loading} />
    </Screen>
  );
}
