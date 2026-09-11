import assert from 'node:assert/strict';
import fs from 'node:fs';

const create = fs.readFileSync('app/create.tsx', 'utf8');
const room = fs.readFileSync('app/room/[code].tsx', 'utf8');
const game = fs.readFileSync('lib/game.ts', 'utf8');

assert(create.includes('createRoomV3'), 'Create UI must use the current create-room helper');
assert(create.includes('bossGender,'), 'Create UI must submit selected boss gender through the create-room helper');
assert(create.includes('<GenderPicker value={bossGender}'), 'Create UI must render gender picker');
assert(game.includes("supabase.rpc('create_room_v4'"), 'Create helper must use create_room_v4 so gender and the public abuse perimeter stay wired together');
assert(game.includes('p_boss_gender: input.bossGender'), 'Create helper must send boss gender');
assert(game.includes('p_abuse_key: getAbuseInstallationKey()'), 'Create helper must send the installation abuse key');
assert(!game.includes("supabase.rpc('create_room_v3'"), 'Create helper must not bypass the public abuse perimeter via create_room_v3');
assert(!create.includes("supabase.rpc('create_room_v2'"), 'Create UI must not regress to create_room_v2');
assert(!game.includes("supabase.rpc('create_room_v2'"), 'Create helper must not regress to create_room_v2');

assert(room.includes('<GenderPicker value={joinGender}'), 'Join UI must render gender picker');
assert(room.includes('joinRoom(code, nickname, joinGender)'), 'Join UI must submit selected gender');
assert(game.includes("supabase.rpc('join_room_v3'"), 'joinRoom must use join_room_v3 so gender and the public abuse perimeter stay wired together');
assert(game.includes('p_gender: gender'), 'joinRoom must send gender');
assert(game.includes('p_abuse_key: getAbuseInstallationKey()'), 'joinRoom must send the installation abuse key');
assert(!game.includes("supabase.rpc('join_room_v2'"), 'joinRoom must not bypass the public abuse perimeter via join_room_v2');
assert(!game.includes("supabase.rpc('join_room',"), 'joinRoom must not regress to legacy join_room');

console.log('QA gender UI contract: create/join selection stays wired through gender-aware abuse-perimeter RPCs.');
