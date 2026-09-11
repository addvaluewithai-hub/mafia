# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 40 نفذت anonymous-auth churn perimeter عبر random locally persisted installation key؛ الـDB يخزن SHA-256 فقط، مع بقاء quotas القديمة per `auth.uid()` كطبقة إضافية.
- Session 41 أصلحت stale Gender UI contract ليتبع `create_room_v4`/`join_room_v3`، لكن latest handoff SHA `913c495b12e9cd7cf59f75a9802a86e3ba323aca` انتهى إلى `validate` success ✅ وfull `qa` failure ❌ في `Anonymous identity churn perimeter`.
- Session 42 أثبتت من GitHub Actions logs أن failure Session 41 كان false positive داخل privacy assertion: الاختبار كان يبحث عن substring `room` في تعريف الجدول كله، فالتقط action value المسموح `create_room` داخل CHECK constraint رغم عدم وجود room identity column. تم إصلاح الاختبار ليحلل column identifiers فعليًا ويثبت schema minimal محددًا؛ repair SHA `c7e0993b83d4a8f9f1ae9f26a1a71eb50ebcde98` و`validate`/`qa` كانا queued عند آخر inspection.
- Core/full-game 4–10: آخر Green baseline قبل Session 40 كان deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ على failing Session 41 run نجحت static/full-game simulations و140 games، لكن later local-Supabase full-game steps اتعمل لها skip بعد perimeter assertion failure. يجب full suite ترجع Green قبل release scope.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts ما زالت Green حتى خطوة failure الحالية.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ story critic في failing Session 41 run PASS بمتوسط 9.9/10 وبدون early fairness warnings؛ لا دليل يبرر 11–15 الآن.
- Solo/AI Players MVP live in Production؛ snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.
- Production observability code موجود مع privacy-safe allowlist + release correlation + telemetry churn guard، لكنه غير مثبت كـdeployed runtime.
- limitation مقصودة للـabuse perimeter: clearing app/site storage يمكنه تدوير installation key؛ هذا perimeter ضد routine auth churn وليس fraud-proof device fingerprint، ولا يستخدم PII أو gameplay identity.
- آخر Production DB evidence من Session 34: Supabase `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`; migration `20260911204500_public_abuse_perimeter.sql` **لم تُطبّق Production**.

## Roadmap status
- [x] Core/full-game 4–10 stable at last Green baseline.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection per authenticated identity.
- [x] Room creation/join abuse protection per authenticated identity + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [~] Anonymous-identity churn / public-launch abuse perimeter implemented; Session 41 exposed a test false positive, Session 42 repaired that assertion, final Green full QA still required before closure.
- [ ] Fresh production parity + guarded release evidence for current launch-safety stack; observability + churn perimeter remain undeployed until explicitly released.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 39 — 2026-09-11 — Launch-safety checkpoint
Checkpoint/planning only. Starting SHA `62509fd60dfab0769c648ed304925979dcb9c42c` had `validate` + `qa` success. Audit found no P0 gameplay regression and made anonymous-auth churn the next exact priority, followed by fresh release readiness, AI Players live UX evidence, then an AI scope decision checkpoint. No Production write/deploy/migration.

## Session 40 — 2026-09-11 — Anonymous-identity churn / public-launch abuse perimeter
Delivery. Added migration `20260911204500_public_abuse_perimeter.sql`, digest-only installation-key limiter state, `create_room_v4`, `join_room_v3`, generation/telemetry installation-budget guards, client wiring, deterministic local-Supabase churn E2E, Game QA wiring, and privacy/runbook docs. Existing per-auth quotas remain in force. No Production write/deploy/migration. Handoff SHA `5a4451777b9ccb753b2d1f922cfba6512c4884c9` later proved `validate` Green but full `qa` failed at the first static Gender UI RPC contract, so Session 40 was not deploy-safe.

