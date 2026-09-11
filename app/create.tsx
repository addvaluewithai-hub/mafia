import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GenderPicker } from '@/components/gender-picker';
import { Body, Button, Card, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import { errorToMessage, suggestedMafiaCount } from '@/lib/game';
import { STORY_CATALOG, storiesForPlayerCount } from '@/lib/story-catalog';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import type { CaseMode, PlayerGender } from '@/lib/types';

const difficulties = [
  { key: 'easy' as const, label: 'سهل', desc: 'مناسب لأول مرة' },
  { key: 'medium' as const, label: 'متوسط', desc: 'أحسن توازن' },
  { key: 'hard' as const, label: 'صعب', desc: 'أدلة محتاجة ربط' },
];

export default function CreateRoomScreen() {
  const [bossName, setBossName] = useState('');
  const [bossGender, setBossGender] = useState<PlayerGender | null>(null);
  const [players, setPlayers] = useState(6);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('hard');
  const [theme, setTheme] = useState('');
  const [caseMode, setCaseMode] = useState<CaseMode>('preset');
  const [storyTemplateId, setStoryTemplateId] = useState('last-rehearsal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableStories = useMemo(() => storiesForPlayerCount(players), [players]);
  const presetAvailable = availableStories.length > 0;

  const changePlayers = (delta: number) => {
    const next = Math.max(4, Math.min(12, players + delta));
    setPlayers(next);
    const nextStories = storiesForPlayerCount(next);
    if (caseMode === 'preset') {
      if (nextStories.length) setStoryTemplateId(nextStories[0].id);
      else {
        setCaseMode('ai');
        setStoryTemplateId('');
      }
    }
    void Haptics.selectionAsync();
  };

  const chooseMode = (mode: CaseMode) => {
    if (mode === 'preset' && !presetAvailable) return;
    setCaseMode(mode);
    if (mode === 'preset' && !availableStories.some((story) => story.id === storyTemplateId)) {
      setStoryTemplateId(availableStories[0]?.id ?? '');
    }
    void Haptics.selectionAsync();
  };

  const submit = async () => {
    if (bossName.trim().length < 2) {
      setError('اكتب اسمك الأول.');
      return;
    }
    if (!bossGender) {
      setError('اختار الجنس عشان صياغة القصة تبقى مظبوطة.');
      return;
    }
    if (caseMode === 'preset' && !availableStories.some((story) => story.id === storyTemplateId)) {
      setError('اختار قضية جاهزة مناسبة لعدد اللاعبين.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await ensureAnonymousSession();
      const { data, error: rpcError } = await supabase.rpc('create_room_v3', {
        p_boss_name: bossName.trim(),
        p_boss_gender: bossGender,
        p_max_players: players,
        p_difficulty: caseMode === 'preset' ? 'hard' : difficulty,
        p_theme: caseMode === 'preset' ? 'قضية جاهزة محكمة' : theme.trim() || 'حفلة عائلية مصرية معاصرة',
        p_case_mode: caseMode,
        p_story_template_id: caseMode === 'preset' ? storyTemplateId : null,
      });
      if (rpcError) throw rpcError;

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/room/${String(data)}`);
    } catch (err) {
      setError(errorToMessage(err, 'حصلت مشكلة أثناء إنشاء الروم'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-2 pt-2">
        <Eyebrow>BOSS + PLAYER</Eyebrow>
        <Title>جهّز القضية</Title>
        <Body muted>إنت الـBoss ولاعب كمان. اختار عددكم، وبعدها اختار قضية معمولة بإيدنا أو سيب الـAI يفاجئكم.</Body>
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
            <SectionTitle title="الجنس" caption="للصياغة في القصة بس — ملوش أي تأثير على دورك أو فرصك" />
            <GenderPicker value={bossGender} onChange={setBossGender} />
          </View>
        </View>

        <View className="flex-1 gap-5 lg:max-w-[470px]">
          <Card>
            <View className="flex-row-reverse items-start justify-between gap-3">
              <SectionTitle title="عدد اللاعبين" caption="من 4 لـ12 — وإنت واحد منهم" />
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
        </View>
      </View>

      <View className="gap-3">
        <SectionTitle title="مصدر القضية" caption="الجاهزة أصعب ومختبرة يدويًا — والـAI بيولد قضية جديدة كل مرة" />
        <View className="gap-2 sm:flex-row-reverse">
          <Pressable
            onPress={() => chooseMode('preset')}
            disabled={!presetAvailable}
            className={`min-h-[112px] flex-1 justify-center gap-2 rounded-3xl border p-4 active:scale-[0.99] ${caseMode === 'preset' ? 'border-case-gold/60 bg-case-gold/10' : 'border-white/10 bg-noir-800'} ${!presetAvailable ? 'opacity-40' : ''}`}>
            <Text className={`text-right text-lg font-black ${caseMode === 'preset' ? 'text-case-gold' : 'text-case-cream'}`}>قضية جاهزة</Text>
            <Text className="text-right text-xs leading-5 text-case-muted">{presetAvailable ? `عندنا ${availableStories.length === 1 ? 'قضية' : 'قصتين'} مخصوص لـ${players} لاعبين، صعوبتهم عالية ومحسوبة.` : 'متاحة حاليًا من 4 لـ7 لاعبين.'}</Text>
          </Pressable>

          <Pressable
            onPress={() => chooseMode('ai')}
            className={`min-h-[112px] flex-1 justify-center gap-2 rounded-3xl border p-4 active:scale-[0.99] ${caseMode === 'ai' ? 'border-case-gold/60 bg-case-gold/10' : 'border-white/10 bg-noir-800'}`}>
            <Text className={`text-right text-lg font-black ${caseMode === 'ai' ? 'text-case-gold' : 'text-case-cream'}`}>قضية بالذكاء الاصطناعي</Text>
            <Text className="text-right text-xs leading-5 text-case-muted">قضية جديدة، والـAI هياخد القضايا الجاهزة كمرجع للصعوبة وطريقة توزيع الشك.</Text>
          </Pressable>
        </View>
      </View>

      {caseMode === 'preset' ? (
        <View className="gap-3">
          <SectionTitle title="اختار القضية" caption="العنوان والوصف من غير أي spoilers — الأدوار تتوزع عشوائي على اللاعبين" />
          <View className="gap-3 md:flex-row-reverse">
            {availableStories.map((story) => {
              const selected = story.id === storyTemplateId;
              return (
                <Pressable
                  key={story.id}
                  onPress={() => {
                    setStoryTemplateId(story.id);
                    void Haptics.selectionAsync();
                  }}
                  className={`min-h-[132px] flex-1 justify-between gap-3 rounded-3xl border p-4 active:scale-[0.99] ${selected ? 'border-case-gold/60 bg-case-gold/10' : 'border-white/10 bg-noir-800'}`}>
                  <View className="gap-2">
                    <Text className={`text-right text-xl font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{story.title}</Text>
                    <Text className="text-right text-xs leading-6 text-case-muted">{story.teaser}</Text>
                  </View>
                  <View className="flex-row-reverse"><Pill label={selected ? 'اختيارك' : 'صعبة'} tone={selected ? 'gold' : 'neutral'} /></View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="gap-5 lg:flex-row-reverse lg:items-start lg:gap-7">
          <View className="flex-1 gap-2">
            <SectionTitle title="جو القضية" caption="اختياري — والـAI هيبني القضية حواليه" />
            <Field value={theme} onChangeText={setTheme} placeholder="فرح، فيلا، شركة، مصيف، نادي..." maxLength={70} />
            <Text className="text-right text-[11px] leading-5 text-case-dim">مثال: «حفلة خطوبة في فيلا قديمة» أو «رحلة أصحاب في الساحل»</Text>
          </View>

          <View className="flex-1 gap-3 lg:max-w-[470px]">
            <SectionTitle title="صعوبة الأدلة" caption="حتى السهل مش هيكشف المافيا من دليل واحد" />
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
        </View>
      )}

      {error ? <ErrorText message={error} /> : null}
      <Button label={caseMode === 'preset' ? 'اعمل الروم بالقضية دي' : 'اعمل الروم وخلي الـAI يجهز القضية'} onPress={submit} loading={loading} />

      <Text className="hidden">{STORY_CATALOG.length}</Text>
    </Screen>
  );
}
