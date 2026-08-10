import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Body, Button, Card, Divider, ErrorText, Eyebrow, Field, MiniStat, Pill, Screen, SectionTitle, Title } from '@/components/game-ui';
import {
  castVote,
  generateAndStartCase,
  getRoomSnapshot,
  joinRoom,
  normalizeRoomCode,
  resolveVote,
  revealNextRound,
  shareRoomUrl,
} from '@/lib/game';
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
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`w-full flex-row-reverse items-start gap-3 rounded-2xl border p-3.5 active:scale-[0.99] ${stateClass}`}>
      <View className={`h-11 w-11 items-center justify-center rounded-2xl border ${selected ? 'border-case-gold/50 bg-case-gold/15' : 'border-white/10 bg-noir-700'}`}>
        <Text className={`text-base font-black ${selected ? 'text-case-gold' : 'text-case-cream'}`}>{initial}</Text>
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row-reverse items-center justify-between gap-2">
          <Text className="text-right text-base font-black text-case-cream">{player.nickname}</Text>
          {player.isEliminated ? <Pill label="في السجن" tone="red" /> : selected ? <Pill label="اختيارك" tone="gold" /> : null}
        </View>
        {!compact && player.characterName ? <Text className="text-right text-xs font-black text-case-gold">{player.characterName}</Text> : null}
        {!compact && player.characterBio ? <Text className="text-right text-xs leading-5 text-case-muted">{player.characterBio}</Text> : null}
      </View>
    </Pressable>
  );
}

