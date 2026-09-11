import { storyMetadata } from '../story-catalog';
import { ARCHIVE_SEAL } from './archive-seal';
import { BACKSTAGE_PASS } from './backstage-pass';
import { BALCONY_KEY } from './balcony-key';
import { BLUE_NOTEBOOK } from './blue-notebook';
import { CLOCK_1117 } from './clock-1117';
import { FOURTH_FLOOR } from './fourth-floor';
import { GALLERY_LEDGER } from './gallery-ledger';
import { GARDEN_LOCKER } from './garden-locker';
import { LAST_REHEARSAL } from './last-rehearsal';
import { LAST_TRAY } from './last-tray';
import { MIDNIGHT_MENU } from './midnight-menu';
import { ROOFTOP_ENVELOPE } from './rooftop-envelope';
import { ROOM_312 } from './room-312';
import { SILENT_AUCTION } from './silent-auction';

export const CURATED_CASES = {
  'last-tray': { playerCount: 4, case: LAST_TRAY },
  'balcony-key': { playerCount: 4, case: BALCONY_KEY },
  'clock-1117': { playerCount: 5, case: CLOCK_1117 },
  'room-312': { playerCount: 5, case: ROOM_312 },
  'last-rehearsal': { playerCount: 6, case: LAST_REHEARSAL },
  'blue-notebook': { playerCount: 6, case: BLUE_NOTEBOOK },
  'fourth-floor': { playerCount: 7, case: FOURTH_FLOOR },
  'silent-auction': { playerCount: 7, case: SILENT_AUCTION },
  'rooftop-envelope': { playerCount: 8, case: ROOFTOP_ENVELOPE },
  'backstage-pass': { playerCount: 8, case: BACKSTAGE_PASS },
  'gallery-ledger': { playerCount: 9, case: GALLERY_LEDGER },
  'garden-locker': { playerCount: 9, case: GARDEN_LOCKER },
  'midnight-menu': { playerCount: 10, case: MIDNIGHT_MENU },
  'archive-seal': { playerCount: 10, case: ARCHIVE_SEAL },
} as const;

export type CuratedCaseId = keyof typeof CURATED_CASES;

export function getCuratedCase(id: string | null | undefined) {
  if (!id || !(id in CURATED_CASES)) return null;
  const item = CURATED_CASES[id as CuratedCaseId];
  const metadata = storyMetadata(id);
  return { ...item, metadata };
}

export function referenceCasesFor(playerCount: number) {
  return Object.entries(CURATED_CASES)
    .filter(([, item]) => item.playerCount === playerCount)
    .map(([id, item]) => ({
      id,
      playerCount: item.playerCount,
      packId: storyMetadata(id)?.packId ?? null,
      title: item.case.title,
      premise: item.case.premise,
      characters: item.case.characters,
      rounds: item.case.rounds,
      solution: item.case.solution,
    }));
}
