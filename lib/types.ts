export type SecretRole = 'mafia' | 'innocent';
export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type Winner = 'mafia' | 'innocents' | null;
export type CaseMode = 'ai' | 'preset';
export type GamePhase = 'lobby' | 'voting' | 'round_resolved' | 'finished';
export type PlayerGender = 'male' | 'female';

export type PlayerState = {
  id: string;
  nickname: string;
  gender: PlayerGender | null;
  caseRole: string | null;
  characterName: string | null;
  characterBio: string | null;
  isEliminated: boolean;
  isHost: boolean;
};

export type EvidenceRound = {
  roundIndex: number;
  clue: string;
  discussionPrompt: string;
};

export type Elimination = {
  playerId: string;
  nickname: string;
  revealedRole: SecretRole;
  roundIndex: number;
};

export type RoomSnapshot = {
  room: {
    id: string;
    code: string;
    bossName: string;
    status: RoomStatus;
    maxPlayers: number;
    mafiaCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    theme: string;
    caseMode: CaseMode;
    storyTemplateId: string | null;
    title: string | null;
    premise: string | null;
    roundIndex: number;
    lastResolvedRound: number;
    winner: Winner;
    publicSolution: string | null;
    timerDurationSeconds: number;
    timerEndsAt: string | null;
  };
  phase: GamePhase;
  canVote: boolean;
  isHost: boolean;
  me: {
    playerId: string;
    role: SecretRole | null;
    isEliminated: boolean;
    gender: PlayerGender | null;
    caseRole: string | null;
  } | null;
  players: PlayerState[];
  rounds: EvidenceRound[];
  eliminations: Elimination[];
  playerCount: number;
  votesCast: number;
  eligibleVoters: number;
  voteSubmitted: boolean;
};

export type GeneratedCase = {
  title: string;
  premise: string;
  crime: string;
  characters: Array<{
    name: string;
    bio: string;
  }>;
  mafiaCharacterIndexes: number[];
  rounds: Array<{
    clue: string;
    discussionPrompt: string;
  }>;
  solution: string;
};
