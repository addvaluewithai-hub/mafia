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
- latest Session 40 handoff SHA `5a4451777b9ccb753b2d1f922cfba6512c4884c9`: `validate` completed/success ✅ لكن full `qa` completed/failure ❌ في `Gender UI RPC contract` قبل أي local-Supabase E2E.
- Session 41 أصلحت هذا failure فقط داخل نفس objective: الاختبار القديم كان يطالب `create_room_v3` و`join_room_v2` بينما runtime الصحيح بعد Session 40 يستخدم `create_room_v4` و`join_room_v3` لإبقاء gender contract والـpublic abuse perimeter معًا.
- Core/full-game 4–10: آخر Green baseline قبل Session 40 كان deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 gameplay معروف من ذلك baseline، لكن full suite يجب أن تعود Green بعد إصلاح Session 41 قبل أي release scope.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts كانت Green قبل Session 40.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ fairness review الحالية PASS؛ لا دليل يبرر 11–15 الآن.
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
- [~] Anonymous-identity churn / public-launch abuse perimeter implemented; Session 41 repaired the first stale CI contract, final Green full QA still required before closure.
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
- This handoff commit: `docs: record abuse perimeter CI repair session`.

### Check/test results
- Starting SHA `5a4451777b9ccb753b2d1f922cfba6512c4884c9`: `validate` success ✅, `qa` failure ❌ at `Gender UI RPC contract`.
- Repair SHA `0fbd799568cc63b3353c1bea35e9c2819311013f`: fresh `validate` and `qa` were queued at inspection time.
- Because full QA has not yet completed on the repair, the anonymous-churn objective is still not closed/deploy-safe.

### Newly discovered bugs / risks
- Static contract tests that hard-code RPC version names can become stale when a new server wrapper intentionally preserves semantics while adding a safety boundary. Future contract changes should assert the current security + product semantics together, as this repair now does.
- No new P0 gameplay defect was discovered in this session; full-game/local-Supabase steps did not run on the failed starting SHA because QA stopped earlier.
- Production still lacks `20260911204500_public_abuse_perimeter.sql`; do not point Production clients at the new create/join/generation perimeter until exact-SHA QA and migration sequencing are Green and explicitly approved as deploy-safe.

### Deploy-safety status
**Not deploy-safe.** The repair commit's full `qa` was still queued at inspection time, and Production migration parity has not been re-proven. No Production mutation occurred.

### Roadmap impact
- No roadmap expansion. This session only repaired the prerequisite CI gate for the Session 40 launch-safety objective.
- Fresh release readiness remains blocked until latest `main` has both `validate` and full `qa` completed/success.
- AI Players UX evidence and unrelated features remain deferred.

## الأولوية الدقيقة للجلسة التالية
افحص أحدث `main` أولًا. إذا `validate` أو full `qa` ما زال فاشلًا، أصلح **أول failure meaningful فقط** ولا تبدأ release scope. إذا كلاهما completed/success على أحدث handoff SHA، نفّذ **Fresh release readiness for the launch-safety stack** كـvertical slice واحد read-only أولًا: exact-SHA checks + Production migration parity/preflight للـcandidate الحالي، وثّق أي drift وأفضل next action، ولا تطبق migration أو deploy إلا إذا relevant E2E Green والهاند أوف يسجل التغيير المحدد `deploy-safe` صراحة.
