import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  Gavel,
  Link2,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Skull,
  Sparkles,
  UserRound,
  Users,
  Vote,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown, FadeInUp, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { DiscussionTimer } from '@/components/discussion-timer';
import { GenderPicker } from '@/components/gender-picker';
import { Body, Button, Card, Divider, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import {
  castVote,
  errorToMessage,
  generateAndStartCase,
  getRoomSnapshot,
  joinRoom,
  normalizeRoomCode,
  resolveVote,
  restartDiscussionTimer,
  revealNextRound,
  shareRoomUrl,
} from '@/lib/game';
import { playGameSfx } from '@/lib/game-sfx';
import { subscribeToRoomEvents } from '@/lib/supabase';
import type { PlayerGender, PlayerState, RoomSnapshot } from '@/lib/types';

function PlayerCard({
  player,
  selected,
  onPress,
  compact = false,
  disabled = false,
}: {
  player: PlayerState;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const initial = (player.nickname.trim()[0] ?? '?').toUpperCase();
  const stateClass = selected
    ? 'border-case-gold/60 bg-case-gold/10'
    : player.isEliminated
      ? 'border-case-red/25 bg-case-red/5 opacity-55'
      : 'border-white/10 bg-noir-800';

  return (
    <Animated.View className="w-full min-w-0" entering={FadeInUp.duration(220)} layout={LinearTransition.duration(180)}>
      <Pressable
        disabled={disabled || !onPress}
        onPress={onPress}
        className={`w-full min-w-0 flex-row-reverse items-center gap-3 rounded-2xl border p-3.5 active:scale-[0.99] ${stateClass}`}>
        <View className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${selected ? 'border-case-gold/50 bg-case-gold/15' : 'border-white/10 bg-noir-700'}`}>
          {player.isEliminated ? (
            <LockKeyhole size={18} color="#ef5d68" strokeWidth={2.2} />
          ) : (
            <Text className={`text-base font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{initial}</Text>
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <View className="min-w-0 flex-row-reverse items-center gap-2">
            <Text numberOfLines={1} selectable className="min-w-0 flex-1 text-right text-base font-black text-case-cream">
              {player.nickname}
            </Text>
            {player.isHost ? <Pill label="BOSS" tone="gold" /> : null}
            {player.isEliminated ? <Pill label="في السجن" tone="red" /> : selected ? <Pill label="اختيارك" tone="gold" /> : null}
          </View>
          {!compact && player.characterName ? (
            <Text selectable className="text-right text-xs font-black text-case-gold">{player.characterName}</Text>
          ) : null}
          {!compact && player.characterBio ? (
            <Text selectable className="text-right text-xs leading-5 text-case-muted">{player.characterBio}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ClueCard({ index, clue, prompt, active }: { index: number; clue: string; prompt: string; active: boolean }) {
  return (
    <Animated.View className="w-full min-w-0" entering={FadeInDown.duration(280)}>
      <Card tone={active ? 'gold' : 'default'}>
        <View className="gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
          <View className="min-w-0 flex-row-reverse items-center gap-3">
            <View className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-case-gold' : 'bg-noir-700'}`}>
              <Sparkles size={19} color={active ? '#050507' : '#fff6dc'} strokeWidth={2.2} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-right text-lg font-black text-case-cream">الدليل {index + 1}</Text>
              <Text className="text-right text-[10px] text-case-dim">ROUND {index + 1}</Text>
            </View>
          </View>
          <Pill label={active ? 'الجولة الحالية' : 'مكشوف'} tone={active ? 'gold' : 'neutral'} />
        </View>
        <Text selectable className="text-right text-base font-bold leading-8 text-case-cream">{clue}</Text>
        <Divider />
        <View className="flex-row-reverse items-start gap-2">
          <View className="mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-case-gold/10">
            <Text className="font-black text-case-gold">؟</Text>
          </View>
          <Text selectable className="min-w-0 flex-1 text-right text-xs leading-5 text-case-muted">{prompt}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function RoomScreen() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = normalizeRoomCode(String(params.code ?? ''));
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [joinGender, setJoinGender] = useState<PlayerGender | null>(null);
  const [roleVisible, setRoleVisible] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const previousRoundCount = useRef<number | null>(null);
  const previousEliminationCount = useRef<number | null>(null);
  const previousWinner = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const data = await getRoomSnapshot(code);
      setSnapshot(data);
      setError('');
    } catch (err) {
      setError(errorToMessage(err, 'تعذر تحميل الروم. جرّب تاني.'));
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!snapshot?.room.id) return;
    return subscribeToRoomEvents(snapshot.room.id, () => void refresh());
  }, [snapshot?.room.id, refresh]);

  useEffect(() => { setSelectedVote(null); }, [snapshot?.room.roundIndex]);

  useEffect(() => {
    if (!snapshot) return;
    const count = snapshot.rounds.length;
    if (previousRoundCount.current !== null && count > previousRoundCount.current) {
      void playGameSfx('reveal');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    previousRoundCount.current = count;
  }, [snapshot?.rounds.length]);

  useEffect(() => {
    if (!snapshot) return;
    const count = snapshot.eliminations.length;
    if (previousEliminationCount.current !== null && count > previousEliminationCount.current) {
      void playGameSfx('jail');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    previousEliminationCount.current = count;
  }, [snapshot?.eliminations.length]);

  useEffect(() => {
    const winner = snapshot?.room.winner ?? null;
    if (winner && winner !== previousWinner.current) void playGameSfx('success');
    previousWinner.current = winner;
  }, [snapshot?.room.winner]);

  const alivePlayers = useMemo(
    () => snapshot?.players.filter((player) => !player.isEliminated) ?? [],
    [snapshot?.players],
  );

  const doAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(errorToMessage(err, 'حصلت مشكلة. جرّب تاني.'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyText = async (value: string, kind: 'code' | 'link') => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        if (kind === 'code') setCopiedCode(true);
        else setCopiedLink(true);
        void playGameSfx('vote');
        setTimeout(() => {
          if (kind === 'code') setCopiedCode(false);
          else setCopiedLink(false);
        }, 1600);
        return;
      }
      await Share.share({ message: value });
    } catch (err) {
      setError(errorToMessage(err, 'معرفناش ننسخ. دوس على الرابط واعمله Copy يدوي.'));
    }
  };

  if (loading && !snapshot) {
    return (
      <Screen>
        <View className="min-h-[560px] justify-center">
          <Card tone="gold">
            <Eyebrow>CASE FILE</Eyebrow>
            <Text className="text-right text-2xl font-black text-case-cream">بنفتح ملف القضية...</Text>
            <Body muted>ثواني ونجمع كل اللي حصل في الروم.</Body>
          </Card>
        </View>
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen>
        <View className="min-h-[560px] justify-center gap-3">
          <ErrorText message={error || 'الروم مش موجود.'} />
          <Button label="حاول تاني" onPress={() => void refresh()} tone="dark" />
        </View>
      </Screen>
    );
  }

  const { room } = snapshot;
  const votePhaseOpen = snapshot.phase === 'voting';
  const isOutsider = !snapshot.isHost && !snapshot.me;
  const requiredToStart = room.caseMode === 'preset' ? room.maxPlayers : 4;
  const lobbyReady = snapshot.playerCount >= requiredToStart;
  const progress = `${Math.min(100, (snapshot.playerCount / room.maxPlayers) * 100)}%` as `${number}%`;
  const roomUrl = shareRoomUrl(code);

  const submitJoin = async () => {
    if (nickname.trim().length < 2) {
      setError('اكتب اسمك الأول.');
      return;
    }
    if (!joinGender) {
      setError('اختار الجنس عشان صياغة القصة تبقى مظبوطة.');
      return;
    }
    await doAction(async () => {
      await joinRoom(code, nickname, joinGender);
      void playGameSfx('success');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const startGame = async () => {
    await doAction(async () => {
      const result = await generateAndStartCase(code);
      void playGameSfx('reveal');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('القضية جاهزة', result.storyTitle ? `هنلعب: ${result.storyTitle}` : `اتجهزت بنجاح${result.model ? ` باستخدام ${result.model}` : ''}.`);
    });
  };

  const submitVote = async () => {
    if (!selectedVote || !snapshot.canVote) return;
    await doAction(async () => {
      await castVote(code, selectedVote);
      void playGameSfx('vote');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  };

  const settleVote = async () => {
    await doAction(async () => {
      const result = await resolveVote(code);
      if (result.status === 'pending') Alert.alert('لسه التصويت ناقص', `ناقص ${result.missing ?? 0} تصويت.`);
      else if (result.status === 'tie') Alert.alert('تعادل', 'الأصوات اتصفّرت. عندكم دقيقة دفاع وبعدها صوّتوا تاني.');
      else if (result.status === 'finished') Alert.alert('انتهت القضية', result.winner === 'innocents' ? 'الأبرياء كشفوا المافيا.' : 'المافيا كسبت.');
      else Alert.alert('إلى السجن', `${result.nickname} — ${result.role === 'mafia' ? 'مافيوزو' : 'بريء'}`);
    });
  };

  return (
    <Screen>
      <View className="w-full min-w-0 gap-4 pt-1 sm:pt-2">
        <View className="w-full min-w-0 gap-3 sm:flex-row-reverse sm:items-end sm:justify-between sm:gap-4">
          <View className="w-full min-w-0 gap-1 sm:flex-1 sm:gap-2">
            <Eyebrow>{room.status === 'lobby' ? 'WAITING ROOM' : room.status === 'playing' ? 'LIVE INVESTIGATION' : 'CASE CLOSED'}</Eyebrow>
            <Title className="text-3xl leading-[42px] sm:text-4xl sm:leading-[52px]">{room.title ?? 'غرفة التحقيق'}</Title>
          </View>
          <View className="w-full flex-row-reverse items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
            <Pill label={code} tone="gold" />
            <Text numberOfLines={1} selectable className="min-w-0 flex-1 text-right text-[10px] text-case-dim sm:flex-none">Boss: {room.bossName}</Text>
          </View>
        </View>

        <View className="w-full min-w-0 flex-row-reverse flex-wrap gap-2">
          <MiniStat value={`${snapshot.playerCount}/${room.maxPlayers}`} label="لاعبين" />
          <MiniStat value={`${room.mafiaCount}`} label="مافيا" />
          <MiniStat value={room.status === 'lobby' ? 'LOBBY' : room.status === 'playing' ? `R${room.roundIndex + 1}` : 'END'} label="الحالة" />
        </View>
      </View>

      {error ? <ErrorText message={error} /> : null}

      {isOutsider ? (
        <Animated.View className="w-full min-w-0" entering={FadeInDown.duration(260)}>
          <Card tone="gold" className="mx-auto max-w-xl">
            <SectionTitle title="اسمك على قائمة المشتبه فيهم" caption="ادخل قبل ما الـBoss يبدأ القضية" />
            {room.status !== 'lobby' ? (
              <Body muted>القضية بدأت بالفعل، ومش بنقبل لاعبين جدد.</Body>
            ) : (
              <>
                <Field value={nickname} onChangeText={setNickname} placeholder="اكتب اسمك" maxLength={24} />
                <View className="gap-2">
                  <SectionTitle title="الجنس" caption="للصياغة في القصة بس — مش بيغير دورك أو فرصك" />
                  <GenderPicker value={joinGender} onChange={setJoinGender} />
                </View>
                <Button label="انضم للروم" onPress={submitJoin} loading={actionLoading} icon={<UserRound size={18} color="#050507" strokeWidth={2.3} />} />
              </>
            )}
          </Card>
        </Animated.View>
      ) : null}

      {room.status === 'lobby' ? (
        <View className="w-full min-w-0 gap-5 lg:flex-row-reverse lg:items-start lg:gap-7">
          <View className="w-full min-w-0 gap-5 lg:flex-1">
            <Card tone="gold">
              <View className="w-full min-w-0 gap-3 sm:flex-row-reverse sm:items-start sm:justify-between">
                <View className="min-w-0 flex-row-reverse items-center gap-3 sm:flex-1">
                  <View className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-case-gold/10">
                    <Users size={20} color="#f2c14e" strokeWidth={2.2} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <SectionTitle title="اللوبي" caption={lobbyReady ? 'العدد كفاية — تقدر تبدأ القضية دلوقتي' : room.caseMode === 'preset' ? `القضية الجاهزة دي محتاجة ${room.maxPlayers} لاعبين كاملين` : 'اجمع 4 لاعبين على الأقل عشان تبدأ'} />
                  </View>
                </View>
                <Pill label={lobbyReady ? 'جاهزين' : 'مستنيين'} tone={lobbyReady ? 'green' : 'gold'} />
              </View>

              <View className="h-2 w-full overflow-hidden rounded-full bg-noir-700">
                <View style={{ width: progress }} className={`h-full rounded-full ${lobbyReady ? 'bg-case-green' : 'bg-case-gold'}`} />
              </View>

              {snapshot.isHost ? (
                <>
                  <Divider />
                  <Button
                    label={lobbyReady ? 'ابدأ القضية' : `محتاجين ${requiredToStart} لاعبين عشان نبدأ`}
                    onPress={startGame}
                    disabled={!lobbyReady}
                    loading={actionLoading}
                    icon={<Sparkles size={19} color="#050507" strokeWidth={2.4} />}
                  />
                  <Text className="text-center text-[10px] leading-5 text-case-dim">هنجهّز القضية مرة واحدة ونبدأ فورًا لكل اللاعبين.</Text>
                </>
              ) : !isOutsider ? (
                <Body muted className="text-center">إنت جوه. استنى الـBoss يبدأ القضية.</Body>
              ) : null}
            </Card>

            <Card>
              <View className="gap-1">
                <View className="flex-row-reverse items-center gap-2">
                  <QrCode size={18} color="#f2c14e" strokeWidth={2.2} />
                  <Text className="text-right text-lg font-black text-case-cream">دخّل الناس بسرعة</Text>
                </View>
                <Text className="text-right text-xs leading-5 text-case-dim">امسح الـQR أو انسخ رابط الروم مباشرة.</Text>
              </View>

              <View className="w-full items-center py-1 sm:py-2">
                <View className="rounded-[22px] bg-case-cream p-3">
                  <QRCode value={roomUrl} size={156} color="#050507" backgroundColor="#fff6dc" />
                </View>
                <Text selectable className="pt-3 text-2xl font-black tracking-[4px] text-case-gold sm:text-3xl sm:tracking-[5px]">{code}</Text>
                <Text numberOfLines={1} selectable className="w-full pt-2 text-center text-[9px] text-case-dim sm:text-[10px]">{roomUrl}</Text>
              </View>

              <View className="w-full gap-2 sm:flex-row-reverse">
                <Button
                  className="sm:flex-1"
                  label={copiedLink ? 'الرابط اتنسخ' : 'انسخ الرابط'}
                  onPress={() => void copyText(roomUrl, 'link')}
                  tone="dark"
                  icon={copiedLink ? <CheckCircle2 size={17} color="#66d6a0" /> : <Link2 size={17} color="#f2c14e" />}
                />
                <Button
                  className="sm:flex-1"
                  label={copiedCode ? 'الكود اتنسخ' : 'انسخ الكود'}
                  onPress={() => void copyText(code, 'code')}
                  tone="dark"
                  icon={copiedCode ? <CheckCircle2 size={17} color="#66d6a0" /> : <Copy size={17} color="#f2c14e" />}
                />
              </View>
            </Card>

            {snapshot.isHost ? (
              <Card>
                <View className="w-full min-w-0 gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
                  <View className="min-w-0 flex-row-reverse items-center gap-3 sm:flex-1">
                    <Gavel size={20} color="#f2c14e" strokeWidth={2.2} />
                    <View className="min-w-0 flex-1">
                      <SectionTitle title="إدارة الـBoss" caption={`الصعوبة: ${room.difficulty} • الجو: ${room.theme}`} />
                    </View>
                  </View>
                  <Pill label="BOSS + PLAYER" tone="gold" />
                </View>
                <Text className="text-right text-xs leading-6 text-case-muted">إنت لاعب كامل في القضية، وفي نفس الوقت معاك تحكم الجولة. دورك السري مش ظاهر هنا.</Text>
              </Card>
            ) : null}
          </View>

          <View className="w-full min-w-0 gap-3 lg:max-w-[470px] lg:flex-1">
            <Card>
              <View className="flex-row-reverse items-center gap-2">
                <Clipboard size={18} color="#a6a7b2" />
                <View className="min-w-0 flex-1">
                  <SectionTitle title="الموجودين" caption={`${snapshot.playerCount} دخلوا لحد دلوقتي`} />
                </View>
              </View>
              <View className="w-full gap-2">
                {snapshot.players.map((player) => <PlayerCard key={player.id} player={player} compact />)}
              </View>
              {!snapshot.players.length ? <Body muted>لسه مفيش مشتبه فيهم. ابعت الرابط لأول لاعب.</Body> : null}
            </Card>
          </View>
        </View>
      ) : null}

      {room.status !== 'lobby' ? (
        <View className="w-full min-w-0 gap-6">
          <Animated.View className="w-full min-w-0" entering={FadeInDown.duration(260)}>
            <Card tone="gold">
              <View className="flex-row-reverse items-center gap-3"><ShieldCheck size={20} color="#f2c14e" /><Eyebrow>CASE BRIEF</Eyebrow></View>
              <Body className="text-base leading-8">{room.premise ?? ''}</Body>
            </Card>
          </Animated.View>

          {snapshot.me ? (
            <Card tone={roleVisible && snapshot.me.role === 'mafia' ? 'danger' : roleVisible ? 'green' : 'default'} className="overflow-hidden">
              <View className="w-full min-w-0 gap-3 sm:flex-row-reverse sm:items-start sm:justify-between">
                <View className="min-w-0 flex-row-reverse items-center gap-3 sm:flex-1">
                  <LockKeyhole size={20} color="#f2c14e" />
                  <View className="min-w-0 flex-1"><SectionTitle title="دورك السري" caption="خلي الشاشة بعيد عن العيون" /></View>
                </View>
                <Pill label={snapshot.isHost ? 'PRIVATE • BOSS' : 'PRIVATE'} tone="gold" />
              </View>
              {roleVisible ? (
                <Animated.View entering={ZoomIn.springify().damping(16)} className="items-center gap-3 py-5">
                  {snapshot.me.role === 'mafia' ? <Skull size={42} color="#ef5d68" strokeWidth={1.8} /> : <ShieldCheck size={42} color="#66d6a0" strokeWidth={1.8} />}
                  <Text className={`text-center text-3xl font-black sm:text-4xl ${snapshot.me.role === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>{snapshot.me.role === 'mafia' ? 'أنت مافيوزو' : 'أنت بريء'}</Text>
                  <Text className="max-w-lg text-center text-xs leading-5 text-case-muted">{snapshot.me.role === 'mafia' ? 'في مافيوزو غيرك وسط الناس، وإنت مش عارف مين.' : 'حلّ القضية قبل ما الأبرياء يدخلوا السجن.'}</Text>
                </Animated.View>
              ) : (
                <View className="items-center py-6"><EyeOff size={36} color="#6e707e" strokeWidth={1.7} /></View>
              )}
              <Button
                label={roleVisible ? 'اخفي دوري' : 'اكشف دوري'}
                tone={roleVisible && snapshot.me.role === 'mafia' ? 'red' : 'dark'}
                icon={roleVisible ? <EyeOff size={17} color="#fff6dc" /> : <Eye size={17} color="#f2c14e" />}
                onPress={() => {
                  const next = !roleVisible;
                  setRoleVisible(next);
                  if (next) {
                    void playGameSfx('reveal');
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
                  }
                }}
              />
            </Card>
          ) : null}

          {votePhaseOpen ? (
            <DiscussionTimer
              endsAt={room.timerEndsAt}
              durationSeconds={room.timerDurationSeconds}
              isHost={snapshot.isHost}
              disabled={actionLoading}
              onRestart={async (seconds) => { await doAction(() => restartDiscussionTimer(code, seconds)); }}
            />
          ) : null}

          <View className="w-full min-w-0 gap-3">
            <View className="flex-row-reverse items-center gap-2"><Users size={18} color="#a6a7b2" /><SectionTitle title="المشتبه فيهم" caption="كل المعلومات دي علنية" /></View>
            <View className="w-full min-w-0 gap-3 md:flex-row-reverse md:flex-wrap">
              {snapshot.players.map((player) => (
                <View key={player.id} className="w-full min-w-0 md:w-[48%] md:flex-grow"><PlayerCard player={player} /></View>
              ))}
            </View>
          </View>

          <View className="w-full min-w-0 gap-3">
            <View className="flex-row-reverse items-center gap-2"><Sparkles size={18} color="#f2c14e" /><SectionTitle title="الأدلة" caption="كل دليل يفتح احتمالات أكتر مما يقفلها" /></View>
            {snapshot.rounds.map((round) => (
              <ClueCard key={round.roundIndex} index={round.roundIndex} clue={round.clue} prompt={round.discussionPrompt} active={round.roundIndex === room.roundIndex} />
            ))}
          </View>

          {snapshot.eliminations.length ? (
            <Animated.View className="w-full min-w-0" entering={FadeInDown.duration(240)}>
              <Card tone="danger">
                <View className="flex-row-reverse items-center gap-2"><LockKeyhole size={18} color="#ef5d68" /><SectionTitle title="السجن" caption="الأدوار اللي اتكشفت لحد دلوقتي" /></View>
                <View className="w-full gap-2">
                  {snapshot.eliminations.map((item) => (
                    <View key={item.playerId} className="w-full min-w-0 flex-row-reverse items-center justify-between gap-2 rounded-2xl bg-black/20 px-4 py-3">
                      <Text numberOfLines={1} selectable className="min-w-0 flex-1 text-right font-black text-case-cream">{item.nickname}</Text>
                      <Pill label={item.revealedRole === 'mafia' ? 'مافيوزو' : 'بريء'} tone={item.revealedRole === 'mafia' ? 'red' : 'green'} />
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          ) : null}

          {votePhaseOpen && snapshot.me && !snapshot.me.isEliminated ? (
            <Card>
              <View className="flex-row-reverse items-center gap-2"><Vote size={19} color="#f2c14e" /><SectionTitle title="مين يدخل السجن؟" caption="اختار مشتبه واحد وثبّت صوتك" /></View>
              <View className="w-full min-w-0 gap-2 md:flex-row-reverse md:flex-wrap">
                {alivePlayers.filter((player) => player.id !== snapshot.me?.playerId).map((player) => (
                  <View key={player.id} className="w-full min-w-0 md:w-[48%] md:flex-grow">
                    <PlayerCard
                      player={player}
                      compact
                      selected={selectedVote === player.id}
                      onPress={() => { setSelectedVote(player.id); void Haptics.selectionAsync(); }}
                      disabled={!snapshot.canVote}
                    />
                  </View>
                ))}
              </View>
              <Button label={snapshot.voteSubmitted ? 'صوتك اتحسب' : 'ثبّت صوتي'} onPress={submitVote} disabled={!selectedVote || !snapshot.canVote} loading={actionLoading} icon={snapshot.voteSubmitted ? <CheckCircle2 size={18} color="#050507" /> : <Vote size={18} color="#050507" />} />
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.isHost ? (
            <Card tone="gold">
              <View className="w-full min-w-0 gap-3 sm:flex-row-reverse sm:items-start sm:justify-between">
                <View className="min-w-0 flex-row-reverse items-center gap-3 sm:flex-1">
                  <Gavel size={20} color="#f2c14e" />
                  <View className="min-w-0 flex-1"><SectionTitle title="تحكم الـBoss" caption="إنت اللي بتحرك إيقاع الجولة" /></View>
                </View>
                <Pill label={`${snapshot.votesCast}/${snapshot.eligibleVoters} أصوات`} tone="gold" />
              </View>
              {snapshot.phase === 'voting' ? (
                <Button label="احسم التصويت" onPress={settleVote} loading={actionLoading} tone="red" icon={<Gavel size={18} color="#fff6dc" />} />
              ) : snapshot.phase === 'round_resolved' ? (
                <Button label="اكشف الدليل اللي بعده" onPress={() => void doAction(() => revealNextRound(code))} loading={actionLoading} icon={<Sparkles size={18} color="#050507" />} />
              ) : null}
            </Card>
          ) : null}

          {room.status === 'finished' ? (
            <Animated.View className="w-full min-w-0" entering={ZoomIn.springify().damping(16)}>
              <Card tone={room.winner === 'mafia' ? 'danger' : 'green'}>
                <Eyebrow>CASE CLOSED</Eyebrow>
                <View className="flex-row-reverse items-center gap-3">
                  {room.winner === 'mafia' ? <Skull size={34} color="#ef5d68" /> : <ShieldCheck size={34} color="#66d6a0" />}
                  <Text className={`min-w-0 flex-1 text-right text-2xl font-black sm:text-3xl ${room.winner === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>{room.winner === 'mafia' ? 'المافيا كسبت' : 'الأبرياء كسبوا'}</Text>
                </View>
                <Divider />
                <Body>{room.publicSolution ?? 'تم إغلاق ملف القضية.'}</Body>
              </Card>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