## Session 41 — 2026-09-12 — Abuse perimeter CI contract repair
### Session type
Delivery / CI repair — exactly one coherent objective: repair the first meaningful Session 40 QA failure without beginning release-readiness scope. No gameplay/story feature, Production deploy, Production migration, restore, or Production DB write.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting latest `main`: `5a4451777b9ccb753b2d1f922cfba6512c4884c9` (`docs: record anonymous churn perimeter session`).
- Starting `validate`: completed/success ✅.
- Starting full `qa`: completed/failure ❌.
- Failed step: `Gender UI RPC contract`; TypeScript, Expo doctor, and Vote UI authoritative contract had already passed. All later Game QA steps were skipped because the job stopped at that failure.

### Exact objective
Repair the stale gender UI contract so it verifies the current Session 40 create/join boundary end-to-end: gender must still be submitted, and the helper must use the abuse-perimeter RPC versions rather than bypassing them.

### Reproduction / design finding
- `scripts/qa/gender-ui-contract.mjs` still asserted `create_room_v3` and `join_room_v2`.
- Runtime `lib/game.ts` intentionally moved to `create_room_v4` and `join_room_v3` in Session 40. Those RPCs preserve the gender parameters while adding `p_abuse_key`.
- Therefore the failure was a stale static contract, not evidence that gender selection disappeared. The correct repair is to strengthen the test around the new boundary, not revert runtime and not delete/skip the test.

### Code / database / test / doc changes
- Updated `scripts/qa/gender-ui-contract.mjs` to require:
  - Create UI still renders `GenderPicker` and sends `bossGender` through the create helper.
  - The create helper calls `create_room_v4`, sends `p_boss_gender`, and sends `p_abuse_key: getAbuseInstallationKey()`.
  - The helper must not call `create_room_v3`/`create_room_v2`, which would bypass the Session 40 perimeter.
  - Join UI still renders `GenderPicker` and sends `joinGender`.
  - `joinRoom` calls `join_room_v3`, sends `p_gender`, and sends the installation abuse key.
  - `joinRoom` must not call `join_room_v2` or legacy `join_room`.
- No schema, backend runtime, UI behavior, or Production state was changed in this repair.
- This handoff documents the exact CI evidence and keeps release work blocked until full QA completes Green.

### Commits
- `0fbd799568cc63b3353c1bea35e9c2819311013f` — `test: align gender UI contract with abuse perimeter RPCs`.
- Handoff commit: `913c495b12e9cd7cf59f75a9802a86e3ba323aca` — `docs: record abuse perimeter CI repair session`.

### Check/test results
- Starting SHA `5a4451777b9ccb753b2d1f922cfba6512c4884c9`: `validate` success ✅, `qa` failure ❌ at `Gender UI RPC contract`.
- Handoff SHA `913c495b12e9cd7cf59f75a9802a86e3ba323aca`: `validate` success ✅, `qa` failure ❌ at `Anonymous identity churn perimeter` after Gender UI contract itself passed.

### Newly discovered bugs / risks
- Static contract tests that hard-code RPC version names can become stale when a new server wrapper intentionally preserves semantics while adding a safety boundary. Future contract changes should assert the current security + product semantics together, as this repair now does.
- No new P0 gameplay defect was discovered in this session.
- Production still lacks `20260911204500_public_abuse_perimeter.sql`; do not point Production clients at the new create/join/generation perimeter until exact-SHA QA and migration sequencing are Green and explicitly approved as deploy-safe.

### Deploy-safety status
**Not deploy-safe.** Full QA still has a failing perimeter step; Production migration parity has not been re-proven. No Production mutation occurred.

### Roadmap impact
- No roadmap expansion. This session repaired the first prerequisite CI gate for the Session 40 launch-safety objective.
- Fresh release readiness remains blocked until latest `main` has both `validate` and full `qa` completed/success.

## Session 42 — 2026-09-12 — Abuse perimeter privacy assertion repair
### Session type
Delivery / CI repair — exactly one coherent objective: diagnose and repair the first meaningful failing check on latest `main`. No release-readiness implementation, gameplay/story feature, Production deploy, Production migration, restore, or Production DB write.

### Starting evidence
- Read repository truth in required order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `913c495b12e9cd7cf59f75a9802a86e3ba323aca`.
- Starting `validate`: completed/success ✅.
- Starting full `qa`: completed/failure ❌.
- GitHub Actions job evidence showed Gender UI RPC contract now passes, Full-game state simulations pass with 140 complete games, story critic passes, and local Supabase identity/gender/case-role/generation/room-join guards pass before the failing step.
- First meaningful failure: `Anonymous identity churn perimeter` assertion `limiter table must not store room`; all later AI-player/full-game/Boss/rematch local-Supabase steps were skipped because the job stopped there.

