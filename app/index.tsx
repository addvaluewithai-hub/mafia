import { router } from 'expo-router';
import { ChevronLeft, Crown, Eye, Gavel, Link2, LogIn, Sparkles, Wifi } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Body, Card, Eyebrow, HeroMark, MiniStat, Screen, Title } from '@/components/game-ui';

function ActionCard({ title, caption, onPress, primary = false, icon }: { title: string; caption: string; onPress: () => void; primary?: boolean; icon: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[92px] w-full flex-row-reverse items-center gap-4 rounded-[26px] border p-4 active:scale-[0.99] ${primary ? 'border-case-gold bg-case-gold' : 'border-white/10 bg-noir-800'}`}>
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${primary ? 'bg-black/10' : 'bg-noir-700'}`}>{icon}</View>
      <View className="flex-1 gap-1">
        <Text className={`text-right text-lg font-black ${primary ? 'text-noir-950' : 'text-case-cream'}`}>{title}</Text>
        <Text className={`text-right text-xs leading-5 ${primary ? 'text-[#5b4519]' : 'text-case-muted'}`}>{caption}</Text>
      </View>
      <ChevronLeft size={20} color={primary ? '#050507' : '#f2c14e'} strokeWidth={2.4} />
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <Screen>
      <View className="min-h-[720px] justify-center gap-8 py-4 lg:min-h-[760px]">
        <Animated.View entering={FadeInDown.duration(350)} className="gap-8 lg:flex-row-reverse lg:items-center lg:gap-12">
          <View className="flex-1 gap-6">
            <View className="flex-row-reverse items-center gap-4">
              <HeroMark />
              <View className="flex-1 gap-2">
                <Eyebrow>AI SOCIAL MYSTERY</Eyebrow>
                <Title>آخر خيط</Title>
              </View>
            </View>

            <Body muted className="max-w-2xl text-base sm:text-lg sm:leading-8">
              كل واحد عنده رواية. اربط الأدلة، واجه المشتبه فيهم، وصوّت قبل ما المافيا تودّي الأبرياء السجن.
            </Body>

            <View className="flex-row-reverse flex-wrap gap-2">
              <MiniStat value="4–12" label="لاعب" />
              <MiniStat value="4" label="جولات" />
              <MiniStat value="LIVE" label="تصويت" />
            </View>
          </View>

          <Card tone="gold" className="flex-1 lg:max-w-[470px] lg:p-7">
            <View className="flex-row-reverse items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-case-gold/10">
                <Sparkles size={22} color="#f2c14e" strokeWidth={2.1} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-right text-xl font-black text-case-cream">كل مرة قضية جديدة</Text>
                <Text className="text-right text-xs leading-5 text-case-muted">القصة والشخصيات والأدلة بتتولد على عددكم وجو اللعب اللي تختاروه.</Text>
              </View>
            </View>

            <View className="h-px bg-case-gold/15" />

            <View className="gap-2">
              <View className="flex-row-reverse items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <Link2 size={17} color="#f2c14e" />
                <Text className="flex-1 text-right text-sm font-bold text-case-cream">اعمل روم وابعت الرابط</Text>
              </View>
              <View className="flex-row-reverse items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <Eye size={17} color="#f2c14e" />
                <Text className="flex-1 text-right text-sm font-bold text-case-cream">كل لاعب — حتى الـBoss — يشوف دوره سرًا</Text>
              </View>
              <View className="flex-row-reverse items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <Gavel size={17} color="#f2c14e" />
                <Text className="flex-1 text-right text-sm font-bold text-case-cream">أدلة، نقاش، تصويت، وكشف الحقيقة</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <View className="gap-3 sm:flex-row-reverse">
          <View className="flex-1">
            <ActionCard title="اعمل روم كـ Boss" caption="إنت هتلعب معاهم وتمسك إدارة الجولة" onPress={() => router.push('/create')} primary icon={<Crown size={22} color="#050507" strokeWidth={2.2} />} />
          </View>
          <View className="flex-1">
            <ActionCard title="ادخل روم" caption="معاك كود؟ ادخل باسمك وانضم للتحقيق" onPress={() => router.push('/join')} icon={<LogIn size={22} color="#f2c14e" strokeWidth={2.2} />} />
          </View>
        </View>

        <View className="flex-row-reverse items-center justify-center gap-2">
          <Wifi size={13} color="#66d6a0" strokeWidth={2.3} />
          <Text className="text-right text-[11px] text-case-dim">الـBoss لاعب كامل: له دور سري وتصويت، ومعاه تحكم الجولة</Text>
        </View>
      </View>
    </Screen>
  );
}
