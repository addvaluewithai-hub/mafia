# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 54 started from `f28c1947dfcf1521de52b636d834d5ee4dcb6829` (`docs: record AI snapshot migration readiness`).
- Initial `validate` on that SHA was completed/success. Initial `qa` failed only at `supabase/setup-cli@v1` because resolving `version: latest` hit a GitHub rate limit; every product/static QA step before it was Green. The same exact job was rerun without code/test changes and completed/success, including clean local Supabase, AI Players E2E, full-game RPC E2E 4–10, eliminated-Boss controls, and rematch.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB contains launch-safety migration `20260911204500_public_abuse_perimeter.sql` and now also the AI snapshot identity contract from repo migration `20260912113500_ai_snapshot_identity.sql`.
- Production `room_snapshot(text)` now returns `players[].isBot` from `players.is_bot`; nickname remains the visible identity and bot identity is server-authoritative.
- Production execute boundary after rollout is verified: `anon` cannot execute `room_snapshot(text)`; `authenticated` and `service_role` can.
- Supabase recorded the controlled rollout as ledger record `20260912113608|ai_snapshot_identity` rather than the canonical repo filename timestamp. The repo migration-history map now explicitly reconciles that exact Production record to canonical migration `20260912113500`, with deterministic contract coverage added. Unknown Production records still hard-fail release preflight.
- Guarded web release remains externally blocked because the connected GitHub surface still has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- Latest implementation SHA for the parity reconciliation is `a58a424f0603b1dcdec37667e954a802d4dc8cea`; at Session 54 close its `validate` and `qa` checks are still in progress, so no new web deploy-safe claim is made.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + deterministic QA.
- [x] Migration-history parity reconciliation implemented for known historical/tool-generated records.
- [x] Launch-safety Production migration rollout + post-migration object/ledger verification.
- [x] AI Players snapshot identity DB contract rolled out to Production and ACL verified.
- [~] Web rollout completion: DB/product prerequisites are present, but guarded exact-SHA package dispatch is unavailable from the connected execution surface and latest parity-reconciliation checks are still running.
- [ ] AI Players discussion-scope decision after guarded web/live evidence is complete.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 54 — 2026-09-12 — Delivery: AI snapshot Production rollout + parity closure

### Session type
Delivery/safety-gated rollout session. Exactly one coherent objective: apply the previously approved AI snapshot identity Production migration, verify the resulting contract/ACL/ledger, and close any migration-parity issue created by that exact rollout. No web deploy or unrelated feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was `f28c1947dfcf1521de52b636d834d5ee4dcb6829`.
- `validate` was completed/success.
- `qa` initially showed completed/failure. Job inspection proved the only failure was `Install Supabase CLI`: `Failed to resolve latest Supabase CLI release: rate limit exceeded`; TypeScript, Expo doctor, identity contracts, curated coverage, 140 full-game simulations, and story critic had already passed.
- The failed QA job was rerun unchanged. Attempt 2 completed/success end-to-end, including all local Supabase schema/RPC/abuse/AI/full-game/Boss/rematch E2E steps.
- Session 53 explicitly authorized exactly one Production DB change: `20260912113500_ai_snapshot_identity.sql` only, with post-migration ledger/function/ACL/parity verification.

### Exact objective
Perform the controlled Production rollout of `20260912113500_ai_snapshot_identity.sql` only, verify `room_snapshot players[].isBot` and function privileges, inspect the resulting Production migration ledger, and keep release preflight parity accurate without weakening drift detection.

### Reproduction / design finding
- Pre-rollout Production ledger ended at the already-approved public-abuse perimeter migration and did not contain the AI snapshot migration.
- The applied repo SQL only replaces `public.room_snapshot(text)` and adds `'isBot', p.is_bot` to each player object while preserving existing room/phase/voting/privacy behavior and explicitly revoking `public`/`anon` execution.
- The Production migration application succeeded.
- Post-rollout `pg_get_functiondef` confirms `room_snapshot(text)` contains `'isBot', p.is_bot` in the player JSON object.
- Post-rollout privilege checks show `anon_execute=false`, `authenticated_execute=true`, `service_role_execute=true`.
- The Supabase migration API recorded the change as `20260912113608|ai_snapshot_identity`, not with canonical repo version `20260912113500`. The existing release preflight would therefore correctly classify it as both missing canonical migration and unexpected remote history unless reconciled.
- Because this ledger record was created by the authorized controlled rollout and its exact SQL was the canonical repo migration, the correct parity fix is an explicit narrow alias for that exact version+name, not broad matching or weakened drift checks.

