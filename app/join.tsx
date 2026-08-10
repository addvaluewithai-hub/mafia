import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Eyebrow, Field, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import { joinRoom, normalizeRoomCode } from '@/lib/game';

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
      <View className="min-h-[680px] justify-center gap-7 py-4 lg:flex-row-reverse lg:items-center lg:gap-12">
        <View className="flex-1 gap-5">
          <View className="gap-2">
            <Eyebrow>JOIN THE CASE</Eyebrow>
            <Title>ادخل الروم</Title>
            <Body muted>خد الكود من الـBoss، واختار الاسم اللي هيتقال في الاتهامات 😈</Body>
          </View>

          <Card tone="gold">
            <View className="flex-row-reverse items-center justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-right text-lg font-black text-case-cream">الدور السري آمن</Text>
                <Text className="text-right text-xs leading-5 text-case-muted">مش هيبان غير على جهازك بعد ما الـBoss يبدأ القضية.</Text>
              </View>
              <Pill label="PRIVATE" tone="gold" />
            </View>
          </Card>
        </View>

        <Card className="flex-1 lg:max-w-[470px] lg:p-7">
          <View className="gap-3">
            <SectionTitle title="كود الروم" caption="6 حروف أو أرقام" />
            <Field
              value={code}
              onChangeText={(value) => setCode(normalizeRoomCode(value))}
              placeholder="A1B2C3"
              autoCapitalize="characters"
              maxLength={6}
              className="min-h-[72px] text-center text-3xl font-black tracking-[8px]"
            />
          </View>

          <View className="gap-3">
            <SectionTitle title="اسمك في اللعبة" caption="اختار اسم قصير وواضح" />
            <Field value={nickname} onChangeText={setNickname} placeholder="مثلاً: مهند" maxLength={24} />
          </View>

          {error ? <ErrorText message={error} /> : null}
          <Button label="ادخل التحقيق" onPress={submit} loading={loading} />
          <Text className="text-center text-[11px] text-case-dim">مفيش تسجيل حساب • الدخول مؤقت وسريع</Text>
        </Card>
      </View>
    </Screen>
  );
}
