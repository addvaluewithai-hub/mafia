import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import { createRoom, suggestedMafiaCount } from '@/lib/game';
import { colors, rtlText } from '@/lib/theme';

const difficulties = [
  { key: 'easy' as const, label: 'سهل', desc: 'مناسب لأول مرة', icon: '◌' },
  { key: 'medium' as const, label: 'متوسط', desc: 'أحسن توازن', icon: '◐' },
  { key: 'hard' as const, label: 'صعب', desc: 'للناس الشكاكة', icon: '●' },
];

export default function CreateRoomScreen() {
  const [bossName, setBossName] = useState('');
  const [players, setPlayers] = useState(6);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const changePlayers = (delta: number) => {
    setPlayers((value) => Math.max(4, Math.min(12, value + delta)));
    void Haptics.selectionAsync();
  };

  const submit = async () => {
    if (bossName.trim().length < 2) {
      setError('اكتب اسم الـBoss الأول.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = await createRoom({
        bossName,
        maxPlayers: players,
        difficulty,
        theme: theme || 'حفلة عائلية مصرية معاصرة',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حصلت مشكلة أثناء إنشاء الروم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 7, paddingTop: 6 }}>
        <Eyebrow>MAFIA BOSS SETUP</Eyebrow>
        <Title size={38}>جهّز القضية</Title>
        <Body muted>إنت المدير. اختار شكل الماتش وسيب الباقي علينا.</Body>
      </View>

      <Card accent>
        <View style={{ flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' }}>
          <MiniStat value={`${players}`} label="مشتبه فيه" />
          <MiniStat value={`${suggestedMafiaCount(players)}`} label="مافيوزو" />
          <MiniStat value="4" label="جولات" />
        </View>
      </Card>

      <View style={{ gap: 9 }}>
        <SectionTitle title="اسم الـBoss" caption="الاسم اللي هيظهر فوق الروم" />
        <Field value={bossName} onChangeText={setBossName} placeholder="مثلاً: شريف" maxLength={24} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle title="عدد اللاعبين" caption="من 4 لـ 12 لاعب" />
          <Pill label={`${suggestedMafiaCount(players)} مافيا`} tone="gold" />
        </View>

        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <Pressable
            onPress={() => changePlayers(1)}
            style={({ pressed }) => ({ width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: colors.gold, fontSize: 30, fontWeight: '600' }}>+</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 54, lineHeight: 60, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{players}</Text>
            <Text style={{ color: colors.muted2, fontSize: 12 }}>لاعب</Text>
          </View>

          <Pressable
            onPress={() => changePlayers(-1)}
            style={({ pressed }) => ({ width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: colors.gold, fontSize: 32, fontWeight: '600' }}>−</Text>
          </Pressable>
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle title="صعوبة الأدلة" caption="بتغيّر قد إيه الربط بين الأدلة محتاج تركيز" />
        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          {difficulties.map((item) => {
            const selected = difficulty === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setDifficulty(item.key);
                  void Haptics.selectionAsync();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 112,
                  padding: 13,
                  gap: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: selected ? colors.gold2 : colors.border,
                  backgroundColor: selected ? colors.goldSoft : colors.surface,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}>
                <Text style={{ color: selected ? colors.gold : colors.muted2, fontSize: 18 }}>{item.icon}</Text>
                <Text style={{ color: selected ? colors.gold : colors.text, fontWeight: '900', fontSize: 15 }}>{item.label}</Text>
                <Text style={{ color: colors.muted2, fontSize: 10, textAlign: 'center' }}>{item.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <SectionTitle title="جو القضية" caption="اختياري — والـAI هيبني القضية حواليه" />
        <Field value={theme} onChangeText={setTheme} placeholder="فرح، فيلا، شركة، مصيف، نادي..." maxLength={70} />
        <Text style={{ ...rtlText, color: colors.muted2, fontSize: 11 }}>مثال: «حفلة خطوبة في فيلا قديمة» أو «رحلة أصحاب في الساحل»</Text>
      </View>

      {error ? <ErrorText message={error} /> : null}
      <Button label="اعمل الروم وابدأ التجمع" onPress={submit} loading={loading} />
    </Screen>
  );
}
