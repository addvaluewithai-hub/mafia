import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:8081';
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const navigationTimeoutMs = 15_000;
const evidencePath = resolve('qa/reports/human-multiclient-browser-e2e.json');
const evidence = {
  ok: false,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  lastStage: 'bootstrap',
  stages: [],
  error: null,
  diagnostics: null,
};

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required');
}

function persistEvidence() {
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
}

function markStage(stage, detail = null) {
  evidence.lastStage = stage;
  evidence.stages.push({ stage, at: new Date().toISOString(), ...(detail ? { detail } : {}) });
  persistEvidence();
  console.log(`[human-multiclient-browser-e2e] ${stage}${detail ? `: ${detail}` : ''}`);
}

persistEvidence();

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

function sessionClient(accessToken) {
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

async function pageDiagnostics(page) {
  if (!page || page.isClosed()) return { url: '', title: '', body: 'page unavailable' };
  const fallback = { url: page.url(), title: '', body: 'diagnostics timed out before page inspection completed' };
  return Promise.race([
    (async () => {
      const title = await page.title().catch(() => '');
      const body = await page.locator('body').innerText({ timeout: 1_500 }).catch((error) => `body unavailable: ${String(error)}`);
      return { url: page.url(), title, body: body.slice(0, 3000) };
    })(),
    new Promise((resolve) => setTimeout(() => resolve(fallback), 2_000)),
  ]);
}

async function joinThroughStandalonePage(page, code, nickname, genderLabel) {
  await gotoHydrated(page, `${baseUrl}/join`);
  await page.getByPlaceholder('A1B2C3').fill(code);
  await page.getByPlaceholder('مثلاً: مهند').fill(nickname);
  await page.getByRole('button', { name: genderLabel }).click();
  await page.getByText('ادخل التحقيق', { exact: true }).click();
  await page.waitForURL(new RegExp(`/room/${code}$`), { timeout: navigationTimeoutMs, waitUntil: 'domcontentloaded' });
  await expect(page.getByText(nickname, { exact: true }).first()).toBeVisible({ timeout: navigationTimeoutMs });
}

async function castBrowserVote(page, targetNickname) {
  await expect(page.getByText('مين يدخل السجن؟', { exact: true })).toBeVisible({ timeout: navigationTimeoutMs });
  await page.getByText(targetNickname, { exact: true }).last().click();
  await expect(page.getByText('اختيارك', { exact: true })).toBeVisible();
  await page.getByText('ثبّت صوتي', { exact: true }).click();
  await expect(page.getByText('صوتك اتحسب', { exact: true })).toBeVisible();
}

test('Boss + three human browser identities complete create, join, reveal, vote, reconnect, next round, and winner', async ({ browser }) => {
  test.setTimeout(105_000);
  const contexts = [];
  const pagesByNickname = new Map();
  let bossPage = null;

  try {
    const bossContext = await browser.newContext();
    contexts.push(bossContext);
    bossPage = await bossContext.newPage();
    pagesByNickname.set('Browser Boss', bossPage);
    bossPage.on('dialog', (dialog) => void dialog.dismiss());

    markStage('boss-open-create');
    await gotoHydrated(bossPage, `${baseUrl}/create`);
    await bossPage.getByPlaceholder('مثلاً: شريف').fill('Browser Boss');
    await bossPage.getByRole('button', { name: 'ذكر' }).click();
    await bossPage.getByText('−', { exact: true }).click();
    await bossPage.getByText('−', { exact: true }).click();
    await expect(bossPage.getByText('4', { exact: true }).first()).toBeVisible();
    await bossPage.getByText('اعمل الروم بالقضية دي', { exact: true }).click();
    await bossPage.waitForURL(/\/room\/[A-Z0-9]{6}$/, { timeout: navigationTimeoutMs, waitUntil: 'domcontentloaded' });
    const code = bossPage.url().split('/').pop();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    markStage('boss-room-created', code);

    const humans = [
      { nickname: 'Browser Salma', gender: 'أنثى', expectedGender: 'female' },
      { nickname: 'Browser Karim', gender: 'ذكر', expectedGender: 'male' },
      { nickname: 'Browser Dina', gender: 'أنثى', expectedGender: 'female' },
    ];

    for (const human of humans) {
      const context = await browser.newContext();
      contexts.push(context);
      const page = await context.newPage();
      pagesByNickname.set(human.nickname, page);
      page.on('dialog', (dialog) => void dialog.dismiss());
      await joinThroughStandalonePage(page, code, human.nickname, human.gender);
      markStage('human-joined', human.nickname);
    }

    await reloadHydrated(bossPage);
    await expect(bossPage.getByText('4/4', { exact: true })).toBeVisible();
    for (const nickname of pagesByNickname.keys()) {
      await expect(bossPage.getByText(nickname, { exact: true }).first()).toBeVisible();
    }
    markStage('four-human-lobby-verified');

    const bossToken = await browserAccessToken(bossPage);
    expect(bossToken).toBeTruthy();
    const bossClient = sessionClient(bossToken);
    let snapshot = await rpc(bossClient, 'room_snapshot', { p_code: code });
    expect(snapshot.playerCount).toBe(4);
    expect(snapshot.players.every((player) => !player.isBot)).toBe(true);
    for (const human of humans) {
      const player = snapshot.players.find((item) => item.nickname === human.nickname);
      expect(player?.gender).toBe(human.expectedGender);
    }
    expect(snapshot.players.find((item) => item.nickname === 'Browser Boss')?.gender).toBe('male');
    markStage('nickname-gender-state-verified');

    await bossPage.getByText('ابدأ القضية', { exact: true }).click();
    await expect(bossPage.getByText('دورك السري', { exact: true })).toBeVisible({ timeout: navigationTimeoutMs });
    markStage('boss-started-case');

    await bossPage.getByText('اكشف دوري', { exact: true }).click();
    await expect(bossPage.getByText(/أنت (مافيوزو|بريء)/).first()).toBeVisible();
    await expect(bossPage.getByText('تحكم الـBoss', { exact: true })).toBeVisible();
    markStage('boss-private-role-and-controls-verified');

    snapshot = await rpc(bossClient, 'room_snapshot', { p_code: code });
    const { data: roles, error: rolesError } = await service
      .from('player_roles')
      .select('player_id,role')
      .eq('room_id', snapshot.room.id);
    if (rolesError) throw rolesError;
    const roleByPlayer = new Map(roles.map((row) => [row.player_id, row.role]));
    const playerByNickname = new Map(snapshot.players.map((player) => [player.nickname, player]));
    const humanInnocents = humans
      .map((human) => playerByNickname.get(human.nickname))
      .filter((player) => player && roleByPlayer.get(player.id) === 'innocent');
    expect(humanInnocents.length).toBeGreaterThan(0);
    const voter = humanInnocents[0];
    const firstTarget = snapshot.players.find((player) => player.id !== voter.id && roleByPlayer.get(player.id) === 'innocent');
    const mafia = snapshot.players.find((player) => roleByPlayer.get(player.id) === 'mafia');
    expect(firstTarget).toBeTruthy();
    expect(mafia).toBeTruthy();
    const voterPage = pagesByNickname.get(voter.nickname);
    expect(voterPage).toBeTruthy();

    await reloadHydrated(voterPage);
    await expect(voterPage.getByText(voter.nickname, { exact: true }).first()).toBeVisible();
    await voterPage.getByText('اكشف دوري', { exact: true }).click();
    await expect(voterPage.getByText('أنت بريء', { exact: true })).toBeVisible();
    markStage('human-private-role-verified', voter.nickname);

    await castBrowserVote(voterPage, firstTarget.nickname);
    markStage('human-round-one-vote-submitted', `${voter.nickname} -> ${firstTarget.nickname}`);

    snapshot = await rpc(bossClient, 'room_snapshot', { p_code: code });
    await seedVotes(snapshot.room.id, snapshot.room.roundIndex, snapshot.players.filter((player) => !player.isEliminated), firstTarget.id);
    await reloadHydrated(bossPage);
    await bossPage.getByText('احسم التصويت', { exact: true }).click();
    await expect(bossPage.getByText(firstTarget.nickname, { exact: true }).first()).toBeVisible();
    await expect(bossPage.getByText('في السجن', { exact: true }).first()).toBeVisible();
    await expect(bossPage.getByText('اكشف الدليل اللي بعده', { exact: true })).toBeVisible();
    markStage('boss-resolved-first-elimination', firstTarget.nickname);

    await bossPage.getByText('اكشف الدليل اللي بعده', { exact: true }).click();
    await expect(bossPage.getByText('الدليل 2', { exact: true })).toBeVisible();
    markStage('boss-revealed-next-round');

    await reloadHydrated(voterPage);
    await expect(voterPage.getByText('الدليل 2', { exact: true })).toBeVisible();
    await expect(voterPage.getByText(voter.nickname, { exact: true }).first()).toBeVisible();
    await expect(voterPage.getByText('دورك السري', { exact: true })).toBeVisible();
    markStage('human-refresh-reconnect-verified', voter.nickname);

    await castBrowserVote(voterPage, mafia.nickname);
    markStage('human-round-two-vote-submitted', `${voter.nickname} -> ${mafia.nickname}`);

    snapshot = await rpc(bossClient, 'room_snapshot', { p_code: code });
    await seedVotes(snapshot.room.id, snapshot.room.roundIndex, snapshot.players.filter((player) => !player.isEliminated), mafia.id);
    await reloadHydrated(bossPage);
    await bossPage.getByText('احسم التصويت', { exact: true }).click();
    const caseClosedLabels = bossPage.getByText('CASE CLOSED', { exact: true });
    await expect(caseClosedLabels).toHaveCount(2);
    await expect(caseClosedLabels.last()).toBeVisible();
    await expect(bossPage.getByText('الأبرياء كسبوا', { exact: true })).toBeVisible();
    markStage('boss-winner-ui-verified');

    await reloadHydrated(voterPage);
    await expect(voterPage.getByText('الأبرياء كسبوا', { exact: true })).toBeVisible();
    await expect(voterPage.getByText('لو عايزين تلعبوا تاني، الـBoss يقدر يرجّع نفس الروم للّوبي من غير ما حد يدخل من جديد.', { exact: true })).toBeVisible();
    markStage('human-winner-ui-verified');

    const finalSnapshot = await rpc(bossClient, 'room_snapshot', { p_code: code });
    expect(finalSnapshot.room.status).toBe('finished');
    expect(finalSnapshot.room.winner).toBe('innocents');
    expect(finalSnapshot.eliminations.some((item) => item.playerId === mafia.id && item.revealedRole === 'mafia')).toBe(true);
    markStage('authoritative-winner-snapshot-verified');

    evidence.ok = true;
    evidence.finishedAt = new Date().toISOString();
    markStage('completed');
  } catch (error) {
    evidence.finishedAt = new Date().toISOString();
    evidence.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack ?? null : null,
    };
    const diagnostics = {};
    for (const [nickname, page] of pagesByNickname.entries()) {
      diagnostics[nickname] = await pageDiagnostics(page);
    }
    evidence.diagnostics = diagnostics;
    persistEvidence();
    console.error('Human multi-client browser E2E diagnostics:', JSON.stringify(diagnostics, null, 2));
    throw error;
  } finally {
    for (const context of contexts.reverse()) {
      await context.close().catch(() => undefined);
    }
  }
});