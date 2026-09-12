# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest implementation SHA at Session 51 close: `b1e1d0976ee8398a825eacaf7ffb4b84b980639a` (`test: lock AI snapshot identity contract`), followed by this handoff commit.
- Session 50 checkpoint SHA `f64261c540ce7573b9bc3441d799bea99a93ebb9` was Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Session 51 implementation CI on `b1e1d0976ee8398a825eacaf7ffb4b84b980639a` completed/success ✅; Game QA was still in progress at the last inspection, so this change is **not deploy-safe yet**.
- Core/full-game 4–10 remains Green before this session; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB already contains launch-safety migration `20260911204500_public_abuse_perimeter.sql`; no Production mutation occurred in Session 51.
- Guarded web release remains externally blocked because the connected GitHub surface still has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- AI Players now has a repository-side authoritative snapshot identity contract: new migration `20260912113500_ai_snapshot_identity.sql` exposes `players[].isBot`; TypeScript `PlayerState` models it; the AI E2E verifies exact bot IDs, Boss-human identity, and persistence through case install/voting/snapshot refresh.
- The existing visible UX still renders player `nickname` directly; current bot nicknames include an `AI ` marker. The new `isBot` flag removes the need for future logic to infer machine identity from that visible naming convention.
- Fresh live-browser evidence could not be captured from this execution runtime: the external web fetch path did not resolve the Production hostname, and the guarded latest-source web rollout is still not available. Do not claim latest-source browser proof until an authorized release/browser surface can verify it.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + deterministic QA.
- [x] Migration-history parity reconciliation implemented and exact-SHA CI Green.
- [x] Launch-safety Production migration rollout + post-migration object/ledger verification.
- [~] Web rollout completion: code/DB/check prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [~] AI Players snapshot identity: repository implementation + deterministic E2E added; wait for full Game QA Green, then Production migration parity/rollout is a separate safety-gated operation. Latest-source live browser evidence is still blocked by release/browser access.
- [ ] AI Players discussion-scope decision after snapshot/live evidence is complete.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 51 — 2026-09-12 — Delivery: AI Players authoritative snapshot identity

### Session type
Delivery session. Exactly one coherent product-confidence objective; no unrelated feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was checkpoint commit `f64261c540ce7573b9bc3441d799bea99a93ebb9`.
- Fresh Actions inspection showed CI run `34680901373` completed/success and Game QA run `34680901380` completed/success on that exact SHA.
- No P0/full-game regression or failing check preceded the objective.
- Authorized exact-SHA release workflow dispatch remained unavailable, so the checkpoint-directed product objective took priority.

### Exact objective
Close the AI Players snapshot-identity gap as a durable server/client/test contract, and audit what browser/live UX evidence can actually be proven without weakening the guarded release path.

### Reproduction / design finding
- `public.players.is_bot` already existed as the authoritative server identity for computer players, with bot rows intentionally having no auth `user_id`.
- `room_snapshot` did **not** expose that flag. `PlayerState` had no bot identity field, and the existing AI E2E counted bots by `nickname.startsWith('AI ')`.
- That meant product/tests could accidentally treat a naming convention as identity. A renamed/localized bot, or a human nickname beginning with `AI`, could make such inference wrong.
- The room UI already displays real `nickname` values directly, so visible identity remains nickname-first. Current server-generated bot nicknames deliberately include `AI ` for a clear human-readable cue, while machine identity should come from the explicit snapshot flag.
- Live latest-source browser evidence could not be honestly established: guarded web rollout is still externally blocked, and the runtime web fetch path could not resolve `akher-kheit.vercel.app`. This is evidence/access limitation, not a gameplay defect.

### Code / database / test / doc changes
- Added `supabase/migrations/20260912113500_ai_snapshot_identity.sql`:
  - replaces `room_snapshot(text)` without changing its phase/vote/privacy semantics;
  - adds only `players[].isBot = players.is_bot` to the public player snapshot contract;
  - preserves authenticated-only execute permissions.
- Updated `lib/types.ts` so `PlayerState.isBot` is a required boolean matching the server contract.
- Strengthened `scripts/qa/ai-players-e2e.mjs`:
  - stores exact IDs returned by `add_ai_player`;
  - asserts exactly those three snapshot players are `isBot=true`;
  - asserts the human/Boss is explicitly `isBot=false`;
  - asserts AI identity survives case install, voting, and snapshot refresh;
  - no longer uses nickname prefix as the authoritative identity test.
- UI behavior was not rewritten: `PlayerCard` continues to show nickname as the primary visible identity, consistent with product identity rules. Current AI nickname generation continues to provide the visible `AI ` cue.
- Production DB/web: no writes, migration application, deploy, restore, or service mutation.

### Commits
- `3c357fa657391d31984a07b2c739f985b8e35016` — `feat: expose AI identity in room snapshots`
- `0a32e818e9687eed3f057d2528ded43195557d15` — `feat: type AI player snapshot identity`
- `b1e1d0976ee8398a825eacaf7ffb4b84b980639a` — `test: lock AI snapshot identity contract`
- Session handoff: `docs: record AI snapshot identity session`.

### Check / test results at session close
- Starting checkpoint SHA `f64261c540ce7573b9bc3441d799bea99a93ebb9`: CI + Game QA completed/success ✅.
- Implementation SHA `b1e1d0976ee8398a825eacaf7ffb4b84b980639a`: CI run `34683544496` completed/success ✅.
- Implementation Game QA run `34683544488`: still `in_progress` at last inspection. It includes clean local Supabase plus the strengthened AI Players E2E and full-game suites.
- No failing test was weakened, deleted, skipped, or rewritten merely to make CI Green.

### Newly discovered bugs / risks
- No new gameplay P0 discovered.
- Prior to this session, AI identity in snapshots/tests was under-specified and could be inferred from display naming. That gap is now addressed in repository code/tests, pending full QA completion.
- New migration `20260912113500_ai_snapshot_identity.sql` is repository-only until a later safety-gated Production migration decision; Production parity will intentionally show it missing once release preflight evaluates this SHA.
- Latest-source browser/live UX proof remains unavailable until the guarded web release/browser access blocker is resolved. Do not substitute generic deployment.

### Deploy-safety status
**Not deploy-safe yet.** CI is Green, but full Game QA for the implementation SHA was still running at close. The new migration has not been applied to Production and was not authorized for Production in this session. No Production DB or web mutation occurred.

### Roadmap impact
- AI Players now has a first-class machine-identity signal in the same snapshot contract used for reconnect/refresh, eliminating nickname-prefix identity inference from deterministic QA.
- This strengthens the solo foundation before any LLM discussion scope decision.
- Web release blocker remains independent and must not be bypassed.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا Game QA أو أي check حقيقي فشل، أصلح أول meaningful failure فقط. إذا أصبحت checks Green بالكامل، افحص release/preflight parity للـSHA الجديد read-only: توقّع أن تكون `20260912113500_ai_snapshot_identity.sql` هي migration الجديدة غير المطبقة. لا تطبقها Production إلا إذا handoff/QA evidence يبرر `deploy-safe` صريح. إذا ظل guarded web dispatch/browser proof محجوبًا، أكمل **AI Players live UX evidence / explicit UI consumption of `isBot`** كهدف واحد فقط، بدون بدء LLM discussion feature في نفس الجلسة.