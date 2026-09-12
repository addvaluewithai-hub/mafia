export type PublicAiDiscussionPlayer = {
  id: string;
  nickname: string;
  caseRole: string | null;
  isBot: boolean;
  isEliminated: boolean;
};

export type PublicAiDiscussionRound = {
  roundIndex: number;
  clue: string;
  discussionPrompt: string;
};

export type AiDiscussionCue = {
  playerId: string;
  nickname: string;
  text: string;
};

type AiDiscussionInput = {
  players: PublicAiDiscussionPlayer[];
  round: PublicAiDiscussionRound | null;
};

function roleLabel(role: string | null) {
  const trimmed = role?.trim();
  return trimmed ? `دور ${trimmed}` : 'دور كل واحد';
}

export function buildAiDiscussionCues({ players, round }: AiDiscussionInput): AiDiscussionCue[] {
  if (!round) return [];

  const aliveBots = players.filter((player) => player.isBot && !player.isEliminated);
  const stableBotIds = aliveBots.map((player) => player.id).sort((left, right) => left.localeCompare(right));

  return aliveBots.map((player) => {
    const stableRank = stableBotIds.indexOf(player.id);
    const variant = (stableRank + round.roundIndex) % 4;
    const role = roleLabel(player.caseRole);
    const texts = [
      `أنا مركز في الدليل ده، خصوصًا في ${role}. خلونا مانستعجلش الحكم.`,
      `بالنسبة لي السؤال المهم دلوقتي: ${round.discussionPrompt}`,
      `الدليل ده ممكن يركب على أكتر من حد. خلونا نقارن ${role} باللي اتكشف قبل التصويت.`,
      `لسه عندي شك. عايز أسمع تفسير واضح للدليل من كل واحد قبل ما أثبت رأيي.`,
    ];

    return {
      playerId: player.id,
      nickname: player.nickname,
      text: texts[variant],
    };
  });
}