### Exact objective
Repair the perimeter privacy regression test so it accurately proves that the limiter table contains no gameplay identity/PII columns, without treating allowed action enum values such as `create_room` as stored room identity.

### Reproduction / design finding
- `scripts/qa/public-abuse-perimeter-e2e.mjs` extracted the table DDL correctly, but then used `tableDefinition.toLowerCase().includes('room')` and similar substring checks across the entire DDL body.
- The schema has no room identity column. The literal `room` appears only inside allowed action values `create_room` / `join_room` in the `action` CHECK constraint.
- GitHub Actions logs therefore prove a test false positive, not a privacy leak or DB schema regression.
- The correct repair is to make the assertion column-aware and stronger: parse typed column declarations, require the exact minimal schema, then apply forbidden-identity checks only to column identifiers.

### Code / database / test / doc changes
- Updated `scripts/qa/public-abuse-perimeter-e2e.mjs` to parse actual typed column identifiers from the limiter table definition.
- Added an exact schema assertion requiring only `key_hash`, `action`, `window_started_at`, `attempts`, and `updated_at`.
- Kept forbidden identity checks for nickname/gender/room/player/story/mafia/user_id, now applied to actual column names instead of enum values/constraint text.
- Preserved the existing SHA-256 digest assertion, private-table assertion, anonymous-auth churn behavior, independent installation-key behavior, create/join/generation/telemetry wiring checks, and no-raw-key logging contract.
- No production/runtime schema or behavior changed in this repair.

### Commits
- `c7e0993b83d4a8f9f1ae9f26a1a71eb50ebcde98` — `test: make abuse limiter privacy assertion column-aware`.
- This handoff commit: `docs: record abuse perimeter privacy assertion repair`.

### Check/test results
- Starting SHA `913c495b12e9cd7cf59f75a9802a86e3ba323aca`: `validate` success ✅, full `qa` failure ❌ specifically at `Anonymous identity churn perimeter` after the preceding checks passed.
- Repair SHA `c7e0993b83d4a8f9f1ae9f26a1a71eb50ebcde98`: fresh `validate` and `qa` were both queued at last inspection.
- Because full QA has not yet completed Green on the repair, Session 40's anonymous-churn objective remains open and release-readiness remains blocked.

### Newly discovered bugs / risks
- DDL privacy assertions must distinguish schema identifiers from literal values/constraint text; substring scanning can create false positives that stop the full QA pipeline before later gameplay E2E executes.
- No evidence from this run indicates that the limiter stores room identity or other gameplay PII; the exact current table columns remain digest/action/window counters only.
- Later local-Supabase full-game/Boss/rematch coverage still needs a fresh completed run because those steps were skipped after the starting failure.
- Production still lacks migration `20260911204500_public_abuse_perimeter.sql`; do not deploy or apply it until exact-SHA relevant QA is Green and a later handoff explicitly records the release as deploy-safe.

### Deploy-safety status
**Not deploy-safe.** Repair checks were queued at the last inspection, and fresh Production migration parity has not been re-proven. No Production mutation occurred.

### Roadmap impact
- No roadmap expansion and no new feature scope.
- This keeps focus on closing the existing launch-safety objective before release readiness.
- Fresh release readiness remains the next milestone only after latest `main` has completed/success for both `validate` and full `qa`.

## الأولوية الدقيقة للجلسة التالية
افحص أحدث `main` أولًا. إذا `validate` أو full `qa` فشل، أصلح **أول failure meaningful فقط** ولا تبدأ release scope. إذا كلاهما completed/success على أحدث handoff SHA، نفّذ **Fresh release readiness for the launch-safety stack** كـvertical slice واحد read-only أولًا: exact-SHA checks + Production migration parity/preflight للـcandidate الحالي، وثّق أي drift وأفضل next action، ولا تطبق migration أو deploy إلا إذا relevant E2E Green والهاند أوف يسجل التغيير المحدد `deploy-safe` صراحة.
