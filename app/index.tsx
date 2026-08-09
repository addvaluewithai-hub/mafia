import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Eyebrow, HeroMark, MiniStat, Screen, Title } from '@/components/game-ui';
import { colors, rtlText } from '@/lib/theme';

function HomeAction({ href, title, caption, primary = false }: { href: '/create' | '/join'; title: string; caption: string; primary?: boolean }) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => ({
          minHeight: 78,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingHorizontal: 18,
          paddingVertical: 15,
          borderRadius: 22,
          borderCurve: 'continuous',
          borderWidth: primary ? 0 : 1,
          borderColor: colors.border,
          backgroundColor: primary ? colors.gold : colors.surface,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ ...rtlText, color: primary ? colors.ink : colors.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
          <Text style={{ ...rtlText, color: primary ? '#4A3915' : colors.muted, fontSize: 12, lineHeight: 18 }}>{caption}</Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 14,
            backgroundColor: primary ? '#CDA63F' : colors.surface2,
          }}>
          <Text style={{ color: primary ? colors.ink : colors.gold, fontSize: 22, fontWeight: '900' }}>‹</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 22, minHeight: 650 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 16 }}>
          <HeroMark />
          <View style={{ flex: 1, gap: 7 }}>
            <Eyebrow>لعبة تحقيق اجتماعية • AI CASES</Eyebrow>
            <Title size={48}>آخر خيط</Title>
          </View>
        </View>

        <Body muted>كل واحد عنده رواية. اتهم، ناقش، واربط الأدلة قبل ما المافيا تودّي الأبرياء السجن.</Body>

        <Card accent>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 13 }}>
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.goldSoft }}>
              <Text style={{ fontSize: 20 }}>✦</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ ...rtlText, color: colors.text, fontSize: 18, fontWeight: '900' }}>كل ماتش قضية جديدة</Text>
              <Text style={{ ...rtlText, color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                Gemini بيكتب قضية وأدلة وشخصيات على عددكم، والروم كله بيتزامن لحظيًا.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' }}>
            <MiniStat value="4–12" label="لاعب" />
            <MiniStat value="4" label="جولات أدلة" />
            <MiniStat value="LIVE" label="تصويت مباشر" />
          </View>
        </Card>

        <View style={{ gap: 11 }}>
          <HomeAction href="/create" title="اعمل روم كـ Boss" caption="اختار العدد والصعوبة وابدأ القضية" primary />
          <HomeAction href="/join" title="ادخل روم" caption="معاك كود؟ ادخل باسمك وانضم للمشتبه فيهم" />
        </View>

        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: colors.green }} />
          <Text style={{ ...rtlText, color: colors.muted2, fontSize: 12 }}>الـBoss بيدير اللعبة ومش محسوب ضمن اللاعبين</Text>
        </View>
      </View>
    </Screen>
  );
}
