import assert from 'node:assert/strict';
import fs from 'node:fs';

const identityMigration = fs.readFileSync('supabase/migrations/20260910130000_player_identity_schema.sql', 'utf8');
const installMigration = fs.readFileSync('supabase/migrations/20260910233000_gender_case_text_variants.sql', 'utf8');
const roomSource = fs.readFileSync('app/room/[code].tsx', 'utf8');
const typesSource = fs.readFileSync('lib/types.ts', 'utf8');

const playerCardStart = roomSource.indexOf('function PlayerCard(');
const clueCardStart = roomSource.indexOf('function ClueCard(');
assert(playerCardStart >= 0 && clueCardStart > playerCardStart, 'PlayerCard source boundary must be discoverable');
const playerCardSource = roomSource.slice(playerCardStart, clueCardStart);

// character_name is compatibility-only: DB/snapshot may preserve it for old rooms,
// but it must never become the player's visible identity again.
assert.match(identityMigration, /'characterName',\s*p\.character_name/, 'room_snapshot must preserve legacy characterName compatibility until a migration-safe removal');
assert.match(typesSource, /characterName:\s*string \| null/, 'PlayerState must model compatibility characterName while snapshot still exposes it');
assert.doesNotMatch(playerCardSource, /player\.characterName/, 'PlayerCard must not render legacy characterName');

// character_bio is still runtime-required today: install_case writes the selected
// gender-aware bio and PlayerCard displays it as descriptive story context.
assert.match(installMigration, /character_bio\s*=\s*v_character_bio/, 'install_case must keep persisting the selected case bio');
assert.match(identityMigration, /'characterBio',\s*p\.character_bio/, 'room_snapshot must expose characterBio while UI consumes it');
assert.match(typesSource, /characterBio:\s*string \| null/, 'PlayerState must model runtime characterBio');
assert.match(playerCardSource, /player\.characterBio/, 'PlayerCard must keep rendering descriptive characterBio context');

// case_role is the semantic identity contract replacing fictional character names.
assert.match(installMigration, /case_role\s*=\s*v_case_role/, 'install_case must persist semantic case_role');
assert.match(playerCardSource, /player\.nickname/, 'nickname must remain the visible player identity');

console.log('Legacy identity contract passed: characterName is compatibility-only; characterBio remains runtime-required; nickname/caseRole stay canonical.');