### Code / database / test / doc changes
- Production DB: applied only the SQL from `supabase/migrations/20260912113500_ai_snapshot_identity.sql`. No other migration, DML, restore, service operation, or web deployment occurred.
- Production verification: re-listed migration ledger; inspected `room_snapshot(text)` definition; verified execute privileges for anon/authenticated/service_role.
- Release parity: added canonical alias `20260912113500` → exact Production record `{version: 20260912113608, name: ai_snapshot_identity}` in `scripts/release/migration-history-map.json`.
- Regression: extended `scripts/qa/release-preflight-contract.mjs` with the AI snapshot migration fixture and exact rollout alias; it still proves failed QA blocks, missing canonical migration blocks, incomplete composite aliases block, and unknown Production history blocks.
- Docs: updated this handoff with rollout evidence, transient-QA diagnosis, parity reconciliation, current checks, risks, and next priority.

### Commits
- Starting handoff: `f28c1947dfcf1521de52b636d834d5ee4dcb6829` — `docs: record AI snapshot migration readiness`.
- Parity map: `a8e797b48829b8d6fc114bb5313db279c1f04e54` — `fix: reconcile AI snapshot production migration`.
- Parity regression: `a58a424f0603b1dcdec37667e954a802d4dc8cea` — `test: cover AI snapshot migration alias`.
- Session handoff: `docs: record AI snapshot production rollout`.

### Check / test results at session close
- Starting SHA `f28c1947dfcf1521de52b636d834d5ee4dcb6829`: `validate` completed/success ✅.
- Starting SHA Game QA attempt 1: failed only at Supabase CLI latest-release resolution due GitHub rate limit; no product/test failure was observed.
- Starting SHA Game QA attempt 2: completed/success ✅; clean local Supabase + all schema/RPC/AI/full-game/Boss/rematch E2E passed.
- Production migration application: success ✅.
- Production ledger: includes `20260912113608|ai_snapshot_identity` ✅.
- Production function contract: `room_snapshot(text)` includes `players[].isBot` from `p.is_bot` ✅.
- Production ACL: anon execute denied; authenticated/service_role execute allowed ✅.
- Latest implementation SHA `a58a424f0603b1dcdec37667e954a802d4dc8cea`: `validate` in progress; `qa` in progress at last inspection. Therefore the new parity-map/test commits are not yet considered Green or web deploy-safe.
- No failing product test was weakened, deleted, skipped, or rewritten.

### Newly discovered bugs / risks
- No gameplay P0 or functional regression discovered.
- `version: latest` in `supabase/setup-cli@v1` can transiently fail when GitHub release resolution is rate-limited. This run recovered on an unchanged rerun; it is infrastructure flakiness, not evidence to weaken QA.
- Supabase's migration application surface can create a ledger timestamp different from the canonical filename. This exact rollout record is now explicitly reconciled, while unknown drift remains a hard failure.
- Latest-source live browser evidence remains blocked until the guarded exact-SHA web release path is executable.

### Deploy-safety status
The authorized Production DB rollout is complete and post-migration verification passed. No additional Production DB change is authorized by this session. No Vercel/web deploy is authorized: latest parity-reconciliation commits still have running checks, and the guarded exact-SHA package path remains unavailable from the connected execution surface.

### Roadmap impact
- AI Players authoritative snapshot identity is now complete through Production DB contract/ACL, eliminating the known deployment-order gap for `players[].isBot` at the database layer.
- Migration parity now accounts for the exact ledger identity produced by this rollout without relaxing unknown-drift protection.
- Guarded web/live evidence remains the remaining prerequisite before any AI Players discussion-scope decision.

## الأولوية الدقيقة للجلسة التالية
حل نتيجة checks على latest `main` أولًا. إذا أصبحت `validate` و`qa` Green، نفّذ **read-only exact-SHA release/preflight parity audit ضد Production** للتأكد أن كل repo migrations—بما فيها `20260912113500_ai_snapshot_identity.sql`—تتصالح مع ledger الحالي بلا missing أو unexpected records. لا تنفذ أي Production migration أو generic/unpinned web deploy في نفس الجلسة.
