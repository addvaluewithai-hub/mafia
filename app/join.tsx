import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Eyebrow, Field, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
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
      <View style={{ minHeight: 620, justifyContent: 'center', gap: 20 }}>
        <View style={{ gap: 7 }}>
          <Eyebrow>JOIN THE CASE</Eyebrow>
          <Title size={40}>ادخل الروم</Title>
          <Body muted>خد الكود من الـBoss، واختار الاسم اللي هيتقال في الاتهامات 😈</Body>
        </View>

        <Card accent>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ ...rtlText, color: colors.text, fontSize: 17, fontWeight: '900' }}>الدور السري آمن</Text>
              <Text style={{ ...rtlText, color: colors.muted, fontSize: 13, lineHeight: 20 }}>مش هيبان غير على جهازك بعد ما الـBoss يبدأ القضية.</Text>
            </View>
            <Pill label="PRIVATE" tone="gold" />
          </View>
        </Card>

        <View style={{ gap: 9 }}>
          <SectionTitle title="كود الروم" caption="6 حروف أو أرقام" />
          <Field
            value={code}
            onChangeText={(value) => setCode(normalizeRoomCode(value))}
            placeholder="A1B2C3"
            autoCapitalize="characters"
            maxLength={6}
            style={{ textAlign: 'center', writingDirection: 'ltr', fontSize: 28, letterSpacing: 7, fontWeight: '900', minHeight: 66 }}
          />
        </View>

        <View style={{ gap: 9 }}>
          <SectionTitle title="اسمك في اللعبة" caption="اختار اسم قصير وواضح" />
          <Field value={nickname} onChangeText={setNickname} placeholder="مثلاً: مهند" maxLength={24} />
        </View>

        {error ? <ErrorText message={error} /> : null}
        <Button label="ادخل التحقيق" onPress={submit} loading={loading} />

        <Text style={{ ...rtlText, color: colors.muted2, fontSize: 11, textAlign: 'center' }}>مفيش تسجيل حساب • الدخول مؤقت وسريع</Text>
      </View>
    </Screen>
  );
}
