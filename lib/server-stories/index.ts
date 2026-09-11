import { BALCONY_KEY } from '@/lib/server-stories/balcony-key';
import { BLUE_NOTEBOOK } from '@/lib/server-stories/blue-notebook';
import { CLOCK_1117 } from '@/lib/server-stories/clock-1117';
import { FOURTH_FLOOR } from '@/lib/server-stories/fourth-floor';
import { LAST_REHEARSAL } from '@/lib/server-stories/last-rehearsal';
import { LAST_TRAY } from '@/lib/server-stories/last-tray';
import { ROOM_312 } from '@/lib/server-stories/room-312';
import { SILENT_AUCTION } from '@/lib/server-stories/silent-auction';

export const CURATED_CASES = {
  'last-tray': { playerCount: 4, case: LAST_TRAY },
  'balcony-key': { playerCount: 4, case: BALCONY_KEY },
  'clock-1117': { playerCount: 5, case: CLOCK_1117 },
  'room-312': { playerCount: 5, case: ROOM_312 },
  'last-rehearsal': { playerCount: 6, case: LAST_REHEARSAL },
  'blue-notebook': { playerCount: 6, case: BLUE_NOTEBOOK },
  'fourth-floor': { playerCount: 7, case: FOURTH_FLOOR },
  'silent-auction': { playerCount: 7, case: SILENT_AUCTION },
} as const;

export function getCuratedCase(id: string | null | undefined) {
  if (!id || !(id in CURATED_CASES)) return null;
  return CURATED_CASES[id as keyof typeof CURATED_CASES];
}

export function referenceCasesFor(playerCount: number) {
  return Object.entries(CURATED_CASES)
    .filter(([, item]) => item.playerCount === playerCount)
    .map(([id, item]) => ({
      id,
      playerCount: item.playerCount,
      title: item.case.title,
      premise: item.case.premise,
      characters: item.case.characters,
      rounds: item.case.rounds,
      solution: item.case.solution,
    }));
}
