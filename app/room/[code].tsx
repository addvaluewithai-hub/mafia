import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Divider,
  ErrorText,
  Eyebrow,
  Field,
  MiniStat,
  Pill,
  Screen,
  SectionTitle,
  Title,
} from '@/components/game-ui';
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
import { colors, rtlText } from '@/lib/theme';
import type { PlayerState, RoomSnapshot } from '@/lib/types';

function PlayerRow({
  player,
  selected,
  onPress,
  disabled,
  compact = false,
}: {
  player: PlayerState;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const initial = (player.nickname.trim()[0] ?? '?').toUpperCase();
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row-reverse',
        alignItems: compact ? 'center' : 'flex-start',
        gap: 12,
        padding: compact ? 12 : 14,
        borderRadius: 19,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: selected ? colors.gold2 : player.isEliminated ? '#54272C' : colors.border,
        backgroundColor: selected ? colors.goldSoft : player.isEliminated ? '#1B1012' : colors.surface2,
        opacity: player.isEliminated ? 0.58 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}>
      <View
        style={{
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 15,
          backgroundColor: selected ? '#3A2E13' : colors.surface3,
          borderWidth: 1,
          borderColor: selected ? colors.gold2 : colors.border,
        }}>
        <Text style={{ color: selected ? colors.gold : colors.text, fontSize: 17, fontWeight: '900' }}>{initial}</Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text selectable style={{ ...rtlText, color: colors.text, fontSize: 16, fontWeight: '900' }}>{player.nickname}</Text>
          {player.isEliminated ? <Pill label="في السجن" tone="red" /> : selected ? <Pill label="اختيارك" tone="gold" /> : null}
        </View>
        {!compact && player.characterName ? (
          <Text selectable style={{ ...rtlText, color: colors.gold, fontSize: 13, fontWeight: '900' }}>{player.characterName}</Text>
        ) : null}
        {!compact && player.characterBio ? (
          <Text selectable style={{ ...rtlText, color: colors.muted, fontSize: 13, lineHeight: 21 }}>{player.characterBio}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ClueCard({ roundIndex, clue, prompt, active }: { roundIndex: number; clue: string; prompt: string; active: boolean }) {
  return (
    <View
      style={{
        gap: 13,
        padding: 17,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: active ? '#69531F' : colors.border,
        backgroundColor: active ? '#15130E' : colors.surface,
      }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.gold : colors.surface3 }}>
            <Text style={{ color: active ? colors.ink : colors.text, fontWeight: '900' }}>{roundIndex + 1}</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>الدليل {roundIndex + 1}</Text>
        </View>
        {active ? <Pill label="الجولة الحالية" tone="gold" /> : <Pill label="مكشوف" />}
      </View>
      <Text selectable style={{ ...rtlText, color: colors.text, fontSize: 17, lineHeight: 28, fontWeight: '800' }}>{clue}</Text>
      <Divider />
      <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' }}>
        <Text style={{ color: colors.gold, fontSize: 15 }}>؟</Text>
        <Text style={{ ...rtlText, flex: 1, color: colors.muted, fontSize: 13, lineHeight: 21 }}>{prompt}</Text>
      </View>
    </View>
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!snapshot?.room.id) return;
    return subscribeToRoomEvents(snapshot.room.id, () => void refresh());
  }, [snapshot?.room.id, refresh]);

  useEffect(() => {
    setSelectedVote(null);
  }, [snapshot?.room.roundIndex]);

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
      setError(err instanceof Error ? err.message : 'حصلت مشكلة');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !snapshot) {
    return (
      <Screen>
        <View style={{ minHeight: 560, justifyContent: 'center' }}>
          <Card accent>
            <Eyebrow>CASE FILE</Eyebrow>
            <Title size={28}>بنفتح ملف القضية...</Title>
            <Body muted>ثواني ونجمع كل اللي حصل في الروم.</Body>
          </Card>
        </View>
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen>
        <View style={{ minHeight: 560, justifyContent: 'center', gap: 12 }}>
          <ErrorText message={error || 'الروم مش موجود.'} />
          <Button label="حاول تاني" onPress={() => void refresh()} tone="dark" />
        </View>
      </Screen>
    );
  }

  const { room } = snapshot;
  const isOutsider = !snapshot.isHost && !snapshot.me;
  const lobbyReady = snapshot.playerCount >= 4;

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
      if (result.status === 'pending') {
        Alert.alert('لسه التصويت ناقص', `ناقص ${result.missing ?? 0} تصويت.`);
      } else if (result.status === 'tie') {
        Alert.alert('تعادل', 'الأصوات اتصفّرت. 30 ثانية دفاع لكل مشتبه وبعدها صوّتوا تاني.');
      } else if (result.status === 'finished') {
        Alert.alert('انتهت القضية', result.winner === 'innocents' ? 'الأبرياء كشفوا المافيا.' : 'المافيا ضحكت عليكم وكسبت.');
      } else {
        Alert.alert('إلى السجن', `${result.nickname} — ${result.role === 'mafia' ? 'مافيوزو' : 'بريء'}`);
      }
    });
  };

  return (
    <Screen>
      <View style={{ gap: 12, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Eyebrow>{room.status === 'lobby' ? 'WAITING ROOM' : room.status === 'playing' ? 'LIVE INVESTIGATION' : 'CASE CLOSED'}</Eyebrow>
            <Title size={34}>{room.title ?? 'غرفة التحقيق'}</Title>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Pill label={code} tone="gold" />
            <Text style={{ color: colors.muted2, fontSize: 11 }}>Boss: {room.bossName}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' }}>
          <MiniStat value={`${snapshot.playerCount}/${room.maxPlayers}`} label="لاعبين" />
          <MiniStat value={`${room.mafiaCount}`} label="مافيا" />
          <MiniStat value={room.status === 'lobby' ? 'LOBBY' : room.status === 'playing' ? `R${room.roundIndex + 1}` : 'END'} label="الحالة" />
        </View>
      </View>

      {error ? <ErrorText message={error} /> : null}

      {isOutsider ? (
        <Card accent>
          <SectionTitle title="اسمك على قائمة المشتبه فيهم" caption="ادخل قبل ما الـBoss يبدأ القضية" />
          {room.status !== 'lobby' ? (
            <Body muted>القضية بدأت بالفعل، ومش بنقبل لاعبين جدد بعد البداية.</Body>
          ) : (
            <>
              <Field value={nickname} onChangeText={setNickname} placeholder="اكتب اسمك" maxLength={24} />
              <Button label="انضم للروم" onPress={submitJoin} loading={actionLoading} />
            </>
          )}
        </Card>
      ) : null}

      {room.status === 'lobby' ? (
        <>
          <Card accent>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <SectionTitle title="اللوبي" caption="اجمع الناس الأول، وبعدها القضية هتتكتب على عددكم" />
              </View>
              <Pill label={lobbyReady ? 'جاهزين' : 'مستنيين'} tone={lobbyReady ? 'green' : 'gold'} />
            </View>
            <View style={{ height: 7, borderRadius: 99, backgroundColor: colors.surface3, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min(100, (snapshot.playerCount / room.maxPlayers) * 100)}%`, borderRadius: 99, backgroundColor: lobbyReady ? colors.green : colors.gold }} />
            </View>
            <Button label="شارك رابط الروم" onPress={() => void share()} tone="dark" />
          </Card>

          <View style={{ gap: 10 }}>
            <SectionTitle title="الموجودين" caption={`${snapshot.playerCount} دخلوا لحد دلوقتي`} />
            {snapshot.players.map((player) => <PlayerRow key={player.id} player={player} compact />)}
            {!snapshot.players.length ? (
              <Card><Body muted>لسه مفيش مشتبه فيهم. ابعت الرابط وخلي أول واحد يدخل.</Body></Card>
            ) : null}
          </View>

          {snapshot.isHost ? (
            <Card>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <SectionTitle title="لوحة الـBoss" caption={`الصعوبة: ${room.difficulty} • الجو: ${room.theme}`} />
                <Pill label="HOST" tone="gold" />
              </View>
              <Button
                label={snapshot.playerCount < 4 ? 'محتاجين 4 لاعبين على الأقل' : 'ولّد القضية وابدأ'}
                onPress={startGame}
                disabled={snapshot.playerCount < 4}
                loading={actionLoading}
              />
              <Text style={{ ...rtlText, color: colors.muted2, fontSize: 11, lineHeight: 18 }}>الـAI هيولد القضية مرة واحدة ويحفظها للروم كله.</Text>
            </Card>
          ) : !isOutsider ? (
            <Card><Body muted>إنت جوه. استنى الـBoss يبدأ القضية.</Body></Card>
          ) : null}
        </>
      ) : null}

      {room.status !== 'lobby' ? (
        <>
          <Card accent>
            <Pill label="ملف القضية" tone="gold" />
            <Body>{room.premise ?? ''}</Body>
          </Card>

          {snapshot.me ? (
            <View
              style={{
                gap: 14,
                padding: 20,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: roleVisible ? (snapshot.me.role === 'mafia' ? '#7B3038' : '#285B44') : colors.border,
                backgroundColor: roleVisible ? (snapshot.me.role === 'mafia' ? colors.redSoft : colors.greenSoft) : colors.surface,
              }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <SectionTitle title="دورك السري" caption="خلي الشاشة بعيد عن الناس" />
                <Pill label="سري جدًا" tone={roleVisible && snapshot.me.role === 'mafia' ? 'red' : roleVisible ? 'green' : 'gold'} />
              </View>

              {roleVisible ? (
                <View style={{ minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Text style={{ color: snapshot.me.role === 'mafia' ? colors.red : colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2 }}>YOU ARE</Text>
                  <Text selectable style={{ color: snapshot.me.role === 'mafia' ? colors.red : colors.green, fontWeight: '900', fontSize: 42, textAlign: 'center' }}>
                    {snapshot.me.role === 'mafia' ? 'مافيوزو' : 'بريء'}
                  </Text>
                  <Text style={{ ...rtlText, color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: 'center' }}>
                    {snapshot.me.role === 'mafia' ? 'في مافيوزو تاني وسطكم — وإنت مش عارف هو مين.' : 'اربط الأدلة، واكشف المافيا قبل ما الأبرياء يدخلوا السجن.'}
                  </Text>
                </View>
              ) : (
                <View style={{ minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 34 }}>◉</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>اضغط لما محدش يكون باصص</Text>
                </View>
              )}

              <Button
                label={roleVisible ? 'اخفي دوري فورًا' : 'اكشف دوري'}
                tone={roleVisible && snapshot.me.role === 'mafia' ? 'red' : 'dark'}
                onPress={() => {
                  setRoleVisible((value) => !value);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <SectionTitle title="المشتبه فيهم" caption="كل المعلومات دي علنية — الكذب والتفسير عليكم" />
            {snapshot.players.map((player) => <PlayerRow key={player.id} player={player} />)}
          </View>

          <View style={{ gap: 12 }}>
            <SectionTitle title="لوحة الأدلة" caption="كل دليل لوحده مش كفاية. اربط اللي اتكشف ببعضه." />
            {snapshot.rounds.map((round) => (
              <ClueCard
                key={round.roundIndex}
                roundIndex={round.roundIndex}
                clue={round.clue}
                prompt={round.discussionPrompt}
                active={round.roundIndex === room.roundIndex}
              />
            ))}
          </View>

          {snapshot.eliminations.length ? (
            <Card danger>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle title="سجل السجن" caption="اللي خرج خلاص ممنوع يتكلم أو يصوّت" />
                <Pill label={`${snapshot.eliminations.length}`} tone="red" />
              </View>
              <Divider />
              {snapshot.eliminations.map((item) => (
                <View key={item.playerId} style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>{item.nickname}</Text>
                  <Pill label={item.revealedRole === 'mafia' ? 'مافيوزو' : 'بريء'} tone={item.revealedRole === 'mafia' ? 'red' : 'green'} />
                </View>
              ))}
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.me && !snapshot.me.isEliminated && room.lastResolvedRound < room.roundIndex ? (
            <Card accent>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <SectionTitle title="مين يدخل السجن؟" caption="اختار مشتبه واحد وثبّت صوتك" />
                <Pill label={`R${room.roundIndex + 1}`} tone="gold" />
              </View>
              <View style={{ gap: 8 }}>
                {alivePlayers
                  .filter((player) => player.id !== snapshot.me?.playerId)
                  .map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      compact
                      selected={selectedVote === player.id}
                      onPress={() => {
                        setSelectedVote(player.id);
                        void Haptics.selectionAsync();
                      }}
                      disabled={snapshot.voteSubmitted}
                    />
                  ))}
              </View>
              <Button
                label={snapshot.voteSubmitted ? 'صوتك اتحسب ✓' : 'ثبّت صوتي'}
                onPress={submitVote}
                disabled={!selectedVote || snapshot.voteSubmitted}
                loading={actionLoading}
              />
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.isHost ? (
            <Card>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <SectionTitle title="تحكم الـBoss" caption="إنت اللي بتحرك الجولة للجميع" />
                <Pill label="HOST" tone="gold" />
              </View>
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                <MiniStat value={`${snapshot.votesCast}`} label="صوّتوا" />
                <MiniStat value={`${snapshot.eligibleVoters}`} label="مطلوب" />
              </View>
              {room.lastResolvedRound < room.roundIndex ? (
                <Button label="احسم التصويت واكشف النتيجة" onPress={settleVote} loading={actionLoading} tone="red" />
              ) : (
                <Button label="اكشف الدليل اللي بعده" onPress={() => doAction(() => revealNextRound(code))} loading={actionLoading} />
              )}
            </Card>
          ) : null}

          {room.status === 'finished' ? (
            <View
              style={{
                gap: 16,
                padding: 22,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: room.winner === 'mafia' ? '#743039' : '#2D684E',
                backgroundColor: room.winner === 'mafia' ? colors.redSoft : colors.greenSoft,
              }}>
              <Eyebrow>CASE CLOSED</Eyebrow>
              <Title size={34}>{room.winner === 'mafia' ? 'المافيا كسبت' : 'الأبرياء كسبوا'}</Title>
              <Pill label={room.winner === 'mafia' ? 'MAFIA WIN' : 'INNOCENTS WIN'} tone={room.winner === 'mafia' ? 'red' : 'green'} />
              <Divider />
              <SectionTitle title="الحقيقة كاملة" />
              <Body>{room.publicSolution ?? 'تم إغلاق ملف القضية.'}</Body>
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
