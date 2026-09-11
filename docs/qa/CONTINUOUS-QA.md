# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 معروف قبل أحدث CI repair.
- Identity/story: gender + caseRole + nickname-only identity + curated/AI semantic roles كانت Green قبل Session 37 refactor.
- Curated library: قصتان لكل عدد 4–10؛ 11–12 AI-only؛ 13–15 غير مستهدفة حاليًا.
- Solo/AI Players MVP live in Production.
- آخر production DB evidence من Session 34: Supabase كان `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`; لا نفترض parity مستقبلية بدون preflight.
- Production web الحالي Vercel. آخر deployment durable evidence من Session 34؛ لا يوجد Production deploy في Sessions 35–38.
- Session 36 release guardrails handoff `bb5363e1d137dd7c2125f83aa0463935f457f714` أصبح `validate` + `qa` Green.
- Session 37 observability handoff `e5b6a4d01b7b944b54a1157730f067d313be76c8`: `validate` Green لكن `qa` failed عند `Gender UI RPC contract`.
- Session 38 أصلح contract regression الناتج عن نقل create RPC من الشاشة إلى `createRoomV3`; latest repair checks pending.

## Roadmap status
- [x] Core/full-game 4–10 stable قبل latest CI repair.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection.
- [x] Room creation/join abuse protection + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Launch-safety checkpoint.
- [x] Release parity + Vercel deployment guardrails.
- [x] Production observability implementation.
- [ ] Session 38 gender contract repair must become Green before new scope.
- [ ] Anonymous-identity churn / public-launch abuse perimeter.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 38 — 2026-09-11 — Gender UI contract repair after observability refactor
### Session type
Delivery/CI-repair — exactly one bounded objective: resolve the first meaningful failing check on latest `main`. No new product feature, abuse-perimeter implementation, Production deploy, migration, or DB write.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting `main`: `e5b6a4d01b7b944b54a1157730f067d313be76c8` (`docs: record observability CI repair`).
- `validate`: completed/success ✅.
- `qa`: completed/failure ❌.
- Game QA job evidence: TypeScript ✅, Expo doctor ✅, Vote UI authoritative contract ✅, then `Gender UI RPC contract` ❌; all later QA steps were skipped because the job stopped at that failure.
- Per operating mode, no new anonymous-identity scope was started.

### Exact objective
Repair the failing gender UI QA contract without weakening the gender contract: continue proving that Create renders a gender picker, sends the selected Boss gender through the active UI helper, and that the helper uses `create_room_v3` with `p_boss_gender`; retain join-side proof for `join_room_v2` + `p_gender`.

### Reproduction / design finding
- Session 37 intentionally refactored Create from a direct `supabase.rpc('create_room_v3', ...)` call in `app/create.tsx` to the observed `createRoomV3(...)` helper in `lib/game.ts`.
- Runtime behavior remained gender-aware: `app/create.tsx` passes `bossGender` into `createRoomV3`; `lib/game.ts` calls `create_room_v3` and maps it to `p_boss_gender: input.bossGender`.
- `scripts/qa/gender-ui-contract.mjs` was structurally stale: it required the literal RPC and `p_boss_gender: bossGender` to live in `app/create.tsx`, so it failed despite the same semantic contract now crossing the UI/helper boundary.
- The correct fix is to update the regression test to assert both halves of that boundary, not to delete or bypass the test.

### Code / database / tests / docs changes
- Updated `scripts/qa/gender-ui-contract.mjs` to assert:
  - Create UI uses `createRoomV3`.
  - Create UI passes `bossGender` and still renders `<GenderPicker value={bossGender}`.
  - `lib/game.ts` uses `supabase.rpc('create_room_v3'` and sends `p_boss_gender: input.bossGender`.
  - Neither Create UI nor the helper regresses to `create_room_v2`.
  - Existing join assertions remain: join picker, `joinRoom(code, nickname, joinGender)`, `join_room_v2`, `p_gender: gender`, and no legacy `join_room` regression.
- No runtime product code changed in this session.
- No schema/database change.
- No test was removed, skipped, weakened, or rewritten to ignore gender wiring; the contract now follows the actual abstraction boundary introduced by observability.

### Commits
- `e8bfed074b49403d7092c67662eee1b8512911ca` — `fix: align gender UI contract with create helper`.
- This handoff commit records Session 38 evidence and will trigger checks again.

### Check/test results
- Starting SHA `e5b6a4d01b7b944b54a1157730f067d313be76c8`: `validate` success, `qa` failure at exactly `Gender UI RPC contract`.
- Immediately after repair commit `e8bfed074b49403d7092c67662eee1b8512911ca`, GitHub had not yet registered check runs (`total_count: 0`) at inspection time.
- Therefore the repair is not yet claimed Green. Next session must inspect checks for latest `main` first and resolve any real remaining failure before new scope.

### Newly discovered bugs / risks
- Static source-contract tests that assert implementation location rather than semantic wiring are vulnerable to false regressions during safe refactors. Future contracts should cover abstraction boundaries explicitly when helpers own RPC calls.
- Because Game QA stopped at step 8, this run does not provide fresh evidence for the later full-game/E2E steps on Session 37/38 code. Existing earlier Green evidence remains historical only until latest QA completes.
- Observability runtime remains undeployed; no Production telemetry claim is made.

### Deploy-safety status
**Not deploy-safe.** Latest `main` still requires fresh Green `validate` + full `qa`, release preflight/migration parity, and an explicit later handoff marking the exact release deploy-safe. No Production write occurred.

### Roadmap impact
No roadmap scope changed. This session consumed the required CI-repair slot and preserved the gender-safe identity contract after the observability refactor. Anonymous-identity churn remains the next product objective only after latest checks are fully Green.

## الأولوية الدقيقة للجلسة التالية
افحص checks لأحدث `main` أولًا. إذا ظهر أي failure حقيقي، أصلح أول failure meaningful فقط. إذا أصبح `validate` + **full `qa`** Green، نفّذ **Anonymous-identity churn / public-launch abuse perimeter vertical slice** واحدًا: أقل contract عملي يحد bypass عبر إنشاء anonymous identities جديدة على create/join/telemetry/generation بدون تخزين PII أو التأثير على gameplay fairness، مع deterministic regression/E2E مناسب، وبدون Production migration/deploy إلا بعد Green + deploy-safe صريح.
