import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import { createRoom, suggestedMafiaCount } from '@/lib/game';

const difficulties = [
  { key: 'easy' as const, label: 'سهل', desc: 'مناسب لأول مرة' },
  { key: 'medium' as const, label: 'متوسط', desc: 'أحسن توازن' },
  { key: 'hard' as const, label: 'صعب', desc: 'للناس الشكاكة' },
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
      setError('اكتب اسمك الأول.');
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
      <View className="gap-2 pt-2">
        <Eyebrow>BOSS + PLAYER</Eyebrow>
        <Title>جهّز القضية</Title>
        <Body muted>إنت الـBoss وإنت لاعب كمان. اختار العدد الكلي، وبعدها ابعت الرابط لباقي الناس.</Body>
      </View>

      <View className="gap-5 lg:flex-row-reverse lg:items-start lg:gap-7">
        <View className="flex-1 gap-5">
          <Card tone="gold">
            <View className="flex-row-reverse flex-wrap gap-2">
              <MiniStat value={`${players}`} label="لاعب شامل الـBoss" />
              <MiniStat value={`${suggestedMafiaCount(players)}`} label="مافيوزو" />
              <MiniStat value="4" label="جولات" />
            </View>
          </Card>

          <View className="gap-2">
            <SectionTitle title="اسمك" caption="هتظهر كـBoss وكلاعب ضمن المشتبه فيهم" />
            <Field value={bossName} onChangeText={setBossName} placeholder="مثلاً: شريف" maxLength={24} />
          </View>

          <View className="gap-2">
            <SectionTitle title="جو القضية" caption="اختياري — والـAI هيبني القضية حواليه" />
            <Field value={theme} onChangeText={setTheme} placeholder="فرح، فيلا، شركة، مصيف، نادي..." maxLength={70} />
            <Text className="text-right text-[11px] leading-5 text-case-dim">مثال: «حفلة خطوبة في فيلا قديمة» أو «رحلة أصحاب في الساحل»</Text>
          </View>
        </View>

        <View className="flex-1 gap-5 lg:max-w-[470px]">
          <Card>
            <View className="flex-row-reverse items-start justify-between gap-3">
              <SectionTitle title="عدد اللاعبين" caption="من 4 لـ 12 — وإنت واحد منهم" />
              <Pill label={`${suggestedMafiaCount(players)} مافيا`} tone="gold" />
            </View>

            <View className="flex-row-reverse items-center gap-4">
              <Pressable onPress={() => changePlayers(1)} className="h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-noir-700 active:scale-95">
                <Text className="text-3xl font-bold text-case-gold">+</Text>
              </Pressable>
              <View className="flex-1 items-center gap-1">
                <Text className="text-6xl font-black text-case-cream">{players}</Text>
                <Text className="text-xs text-case-dim">لاعب إجمالي</Text>
              </View>
              <Pressable onPress={() => changePlayers(-1)} className="h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-noir-700 active:scale-95">
                <Text className="text-3xl font-bold text-case-gold">−</Text>
              </Pressable>
            </View>

            <View className="rounded-2xl border border-case-gold/15 bg-case-gold/5 px-4 py-3">
              <Text className="text-right text-xs font-bold leading-5 text-case-muted">لو اخترت {players} لاعبين: إنت + {players - 1} يدخلوا من الرابط.</Text>
            </View>
          </Card>

          <View className="gap-3">
            <SectionTitle title="صعوبة الأدلة" caption="بتغيّر قد إيه الربط بين الأدلة محتاج تركيز" />
            <View className="flex-row-reverse gap-2">
              {difficulties.map((item) => {
                const selected = difficulty === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setDifficulty(item.key);
                      void Haptics.selectionAsync();
                    }}
                    className={`min-h-[98px] flex-1 items-center justify-center gap-1 rounded-2xl border px-2 active:scale-[0.98] ${selected ? 'border-case-gold/60 bg-case-gold/10' : 'border-white/10 bg-noir-800'}`}>
                    <Text className={`text-base font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{item.label}</Text>
                    <Text className="text-center text-[10px] leading-4 text-case-dim">{item.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <ErrorText message={error} /> : null}
          <Button label="اعمل الروم وادخل كلاعب" onPress={submit} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
