import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:8081';
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const navigationTimeoutMs = 15_000;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required');
}

function deterministicCase() {
  return {
    title: 'قضية المتصفح المحلية',
    premise: 'اختبار Browser E2E لمسار Solo كامل مع لاعبين AI.',
    crime: 'اختفاء ظرف من الصالة.',
    characters: [
      { role: 'مسؤول البوفيه', bio: 'كان قريب من الدرج.', roleByGender: { male: 'مسؤول البوفيه', female: 'مسؤولة البوفيه' }, bioByGender: { male: 'كان قريب من الدرج.', female: 'كانت قريبة من الدرج.' } },
      { role: 'منظم اللمة', bio: 'رتب دخول الضيوف.', roleByGender: { male: 'منظم اللمة', female: 'منظمة اللمة' }, bioByGender: { male: 'رتب دخول الضيوف.', female: 'رتبت دخول الضيوف.' } },
      { role: 'مسؤول التصوير', bio: 'صور الصالة.', roleByGender: { male: 'مسؤول التصوير', female: 'مسؤولة التصوير' }, bioByGender: { male: 'صور الصالة.', female: 'صورت الصالة.' } },
      { role: 'صاحب المكان', bio: 'معاه مفاتيح المكان.', roleByGender: { male: 'صاحب المكان', female: 'صاحبة المكان' }, bioByGender: { male: 'معاه مفاتيح المكان.', female: 'معاها مفاتيح المكان.' } },
    ],
    mafiaCharacterIndexes: [0],
    rounds: [
      { clue: 'الدليل الأول محتاج مقارنة هادية بين الفرص قبل الحكم.', discussionPrompt: 'مين كان عنده فرصة فعلية؟' },
      { clue: 'الدليل الثاني ضيق دائرة الشك بعد أول استبعاد.', discussionPrompt: 'إيه اللي اتغير بعد الاستبعاد؟' },
      { clue: 'الدليل الثالث بيربط الحركة بالتوقيت.', discussionPrompt: 'مين تفسيره لسه متماسك؟' },
      { clue: 'الدليل الأخير بيحسم تسلسل الحركة.', discussionPrompt: 'صوتوا على أقوى تفسير.' },
    ],
    solution: 'Browser E2E fixture only.',
  };
}

async function gotoHydrated(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
  await expect(page.locator('body')).toBeVisible({ timeout: navigationTimeoutMs });
}

async function reloadHydrated(page) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
  await expect(page.locator('body')).toBeVisible({ timeout: navigationTimeoutMs });
}

async function browserAccessToken(page) {
  return page.evaluate(() => {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const value = JSON.parse(raw);
        if (value?.access_token) return value.access_token;
        if (value?.currentSession?.access_token) return value.currentSession.access_token;
      } catch {
        // Ignore unrelated localStorage entries.
      }
    }
    return null;
  });
}

function hostClient(accessToken) {
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function seedVotes(roomId, roundIndex, voters, targetPlayerId) {
  const rows = voters.map((player) => ({
    room_id: roomId,
    round_index: roundIndex,
    voter_player_id: player.id,
    target_player_id: targetPlayerId,
  }));
  const { error } = await service.from('votes').upsert(rows, { onConflict: 'room_id,round_index,voter_player_id' });
  if (error) throw new Error(`seed votes: ${error.message}`);
}

async function boundedFailureDiagnostics(page) {
  const fallback = { url: page.url(), title: '', body: 'diagnostics timed out before page inspection completed' };
  return Promise.race([
    (async () => {
      const title = await page.title().catch(() => '');
      const body = await page.locator('body').innerText({ timeout: 1_500 }).catch((error) => `body unavailable: ${String(error)}`);
      return { url: page.url(), title, body: body.slice(0, 4000) };
    })(),
    new Promise((resolve) => setTimeout(() => resolve(fallback), 2_000)),
  ]);
}

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const diagnostics = await boundedFailureDiagnostics(page);
  console.error('Solo browser E2E diagnostics:', JSON.stringify(diagnostics, null, 2));
});

