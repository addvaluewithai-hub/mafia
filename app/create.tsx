import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Field, Pill, Screen } from '@/components/game-ui';
import { createRoom, suggestedMafiaCount } from '@/lib/game';
import { colors, rtlText } from '@/lib/theme';

const difficulties = [
  { key: 'easy' as const, label: 'سهل' },
  { key: 'medium' as const, label: 'متوسط' },
  { key: 'hard' as const, label: 'صعب' },
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
      <Card>
        <Pill label="إعداد الروم" tone="gold" />
        <Body>أنت الـBoss ومش لاعب. اختار عدد المشتبه فيهم، وبعد ما يدخلوا هنولد القضية على العدد الفعلي.</Body>
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '800' }}>اسم الـBoss</Text>
        <Field value={bossName} onChangeText={setBossName} placeholder="مثلاً: شريف" maxLength={24} />
      </View>

      <Card>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 18 }}>عدد اللاعبين</Text>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => changePlayers(1)} style={{ padding: 14 }}>
            <Text style={{ color: colors.gold, fontSize: 30, fontWeight: '900' }}>+</Text>
          </Pressable>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text selectable style={{ color: colors.text, fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
              {players}
            </Text>
            <Text style={{ color: colors.muted }}>مافيا مقترحة: {suggestedMafiaCount(players)}</Text>
          </View>
          <Pressable onPress={() => changePlayers(-1)} style={{ padding: 14 }}>
            <Text style={{ color: colors.gold, fontSize: 34, fontWeight: '900' }}>−</Text>
          </Pressable>
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '800' }}>صعوبة الأدلة</Text>
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
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  alignItems: 'center',
                  borderRadius: 15,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: selected ? colors.gold : colors.border,
                  backgroundColor: selected ? '#2A2412' : colors.surface,
                }}>
                <Text style={{ color: selected ? colors.gold : colors.text, fontWeight: '800' }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ ...rtlText, color: colors.text, fontWeight: '800' }}>جو القضية — اختياري</Text>
        <Field value={theme} onChangeText={setTheme} placeholder="فرح، شركة، مصيف، نادي، فيلا..." maxLength={70} />
      </View>

      {error ? <ErrorText message={error} /> : null}
      <Button label="اعمل الروم" onPress={submit} loading={loading} />
    </Screen>
  );
}
