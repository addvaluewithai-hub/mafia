import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Bot, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { GenderPicker } from '@/components/gender-picker';
import { Body, Button, Card, ErrorText, Eyebrow, Field, MiniStat, Screen, SectionTitle, Title } from '@/components/game-ui';
import { addAiPlayer, errorToMessage } from '@/lib/game';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import type { PlayerGender } from '@/lib/types';

export default function SoloScreen() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<PlayerGender | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startSolo = async () => {
    if (nickname.trim().length < 2) return setError('اكتب اسمك الأول.');
    if (!gender) return setError('اختار الجنس عشان صياغة دورك تبقى مظبوطة.');

    setLoading(true);
    setError('');
    try {
      await ensureAnonymousSession();
      const { data, error: rpcError } = await supabase.rpc('create_room_v3', {
        p_boss_name: nickname.trim(),
        p_boss_gender: gender,
        p_max_players: 4,
        p_difficulty: 'hard',
        p_theme: 'قضية جاهزة محكمة',
        p_case_mode: 'preset',
        p_story_template_id: 'last-tray',
      });
      if (rpcError) throw rpcError;

      const code = String(data);
      await Promise.all([addAiPlayer(code), addAiPlayer(code), addAiPlayer(code)]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/room/${code}`);
    } catch (err) {
      setError(errorToMessage(err, 'معرفناش نجهز ماتش الـAI. جرّب تاني.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mx-auto w-full max-w-2xl gap-6 pt-4">
        <View className="gap-2">
          <Eyebrow>SOLO PLAYTEST</Eyebrow>
          <Title>إنت ضد 3 لاعبين AI</Title>
          <Body muted>هنفتح قضية 4 لاعبين: إنت الـBoss ولاعب كامل، ومعاك 3 لاعبين كمبيوتر. الأدوار تتوزع عشوائي زي أي روم عادي.</Body>
        </View>

        <Card tone="gold">
          <View className="flex-row-reverse flex-wrap gap-2">
            <MiniStat value="1" label="إنت" />
            <MiniStat value="3" label="AI" />
            <MiniStat value="1" label="مافيا" />
            <MiniStat value="4" label="جولات" />
          </View>
        </Card>

        {error ? <ErrorText message={error} /> : null}

        <Card>
          <View className="flex-row-reverse items-center gap-3">
            <Bot size={22} color="#f2c14e" />
            <View className="min-w-0 flex-1">
              <SectionTitle title="جهّز نفسك" caption="الـAI هيدخل اللوبي تلقائيًا وبعدها تبدأ القضية من شاشة الروم" />
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-right text-xs font-bold text-case-muted">اسمك</Text>
            <Field value={nickname} onChangeText={setNickname} placeholder="مثلاً: شريف" maxLength={24} />
          </View>
          <View className="gap-2">
            <SectionTitle title="الجنس" caption="للصياغة بس — ملوش علاقة بدور المافيا" />
            <GenderPicker value={gender} onChange={setGender} />
          </View>
          <Button label="جهّز ماتش AI" onPress={startSolo} loading={loading} icon={<Sparkles size={19} color="#050507" />} />
        </Card>

        <Body muted className="text-center">نسخة أولى للتجربة: لاعبين الـAI يصوتوا تلقائيًا وقت ما تحسم التصويت، وقرارهم يميل للأدوار المذكورة في الأدلة المكشوفة. المافيا منهم تعرف فريقها لكن الحل الكامل عمره ما بيتكشف لهم.</Body>
      </View>
    </Screen>
  );
}