test('Solo AI browser journey survives elimination, refresh, next round, voting, and winner', async ({ page }) => {
  test.setTimeout(75_000);
  await gotoHydrated(page, `${baseUrl}/solo`);
  await page.getByPlaceholder('مثلاً: شريف').fill('Browser Boss');
  await page.getByRole('button', { name: 'ذكر' }).click();
  await page.getByText('جهّز ماتش AI', { exact: true }).click();

  await page.waitForURL(/\/room\/[A-Z0-9]{6}$/, { timeout: navigationTimeoutMs, waitUntil: 'domcontentloaded' });
  const code = page.url().split('/').pop();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  const accessToken = await browserAccessToken(page);
  expect(accessToken).toBeTruthy();
  const host = hostClient(accessToken);

  let snapshot = await rpc(host, 'room_snapshot', { p_code: code });
  expect(snapshot.playerCount).toBe(4);
  expect(snapshot.players.filter((player) => player.isBot)).toHaveLength(3);

  await rpc(host, 'install_case', { p_code: code, p_case: deterministicCase() });
  await reloadHydrated(page);
  await expect(page.getByText('كلام لاعيبة الـAI', { exact: true })).toBeVisible();

  snapshot = await rpc(host, 'room_snapshot', { p_code: code });
  const { data: roles, error: rolesError } = await service
    .from('player_roles')
    .select('player_id,role')
    .eq('room_id', snapshot.room.id);
  if (rolesError) throw rolesError;
  const roleByPlayer = new Map(roles.map((row) => [row.player_id, row.role]));
  const firstTarget = snapshot.players.find((player) => player.isBot && roleByPlayer.get(player.id) === 'innocent');
  expect(firstTarget).toBeTruthy();

  await page.getByText(firstTarget.nickname, { exact: true }).first().click();
  await page.getByText('ثبّت صوتي', { exact: true }).click();

  snapshot = await rpc(host, 'room_snapshot', { p_code: code });
  const aliveRoundZero = snapshot.players.filter((player) => !player.isEliminated);
  await seedVotes(snapshot.room.id, snapshot.room.roundIndex, aliveRoundZero, firstTarget.id);
  await reloadHydrated(page);
  await page.getByText('احسم التصويت', { exact: true }).click();

  await expect(page.getByText(firstTarget.nickname, { exact: true }).first()).toBeVisible();
  await expect(page.getByText('في السجن', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('اكشف الدليل اللي بعده', { exact: true })).toBeVisible();

  await page.getByText('اكشف الدليل اللي بعده', { exact: true }).click();
  await expect(page.getByText('الدليل 2', { exact: true })).toBeVisible();
  await expect(page.getByText('كلام لاعيبة الـAI', { exact: true })).toBeVisible();

  const cuesBeforeReload = await page.locator('body').innerText();
  await reloadHydrated(page);
  await expect(page.getByText('الدليل 2', { exact: true })).toBeVisible();
  const cuesAfterReload = await page.locator('body').innerText();
  expect(cuesAfterReload).toContain('كلام لاعيبة الـAI');
  expect(cuesAfterReload).toContain('الدليل 2');
  expect(cuesBeforeReload).toContain('الدليل 2');

  snapshot = await rpc(host, 'room_snapshot', { p_code: code });
  const mafia = snapshot.players.find((player) => roleByPlayer.get(player.id) === 'mafia' && !player.isEliminated);
  expect(mafia).toBeTruthy();
  const aliveRoundOne = snapshot.players.filter((player) => !player.isEliminated);
  await seedVotes(snapshot.room.id, snapshot.room.roundIndex, aliveRoundOne, mafia.id);

  await reloadHydrated(page);
  await expect(page.getByText('احسم التصويت', { exact: true })).toBeVisible();
  await page.getByText('احسم التصويت', { exact: true }).click();
  await expect(page.getByText('انتهت القضية', { exact: true })).toBeVisible();
  await expect(page.getByText('الأبرياء كشفوا المافيا.', { exact: true })).toBeVisible();

  const finalSnapshot = await rpc(host, 'room_snapshot', { p_code: code });
  expect(finalSnapshot.room.status).toBe('finished');
  expect(finalSnapshot.room.winner).toBe('innocents');
});
