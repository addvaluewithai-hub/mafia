import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  Gavel,
  LockKeyhole,
  QrCode,
  Share2,
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
import { Body, Button, Card, Divider, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import {
  castVote,
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
import type { PlayerState, RoomSnapshot } from '@/lib/types';

function PlayerCard({ player, selected, onPress, compact = false, disabled = false }: {
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
    <Animated.View entering={FadeInUp.duration(220)} layout={LinearTransition.duration(180)}>
      <Pressable
        disabled={disabled || !onPress}
        onPress={onPress}
        className={`w-full flex-row-reverse items-start gap-3 rounded-2xl border p-3.5 active:scale-[0.99] ${stateClass}`}>
        <View className={`h-11 w-11 items-center justify-center rounded-2xl border ${selected ? 'border-case-gold/50 bg-case-gold/15' : 'border-white/10 bg-noir-700'}`}>
          {player.isEliminated ? <LockKeyhole size={18} color="#ef5d68" strokeWidth={2.2} /> : <Text className={`text-base font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{initial}</Text>}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row-reverse items-center justify-between gap-2">
            <Text selectable className="text-right text-base font-black text-case-cream">{player.nickname}</Text>
            {player.isEliminated ? <Pill label="في السجن" tone="red" /> : selected ? <Pill label="اختيارك" tone="gold" /> : null}
          </View>
          {!compact && player.characterName ? <Text selectable className="text-right text-xs font-black text-case-gold">{player.characterName}</Text> : null}
          {!compact && player.characterBio ? <Text selectable className="text-right text-xs leading-5 text-case-muted">{player.characterBio}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ClueCard({ index, clue, prompt, active }: { index: number; clue: string; prompt: string; active: boolean }) {
  return (
    <Animated.View entering={FadeInDown.duration(280)}>
      <Card tone={active ? 'gold' : 'default'}>
        <View className="flex-row-reverse items-center justify-between gap-3">
          <View className="flex-row-reverse items-center gap-3">
            <View className={`h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-case-gold' : 'bg-noir-700'}`}>
              <Sparkles size={19} color={active ? '#050507' : '#fff6dc'} strokeWidth={2.2} />
            </View>
            <View>
              <Text className="text-right text-lg font-black text-case-cream">الدليل {index + 1}</Text>
              <Text className="text-right text-[10px] text-case-dim">ROUND {index + 1}</Text>
            </View>
          </View>
          <Pill label={active ? 'الجولة الحالية' : 'مكشوف'} tone={active ? 'gold' : 'neutral'} />
        </View>
        <Text selectable className="text-right text-base font-bold leading-8 text-case-cream">{clue}</Text>
        <Divider />
        <View className="flex-row-reverse items-start gap-2">
          <View className="mt-1 h-6 w-6 items-center justify-center rounded-lg bg-case-gold/10">
            <Text className="font-black text-case-gold">؟</Text>
          </View>
          <Text selectable className="flex-1 text-right text-xs leading-5 text-case-muted">{prompt}</Text>
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
  const [roleVisible, setRoleVisible] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      setError(err instanceof Error ? err.message : 'تعذر تحميل الروم');
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

  const alivePlayers = useMemo(() => snapshot?.players.filter((player) => !player.isEliminated) ?? [], [snapshot?.players]);

  const doAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حصلت مشكلة');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !snapshot) {
    return (
      <Screen>
        <View className="min-h-[600px] justify-center">
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
        <View className="min-h-[600px] justify-center gap-3">
          <ErrorText message={error || 'الروم مش موجود.'} />
          <Button label="حاول تاني" onPress={() => void refresh()} tone="dark" />
        </View>
      </Screen>
    );
  }

  const { room } = snapshot;
  const isOutsider = !snapshot.isHost && !snapshot.me;
  const lobbyReady = snapshot.playerCount >= 4;
  const progress = `${Math.min(100, (snapshot.playerCount / room.maxPlayers) * 100)}%` as `${number}%`;
  const roomUrl = shareRoomUrl(code);

  const submitJoin = async () => {
    if (nickname.trim().length < 2) {
      setError('اكتب اسمك الأول.');
      return;
    }
    await doAction(async () => {
      await joinRoom(code, nickname);
      void playGameSfx('success');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const share = async () => {
    await Share.share({ message: `ادخل روم آخر خيط — الكود ${code}\n${roomUrl}` });
  };

  const copyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        void playGameSfx('vote');
        setTimeout(() => setCopied(false), 1600);
      } else {
        await Share.share({ message: code });
      }
    } catch {
      await Share.share({ message: code });
    }
  };

  const startGame = async () => {
    await doAction(async () => {
      const result = await generateAndStartCase(code);
      void playGameSfx('reveal');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('القضية جاهزة', `اتولدت بنجاح${result.model ? ` باستخدام ${result.model}` : ''}.`);
    });
  };

  const submitVote = async () => {
    if (!selectedVote) return;
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

  const revealNext = async () => {
    await doAction(() => revealNextRound(code));
  };

  return (
    <Screen>
      <View className="gap-4 pt-2">
        <View className="gap-4 sm:flex-row-reverse sm:items-end sm:justify-between">
          <View className="flex-1 gap-2">
            <Eyebrow>{room.status === 'lobby' ? 'WAITING ROOM' : room.status === 'playing' ? 'LIVE INVESTIGATION' : 'CASE CLOSED'}</Eyebrow>
            <Title className="text-3xl sm:text-4xl">{room.title ?? 'غرفة التحقيق'}</Title>
          </View>
          <View className="items-end gap-2">
            <Pill label={code} tone="gold" />
            <Text selectable className="text-[10px] text-case-dim">Boss: {room.bossName}</Text>
          </View>
        </View>
        <View className="flex-row-reverse flex-wrap gap-2">
          <MiniStat value={`${snapshot.playerCount}/${room.maxPlayers}`} label="لاعبين" />
          <MiniStat value={`${room.mafiaCount}`} label="مافيا" />
          <MiniStat value={room.status === 'lobby' ? 'LOBBY' : room.status === 'playing' ? `R${room.roundIndex + 1}` : 'END'} label="الحالة" />
        </View>
      </View>

      {error ? <ErrorText message={error} /> : null}

      {isOutsider ? (
        <Animated.View entering={FadeInDown.duration(260)}>
          <Card tone="gold" className="mx-auto w-full max-w-xl">
            <SectionTitle title="اسمك على قائمة المشتبه فيهم" caption="ادخل قبل ما الـBoss يبدأ القضية" />
            {room.status !== 'lobby' ? <Body muted>القضية بدأت بالفعل، ومش بنقبل لاعبين جدد.</Body> : (
              <>
                <Field value={nickname} onChangeText={setNickname} placeholder="اكتب اسمك" maxLength={24} />
                <Button label="انضم للروم" onPress={submitJoin} loading={actionLoading} icon={<UserRound size={18} color="#050507" strokeWidth={2.3} />} />
              </>
            )}
          </Card>
        </Animated.View>
      ) : null}

      {room.status === 'lobby' ? (
        <View className="gap-5 lg:flex-row-reverse lg:items-start lg:gap-7">
          <View className="flex-1 gap-5">
            <Card tone="gold">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <View className="flex-row-reverse items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-case-gold/10">
                    <Users size={20} color="#f2c14e" strokeWidth={2.2} />
                  </View>
                  <SectionTitle title="اللوبي" caption="اجمع الناس، وبعدها القضية هتتكتب على عددكم" />
                </View>
                <Pill label={lobbyReady ? 'جاهزين' : 'مستنيين'} tone={lobbyReady ? 'green' : 'gold'} />
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-noir-700">
                <View style={{ width: progress }} className={`h-full rounded-full ${lobbyReady ? 'bg-case-green' : 'bg-case-gold'}`} />
              </View>
            </Card>

            <Card>
              <View className="gap-1">
                <View className="flex-row-reverse items-center gap-2">
                  <QrCode size={18} color="#f2c14e" strokeWidth={2.2} />
                  <Text className="text-right text-lg font-black text-case-cream">دخّل الناس بسرعة</Text>
                </View>
                <Text className="text-right text-xs leading-5 text-case-dim">امسح الـQR أو ابعت الكود والرابط.</Text>
              </View>

              <View className="items-center py-2">
                <View className="rounded-[24px] bg-case-cream p-3">
                  <QRCode value={roomUrl} size={168} color="#050507" backgroundColor="#fff6dc" />
                </View>
                <Text selectable className="pt-3 text-3xl font-black tracking-[5px] text-case-gold">{code}</Text>
              </View>

              <View className="flex-row-reverse gap-2">
                <Button
                  className="flex-1"
                  label={copied ? 'اتنسخ' : 'انسخ الكود'}
                  onPress={() => void copyCode()}
                  tone="dark"
                  icon={copied ? <CheckCircle2 size={17} color="#66d6a0" /> : <Copy size={17} color="#f2c14e" />}
                />
                <Button className="flex-1" label="شارك الرابط" onPress={() => void share()} tone="dark" icon={<Share2 size={17} color="#f2c14e" />} />
              </View>
            </Card>

            {snapshot.isHost ? (
              <Card>
                <View className="flex-row-reverse items-start justify-between gap-3">
                  <View className="flex-row-reverse items-center gap-3">
                    <Gavel size={20} color="#f2c14e" strokeWidth={2.2} />
                    <SectionTitle title="لوحة الـBoss" caption={`الصعوبة: ${room.difficulty} • الجو: ${room.theme}`} />
                  </View>
                  <Pill label="HOST" tone="gold" />
                </View>
                <Button
                  label={snapshot.playerCount < 4 ? 'محتاجين 4 لاعبين على الأقل' : 'ولّد القضية وابدأ'}
                  onPress={startGame}
                  disabled={snapshot.playerCount < 4}
                  loading={actionLoading}
                  icon={<Sparkles size={18} color="#050507" strokeWidth={2.3} />}
                />
                <Text className="text-right text-[10px] leading-5 text-case-dim">القضية بتتولد مرة واحدة وتتخزن للروم كله.</Text>
              </Card>
            ) : !isOutsider ? <Card><Body muted>إنت جوه. استنى الـBoss يبدأ القضية.</Body></Card> : null}
          </View>

          <View className="flex-1 gap-3 lg:max-w-[470px]">
            <View className="flex-row-reverse items-center gap-2">
              <Clipboard size={18} color="#a6a7b2" />
              <SectionTitle title="الموجودين" caption={`${snapshot.playerCount} دخلوا لحد دلوقتي`} />
            </View>
            {snapshot.players.map((player) => <PlayerCard key={player.id} player={player} compact />)}
            {!snapshot.players.length ? <Card><Body muted>لسه مفيش مشتبه فيهم. ابعت الرابط لأول لاعب.</Body></Card> : null}
          </View>
        </View>
      ) : null}

      {room.status !== 'lobby' ? (
        <View className="gap-6">
          <Animated.View entering={FadeInDown.duration(260)}>
            <Card tone="gold">
              <View className="flex-row-reverse items-center gap-3">
                <ShieldCheck size={20} color="#f2c14e" />
                <Eyebrow>CASE BRIEF</Eyebrow>
              </View>
              <Body className="text-base leading-8">{room.premise ?? ''}</Body>
            </Card>
          </Animated.View>

          {snapshot.me ? (
            <Card tone={roleVisible && snapshot.me.role === 'mafia' ? 'danger' : roleVisible ? 'green' : 'default'} className="overflow-hidden">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <View className="flex-row-reverse items-center gap-3">
                  <LockKeyhole size={20} color="#f2c14e" />
                  <SectionTitle title="دورك السري" caption="خلي الشاشة بعيد عن العيون" />
                </View>
                <Pill label="PRIVATE" tone="gold" />
              </View>
              {roleVisible ? (
                <Animated.View entering={ZoomIn.springify().damping(16)} className="items-center gap-3 py-5">
                  {snapshot.me.role === 'mafia' ? <Skull size={42} color="#ef5d68" strokeWidth={1.8} /> : <ShieldCheck size={42} color="#66d6a0" strokeWidth={1.8} />}
                  <Text className={`text-center text-4xl font-black ${snapshot.me.role === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>
                    {snapshot.me.role === 'mafia' ? 'أنت مافيوزو' : 'أنت بريء'}
                  </Text>
                  <Text className="max-w-lg text-center text-xs leading-5 text-case-muted">
                    {snapshot.me.role === 'mafia' ? 'في مافيوزو غيرك وسط الناس، وإنت مش عارف مين.' : 'حلّ القضية قبل ما الأبرياء يدخلوا السجن.'}
                  </Text>
                </Animated.View>
              ) : (
                <View className="items-center py-6">
                  <EyeOff size={36} color="#6e707e" strokeWidth={1.7} />
                </View>
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

          {room.status === 'playing' && room.lastResolvedRound < room.roundIndex ? (
            <DiscussionTimer
              endsAt={room.timerEndsAt}
              durationSeconds={room.timerDurationSeconds}
              isHost={snapshot.isHost}
              disabled={actionLoading}
              onRestart={async (seconds) => {
                await doAction(() => restartDiscussionTimer(code, seconds));
              }}
            />
          ) : null}

          <View className="gap-3">
            <View className="flex-row-reverse items-center gap-2">
              <Users size={18} color="#a6a7b2" />
              <SectionTitle title="المشتبه فيهم" caption="كل المعلومات دي علنية" />
            </View>
            <View className="gap-3 md:flex-row-reverse md:flex-wrap">
              {snapshot.players.map((player) => (
                <View key={player.id} className="w-full md:w-[48%] md:flex-grow">
                  <PlayerCard player={player} />
                </View>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row-reverse items-center gap-2">
              <Sparkles size={18} color="#f2c14e" />
              <SectionTitle title="الأدلة" caption="كل دليل يفتح احتمالات أكتر مما يقفلها" />
            </View>
            {snapshot.rounds.map((round) => (
              <ClueCard key={round.roundIndex} index={round.roundIndex} clue={round.clue} prompt={round.discussionPrompt} active={round.roundIndex === room.roundIndex} />
            ))}
          </View>

          {snapshot.eliminations.length ? (
            <Animated.View entering={FadeInDown.duration(240)}>
              <Card tone="danger">
                <View className="flex-row-reverse items-center gap-2">
                  <LockKeyhole size={18} color="#ef5d68" />
                  <SectionTitle title="السجن" caption="الأدوار اللي اتكشفت لحد دلوقتي" />
                </View>
                <View className="gap-2">
                  {snapshot.eliminations.map((item) => (
                    <View key={item.playerId} className="flex-row-reverse items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                      <Text selectable className="font-black text-case-cream">{item.nickname}</Text>
                      <Pill label={item.revealedRole === 'mafia' ? 'مافيوزو' : 'بريء'} tone={item.revealedRole === 'mafia' ? 'red' : 'green'} />
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          ) : null}

          {room.status === 'playing' && snapshot.me && !snapshot.me.isEliminated && room.lastResolvedRound < room.roundIndex ? (
            <Card>
              <View className="flex-row-reverse items-center gap-2">
                <Vote size={19} color="#f2c14e" />
                <SectionTitle title="مين يدخل السجن؟" caption="اختار مشتبه واحد وثبّت صوتك" />
              </View>
              <View className="gap-2 md:flex-row-reverse md:flex-wrap">
                {alivePlayers.filter((player) => player.id !== snapshot.me?.playerId).map((player) => (
                  <View key={player.id} className="w-full md:w-[48%] md:flex-grow">
                    <PlayerCard
                      player={player}
                      compact
                      selected={selectedVote === player.id}
                      onPress={() => {
                        setSelectedVote(player.id);
                        void Haptics.selectionAsync();
                      }}
                      disabled={snapshot.voteSubmitted}
                    />
                  </View>
                ))}
              </View>
              <Button
                label={snapshot.voteSubmitted ? 'صوتك اتحسب' : 'ثبّت صوتي'}
                onPress={submitVote}
                disabled={!selectedVote || snapshot.voteSubmitted}
                loading={actionLoading}
                icon={snapshot.voteSubmitted ? <CheckCircle2 size={18} color="#050507" /> : <Vote size={18} color="#050507" />}
              />
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.isHost ? (
            <Card tone="gold">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <View className="flex-row-reverse items-center gap-3">
                  <Gavel size={20} color="#f2c14e" />
                  <SectionTitle title="تحكم الـBoss" caption="إنت اللي بتحرك إيقاع الجولة" />
                </View>
                <Pill label={`${snapshot.votesCast}/${snapshot.eligibleVoters} أصوات`} tone="gold" />
              </View>
              {room.lastResolvedRound < room.roundIndex ? (
                <Button label="احسم التصويت" onPress={settleVote} loading={actionLoading} tone="red" icon={<Gavel size={18} color="#fff6dc" />} />
              ) : (
                <Button label="اكشف الدليل اللي بعده" onPress={revealNext} loading={actionLoading} icon={<Sparkles size={18} color="#050507" />} />
              )}
            </Card>
          ) : null}

          {room.status === 'finished' ? (
            <Animated.View entering={ZoomIn.springify().damping(16)}>
              <Card tone={room.winner === 'mafia' ? 'danger' : 'green'}>
                <Eyebrow>CASE CLOSED</Eyebrow>
                <View className="flex-row-reverse items-center gap-3">
                  {room.winner === 'mafia' ? <Skull size={34} color="#ef5d68" /> : <ShieldCheck size={34} color="#66d6a0" />}
                  <Text className={`text-right text-3xl font-black ${room.winner === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>
                    {room.winner === 'mafia' ? 'المافيا كسبت' : 'الأبرياء كسبوا'}
                  </Text>
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