function ClueCard({ index, clue, prompt, active }: { index: number; clue: string; prompt: string; active: boolean }) {
  return (
    <Card tone={active ? 'gold' : 'default'}>
      <View className="flex-row-reverse items-center justify-between gap-3">
        <View className="flex-row-reverse items-center gap-3">
          <View className={`h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-case-gold' : 'bg-noir-700'}`}>
            <Text className={`font-black ${active ? 'text-noir-950' : 'text-case-cream'}`}>{index + 1}</Text>
          </View>
          <Text className="text-right text-lg font-black text-case-cream">الدليل {index + 1}</Text>
        </View>
        <Pill label={active ? 'الجولة الحالية' : 'مكشوف'} tone={active ? 'gold' : 'neutral'} />
      </View>
      <Text className="text-right text-base font-bold leading-8 text-case-cream">{clue}</Text>
      <Divider />
      <View className="flex-row-reverse items-start gap-2">
        <Text className="text-case-gold">؟</Text>
        <Text className="flex-1 text-right text-xs leading-5 text-case-muted">{prompt}</Text>
      </View>
    </Card>
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

  const submitJoin = async () => {
    if (nickname.trim().length < 2) {
      setError('اكتب اسمك الأول.');
      return;
    }
    await doAction(async () => {
      await joinRoom(code, nickname);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const share = async () => {
    const url = shareRoomUrl(code);
    await Share.share({ message: `ادخل روم آخر خيط — الكود ${code}\n${url}` });
  };

  const startGame = async () => {
    await doAction(async () => {
      const result = await generateAndStartCase(code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('القضية جاهزة', `اتولدت بنجاح${result.model ? ` باستخدام ${result.model}` : ''}.`);
    });
  };

  const submitVote = async () => {
    if (!selectedVote) return;
    await doAction(async () => {
      await castVote(code, selectedVote);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  };

  const settleVote = async () => {
    await doAction(async () => {
      const result = await resolveVote(code);
      if (result.status === 'pending') Alert.alert('لسه التصويت ناقص', `ناقص ${result.missing ?? 0} تصويت.`);
      else if (result.status === 'tie') Alert.alert('تعادل', 'الأصوات اتصفّرت. ناقشوا بسرعة وصوّتوا تاني.');
      else if (result.status === 'finished') Alert.alert('انتهت القضية', result.winner === 'innocents' ? 'الأبرياء كشفوا المافيا.' : 'المافيا كسبت.');
      else Alert.alert('إلى السجن', `${result.nickname} — ${result.role === 'mafia' ? 'مافيوزو' : 'بريء'}`);
    });
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
            <Text className="text-[10px] text-case-dim">Boss: {room.bossName}</Text>
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
        <Card tone="gold" className="mx-auto w-full max-w-xl">
          <SectionTitle title="اسمك على قائمة المشتبه فيهم" caption="ادخل قبل ما الـBoss يبدأ القضية" />
          {room.status !== 'lobby' ? <Body muted>القضية بدأت بالفعل، ومش بنقبل لاعبين جدد.</Body> : (
            <>
              <Field value={nickname} onChangeText={setNickname} placeholder="اكتب اسمك" maxLength={24} />
              <Button label="انضم للروم" onPress={submitJoin} loading={actionLoading} />
            </>
          )}
        </Card>
      ) : null}

      {room.status === 'lobby' ? (
        <View className="gap-5 lg:flex-row-reverse lg:items-start lg:gap-7">
          <View className="flex-1 gap-5">
            <Card tone="gold">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <SectionTitle title="اللوبي" caption="اجمع الناس، وبعدها القضية هتتكتب على عددكم" />
                <Pill label={lobbyReady ? 'جاهزين' : 'مستنيين'} tone={lobbyReady ? 'green' : 'gold'} />
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-noir-700">
                <View style={{ width: progress }} className={`h-full rounded-full ${lobbyReady ? 'bg-case-green' : 'bg-case-gold'}`} />
              </View>
              <Button label="شارك رابط الروم" onPress={() => void share()} tone="dark" />
            </Card>

            {snapshot.isHost ? (
              <Card>
                <View className="flex-row-reverse items-start justify-between gap-3">
                  <SectionTitle title="لوحة الـBoss" caption={`الصعوبة: ${room.difficulty} • الجو: ${room.theme}`} />
                  <Pill label="HOST" tone="gold" />
                </View>
                <Button
                  label={snapshot.playerCount < 4 ? 'محتاجين 4 لاعبين على الأقل' : 'ولّد القضية وابدأ'}
                  onPress={startGame}
                  disabled={snapshot.playerCount < 4}
                  loading={actionLoading}
                />
                <Text className="text-right text-[10px] leading-5 text-case-dim">القضية بتتولد مرة واحدة وتتخزن للروم كله.</Text>
              </Card>
            ) : !isOutsider ? <Card><Body muted>إنت جوه. استنى الـBoss يبدأ القضية.</Body></Card> : null}
          </View>

          <View className="flex-1 gap-3 lg:max-w-[470px]">
            <SectionTitle title="الموجودين" caption={`${snapshot.playerCount} دخلوا لحد دلوقتي`} />
            {snapshot.players.map((player) => <PlayerCard key={player.id} player={player} compact />)}
            {!snapshot.players.length ? <Card><Body muted>لسه مفيش مشتبه فيهم. ابعت الرابط لأول لاعب.</Body></Card> : null}
          </View>
        </View>
      ) : null}

      {room.status !== 'lobby' ? (
        <View className="gap-6">
          <Card tone="gold">
            <Eyebrow>CASE BRIEF</Eyebrow>
            <Body className="text-base leading-8">{room.premise ?? ''}</Body>
          </Card>

          {snapshot.me ? (
            <Card tone={roleVisible && snapshot.me.role === 'mafia' ? 'danger' : roleVisible ? 'green' : 'default'} className="overflow-hidden">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <SectionTitle title="دورك السري" caption="خلي الشاشة بعيد عن العيون" />
                <Pill label="PRIVATE" tone="gold" />
              </View>
              {roleVisible ? (
                <View className="items-center gap-3 py-4">
                  <Text className={`text-center text-4xl font-black ${snapshot.me.role === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>
                    {snapshot.me.role === 'mafia' ? 'أنت مافيوزو' : 'أنت بريء'}
                  </Text>
                  <Text className="max-w-lg text-center text-xs leading-5 text-case-muted">
                    {snapshot.me.role === 'mafia' ? 'في مافيوزو غيرك وسط الناس، وإنت مش عارف مين.' : 'حلّ القضية قبل ما الأبرياء يدخلوا السجن.'}
                  </Text>
                </View>
              ) : <Text className="py-5 text-center text-3xl">◉</Text>}
              <Button label={roleVisible ? 'اخفي دوري' : 'اكشف دوري'} tone={roleVisible && snapshot.me.role === 'mafia' ? 'red' : 'dark'} onPress={() => setRoleVisible((v) => !v)} />
            </Card>
          ) : null}

          <View className="gap-3">
            <SectionTitle title="المشتبه فيهم" caption="كل المعلومات دي علنية" />
            <View className="gap-3 md:flex-row-reverse md:flex-wrap">
              {snapshot.players.map((player) => (
                <View key={player.id} className="w-full md:w-[48%] md:flex-grow">
                  <PlayerCard player={player} />
                </View>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <SectionTitle title="الأدلة" caption="كل دليل يفتح احتمالات أكتر مما يقفلها" />
            {snapshot.rounds.map((round) => (
              <ClueCard key={round.roundIndex} index={round.roundIndex} clue={round.clue} prompt={round.discussionPrompt} active={round.roundIndex === room.roundIndex} />
            ))}
          </View>

          {snapshot.eliminations.length ? (
            <Card tone="danger">
              <SectionTitle title="السجن" caption="الأدوار اللي اتكشفت لحد دلوقتي" />
              <View className="gap-2">
                {snapshot.eliminations.map((item) => (
                  <View key={item.playerId} className="flex-row-reverse items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                    <Text className="font-black text-case-cream">{item.nickname}</Text>
                    <Pill label={item.revealedRole === 'mafia' ? 'مافيوزو' : 'بريء'} tone={item.revealedRole === 'mafia' ? 'red' : 'green'} />
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.me && !snapshot.me.isEliminated && room.lastResolvedRound < room.roundIndex ? (
            <Card>
              <SectionTitle title="مين يدخل السجن؟" caption="اختار مشتبه واحد وثبّت صوتك" />
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
              <Button label={snapshot.voteSubmitted ? 'صوتك اتحسب' : 'ثبّت صوتي'} onPress={submitVote} disabled={!selectedVote || snapshot.voteSubmitted} loading={actionLoading} />
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.isHost ? (
            <Card tone="gold">
              <View className="flex-row-reverse items-start justify-between gap-3">
                <SectionTitle title="تحكم الـBoss" caption="إنت اللي بتحرك إيقاع الجولة" />
                <Pill label={`${snapshot.votesCast}/${snapshot.eligibleVoters} أصوات`} tone="gold" />
              </View>
              {room.lastResolvedRound < room.roundIndex ? (
                <Button label="احسم التصويت" onPress={settleVote} loading={actionLoading} tone="red" />
              ) : (
                <Button label="اكشف الدليل اللي بعده" onPress={() => doAction(() => revealNextRound(code))} loading={actionLoading} />
              )}
            </Card>
          ) : null}

          {room.status === 'finished' ? (
            <Card tone={room.winner === 'mafia' ? 'danger' : 'green'}>
              <Eyebrow>CASE CLOSED</Eyebrow>
              <Text className={`text-right text-3xl font-black ${room.winner === 'mafia' ? 'text-case-red' : 'text-case-green'}`}>
                {room.winner === 'mafia' ? 'المافيا كسبت' : 'الأبرياء كسبوا'}
              </Text>
              <Divider />
              <Body>{room.publicSolution ?? 'تم إغلاق ملف القضية.'}</Body>
            </Card>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
