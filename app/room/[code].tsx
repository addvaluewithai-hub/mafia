import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Body, Button, Card, ErrorText, Field, Pill, Screen, Title } from '@/components/game-ui';
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

function PlayerRow({ player, selected, onPress, disabled }: {
  player: PlayerState;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        gap: 5,
        padding: 14,
        borderRadius: 16,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: selected ? colors.gold : player.isEliminated ? '#51262A' : colors.border,
        backgroundColor: selected ? '#272210' : player.isEliminated ? '#1E1012' : colors.surface2,
        opacity: pressed ? 0.78 : player.isEliminated ? 0.58 : 1,
      })}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{player.nickname}</Text>
        {player.isEliminated ? <Pill label="في السجن" tone="red" /> : null}
      </View>
      {player.characterName ? (
        <Text selectable style={{ ...rtlText, color: colors.gold, fontWeight: '800' }}>{player.characterName}</Text>
      ) : null}
      {player.characterBio ? <Text selectable style={{ ...rtlText, color: colors.muted, lineHeight: 21 }}>{player.characterBio}</Text> : null}
    </Pressable>
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
        <Card><Body>بنفتح ملف القضية...</Body></Card>
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen>
        <ErrorText message={error || 'الروم مش موجود.'} />
        <Button label="حاول تاني" onPress={() => void refresh()} tone="dark" />
      </Screen>
    );
  }

  const { room } = snapshot;
  const isOutsider = !snapshot.isHost && !snapshot.me;

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
        Alert.alert('لسه بدري', `ناقص ${result.missing ?? 0} تصويت.`);
      } else if (result.status === 'tie') {
        Alert.alert('تعادل', 'الأصوات اتصفّرت. اعملوا مناظرة سريعة وصوّتوا تاني في نفس الجولة.');
      } else if (result.status === 'finished') {
        Alert.alert('خلصت!', result.winner === 'innocents' ? 'الأبرياء كشفوا المافيا.' : 'المافيا كسبت القضية.');
      } else {
        Alert.alert('إلى السجن', `${result.nickname} — ${result.role === 'mafia' ? 'مافيوزو' : 'بريء'}`);
      }
    });
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Pill label={`ROOM ${code}`} tone="gold" />
        <Title size={34}>{room.title ?? 'غرفة التحقيق'}</Title>
        <Body muted>Boss: {room.bossName} · {snapshot.playerCount}/{room.maxPlayers} لاعبين</Body>
      </View>

      {error ? <ErrorText message={error} /> : null}

      {isOutsider ? (
        <Card>
          <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 20 }}>ادخل القضية</Text>
          {room.status !== 'lobby' ? (
            <Body muted>القضية بدأت بالفعل، ومش بنقبل لاعبين جدد بعد البداية.</Body>
          ) : (
            <>
              <Field value={nickname} onChangeText={setNickname} placeholder="اكتب اسمك" maxLength={24} />
              <Button label="ادخل الروم" onPress={submitJoin} loading={actionLoading} />
            </>
          )}
        </Card>
      ) : null}

      {room.status === 'lobby' ? (
        <>
          <Card>
            <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 20 }}>اللوبي</Text>
            <Body muted>كل واحد يدخل من نفس الرابط. لما يبقى عندكم 4 لاعبين أو أكتر، الـBoss يبدأ والقضية تتولد على العدد الموجود.</Body>
            <Button label="شارك الرابط" onPress={() => void share()} tone="dark" />
          </Card>

          <View style={{ gap: 10 }}>
            {snapshot.players.map((player) => <PlayerRow key={player.id} player={player} />)}
            {!snapshot.players.length ? <Body muted>مستنيين أول مشتبه فيه...</Body> : null}
          </View>

          {snapshot.isHost ? (
            <Card>
              <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 18 }}>لوحة الـBoss</Text>
              <Body muted>الصعوبة: {room.difficulty} · الجو: {room.theme}</Body>
              <Button
                label={snapshot.playerCount < 4 ? 'محتاجين 4 لاعبين على الأقل' : 'ولّد القضية وابدأ'}
                onPress={startGame}
                disabled={snapshot.playerCount < 4}
                loading={actionLoading}
              />
            </Card>
          ) : !isOutsider ? <Card><Body>استنى الـBoss يبدأ القضية.</Body></Card> : null}
        </>
      ) : null}

      {room.status !== 'lobby' ? (
        <>
          <Card>
            <Pill label="ملف القضية" tone="gold" />
            <Body>{room.premise ?? ''}</Body>
          </Card>

          {snapshot.me ? (
            <Card danger={roleVisible && snapshot.me.role === 'mafia'}>
              <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 18 }}>دورك السري</Text>
              {roleVisible ? (
                <>
                  <Text
                    selectable
                    style={{
                      ...rtlText,
                      color: snapshot.me.role === 'mafia' ? colors.red : colors.green,
                      fontWeight: '900',
                      fontSize: 34,
                    }}>
                    {snapshot.me.role === 'mafia' ? 'أنت مافيوزو' : 'أنت بريء'}
                  </Text>
                  <Body muted>{snapshot.me.role === 'mafia' ? 'المافيوزو التاني موجود وسطكم — وإنت مش عارف مين.' : 'حلّ القضية قبل ما الأبرياء يدخلوا السجن.'}</Body>
                </>
              ) : <Body muted>خلي الشاشة بعيد عن العيون واضغط إظهار.</Body>}
              <Button
                label={roleVisible ? 'اخفي دوري' : 'اظهر دوري'}
                tone={roleVisible && snapshot.me.role === 'mafia' ? 'red' : 'dark'}
                onPress={() => {
                  setRoleVisible((value) => !value);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </Card>
          ) : null}

          <View style={{ gap: 10 }}>
            <Text style={{ ...rtlText, color: colors.text, fontSize: 20, fontWeight: '900' }}>المشتبه فيهم</Text>
            {snapshot.players.map((player) => <PlayerRow key={player.id} player={player} />)}
          </View>

          <View style={{ gap: 12 }}>
            <Text style={{ ...rtlText, color: colors.text, fontSize: 20, fontWeight: '900' }}>الأدلة</Text>
            {snapshot.rounds.map((round) => (
              <Card key={round.roundIndex}>
                <Pill label={`الدليل ${round.roundIndex + 1}`} tone={round.roundIndex === room.roundIndex ? 'gold' : 'neutral'} />
                <Text selectable style={{ ...rtlText, color: colors.text, fontSize: 18, lineHeight: 28, fontWeight: '800' }}>{round.clue}</Text>
                <Body muted>{round.discussionPrompt}</Body>
              </Card>
            ))}
          </View>

          {snapshot.eliminations.length ? (
            <Card>
              <Text style={{ ...rtlText, color: colors.text, fontWeight: '900', fontSize: 18 }}>السجن</Text>
              {snapshot.eliminations.map((item) => (
                <View key={item.playerId} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>{item.nickname}</Text>
                  <Pill label={item.revealedRole === 'mafia' ? 'مافيوزو' : 'بريء'} tone={item.revealedRole === 'mafia' ? 'red' : 'green'} />
                </View>
              ))}
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.me && !snapshot.me.isEliminated && room.lastResolvedRound < room.roundIndex ? (
            <Card>
              <Text style={{ ...rtlText, color: colors.text, fontSize: 20, fontWeight: '900' }}>صوت مين يدخل السجن؟</Text>
              <View style={{ gap: 8 }}>
                {alivePlayers
                  .filter((player) => player.id !== snapshot.me?.playerId)
                  .map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
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
                label={snapshot.voteSubmitted ? 'صوتك اتحسب' : 'ثبّت صوتي'}
                onPress={submitVote}
                disabled={!selectedVote || snapshot.voteSubmitted}
                loading={actionLoading}
              />
            </Card>
          ) : null}

          {room.status === 'playing' && snapshot.isHost ? (
            <Card>
              <Text style={{ ...rtlText, color: colors.text, fontSize: 20, fontWeight: '900' }}>لوحة الـBoss</Text>
              <Body muted>الأصوات: {snapshot.votesCast}/{snapshot.eligibleVoters}</Body>
              {room.lastResolvedRound < room.roundIndex ? (
                <Button label="احسم التصويت" onPress={settleVote} loading={actionLoading} tone="red" />
              ) : (
                <Button label="اكشف الدليل اللي بعده" onPress={() => doAction(() => revealNextRound(code))} loading={actionLoading} />
              )}
            </Card>
          ) : null}

          {room.status === 'finished' ? (
            <Card danger={room.winner === 'mafia'}>
              <Pill label="انتهت القضية" tone={room.winner === 'mafia' ? 'red' : 'green'} />
              <Title size={30}>{room.winner === 'mafia' ? 'المافيا كسبت' : 'الأبرياء كسبوا'}</Title>
              <Body>{room.publicSolution ?? 'تم إغلاق ملف القضية.'}</Body>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
