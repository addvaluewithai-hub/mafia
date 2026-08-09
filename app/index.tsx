import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Eyebrow, Screen, Title } from '@/components/game-ui';
import { colors, rtlText } from '@/lib/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20, minHeight: 520 }}>
        <View style={{ gap: 10 }}>
          <Eyebrow>لعبة تحقيق اجتماعية</Eyebrow>
          <Title size={48}>آخر خيط</Title>
          <Body muted>كل حد عنده رواية. المافيا عندها الحقيقة — ومش عارفة بعض.</Body>
        </View>

        <Card>
          <Text selectable style={{ ...rtlText, color: colors.text, fontSize: 18, lineHeight: 28, fontWeight: '800' }}>
            روم واحد، رابط واحد، وقضية جديدة بيولدها الـAI. اتناقشوا، اتهموا، وصوّتوا قبل ما المافيا تضحك عليكم.
          </Text>
        </Card>

        <View style={{ gap: 12 }}>
          <Link href="/create" asChild>
            <Pressable
              style={({ pressed }) => ({
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                borderCurve: 'continuous',
                backgroundColor: colors.gold,
                opacity: pressed ? 0.82 : 1,
              })}>
              <Text style={{ color: colors.black, fontSize: 18, fontWeight: '900' }}>اعمل روم كـ Boss</Text>
            </Pressable>
          </Link>

          <Link href="/join" asChild>
            <Pressable
              style={({ pressed }) => ({
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.78 : 1,
              })}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>ادخل روم</Text>
            </Pressable>
          </Link>
        </View>

        <Text selectable style={{ ...rtlText, color: '#686B74', fontSize: 12, lineHeight: 19 }}>
          الـBoss بيدير اللعبة ومش محسوب ضمن المشتبه فيهم. الأدوار السرية الوحيدة: مافيا أو بريء.
        </Text>
      </View>
    </Screen>
  );
}
