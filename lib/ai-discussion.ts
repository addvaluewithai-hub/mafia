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

function stableIndex(parts: string[], modulo: number) {
  let hash = 2166136261;
  const value = parts.join('|');
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % modulo;
}

function roleLabel(role: string | null) {
  const trimmed = role?.trim();
  return trimmed ? `دور ${trimmed}` : 'دور كل واحد';
}

export function buildAiDiscussionCues({ players, round }: AiDiscussionInput): AiDiscussionCue[] {
  if (!round) return [];

  return players
    .filter((player) => player.isBot && !player.isEliminated)
    .map((player) => {
      const variant = stableIndex(
        [player.id, player.nickname, player.caseRole ?? '', String(round.roundIndex), round.clue, round.discussionPrompt],
        4,
      );
      const role = roleLabel(player.caseRole);
      const texts = [
        `أنا مركز في الدليل ده، خصوصًا ${role}. خلونا مانستعجلش الحكم.`,
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
