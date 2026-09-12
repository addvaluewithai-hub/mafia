# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest pre-session `main`: `e2bc2715d343b16e036dbfc16bd67c4858e5a35b`.
- Exact-SHA GitHub checks على هذا الـSHA: `validate` completed/success ✅ و`qa` completed/success ✅.
- Core/full-game 4–10: Green على full Game QA الحالي، بما في ذلك deterministic complete-game coverage + local Supabase RPC E2E لمسارات tie/reconnect/eliminated Boss/rematch والـabuse perimeter. لا يوجد P0 gameplay معروف في هذا checkpoint.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts Green.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ آخر story critic/fairness evidence ما زال Green؛ لا دليل حالي يبرر 11–15.
- Solo/AI Players MVP live in Production؛ snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.
- Production observability code موجود مع privacy-safe allowlist + release correlation + telemetry churn guard، لكنه غير مثبت كـdeployed runtime.
- Anonymous-auth churn perimeter code Green لكنه غير موجود في Production DB حسب آخر read-only inspection: `public.public_abuse_rate_limits`, `claim_public_abuse_slot`, `create_room_v4`, و`join_room_v3` absent.
- Production Supabase project `mafia` كان `ACTIVE_HEALTHY` في آخر read-only inspection، ومقدمات migration المطلوبة موجودة.
- Production migration ledger التاريخي لا يطابق repo migration filename versions. `scripts/release/preflight.mjs` يجمع الـ14-digit filename prefixes ويقارنها حرفيًا مع `supabase_migrations.schema_migrations.version`; و`release-preflight-contract.mjs` يختبر نفس الافتراض فقط. لذلك release guard الحالي hard-stops على Production legacy history حتى لو كانت الـschema الفعلية متوافقة.
- limitation مقصودة للـabuse perimeter: clearing app/site storage يمكنه تدوير installation key؛ هذا perimeter ضد routine auth churn وليس fraud-proof device fingerprint، ولا يستخدم PII أو gameplay identity.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection per authenticated identity.
- [x] Room creation/join abuse protection per authenticated identity + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + final Green QA on exact SHA.
- [~] Fresh production release readiness: exact-SHA checks are Green and Production was inspected read-only, but migration-history parity guard is blocked by legacy ledger/version mismatch and the abuse-perimeter migration is genuinely absent in Production.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 39 — 2026-09-11 — Launch-safety checkpoint
Checkpoint/planning only. Starting SHA `62509fd60dfab0769c648ed304925979dcb9c42c` had `validate` + `qa` success. Audit found no P0 gameplay regression and made anonymous-auth churn the next exact priority, followed by fresh release readiness, AI Players live UX evidence, then an AI scope decision checkpoint. No Production write/deploy/migration.

## Session 40 — 2026-09-11 — Anonymous-identity churn / public-launch abuse perimeter
Delivery. Added migration `20260911204500_public_abuse_perimeter.sql`, digest-only installation-key limiter state, `create_room_v4`, `join_room_v3`, generation/telemetry installation-budget guards, client wiring, deterministic local-Supabase churn E2E, Game QA wiring, and privacy/runbook docs. Existing per-auth quotas remain in force. No Production write/deploy/migration. Initial handoff later exposed stale/static QA-contract issues rather than runtime privacy defects.

## Session 41 — 2026-09-12 — Abuse perimeter CI contract repair
Delivery / CI repair. Updated the Gender UI contract to follow the intentional `create_room_v4` / `join_room_v3` security boundary while retaining gender semantics and asserting `p_abuse_key`. No runtime/schema/Production change. That repair revealed the next QA failure in the perimeter privacy assertion.

## Session 42 — 2026-09-12 — Abuse perimeter privacy assertion repair
Delivery / CI repair. GitHub Actions logs showed the failing privacy assertion was a false positive caused by scanning the whole table DDL for substring `room`, which matched allowed action literals such as `create_room`. The test was strengthened to parse real column identifiers, require the exact minimal limiter schema, and run forbidden-identity assertions against columns only. Repair commit `c7e0993b83d4a8f9f1ae9f26a1a71eb50ebcde98`; handoff commit `3eed7d67ed92e75aef5102035bf240bfc2cea07b` subsequently completed with both `validate` and full `qa` success.

## Session 43 — 2026-09-12 — Fresh launch-safety release readiness audit
### Session type
Delivery / release-readiness audit — exactly one coherent objective: prove exact-SHA QA state and Production migration/preflight readiness read-only before any launch-safety Production mutation. No gameplay/story feature, Production deploy, Production migration, restore, or Production DB write.

### Starting evidence
- Read repository truth in required order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `3eed7d67ed92e75aef5102035bf240bfc2cea07b`.
- GitHub check-runs for that exact SHA: `validate` completed/success ✅ and `qa` completed/success ✅.
- Current release tooling requires an exact 40-character SHA, those two Green checks, exact migration-history parity, read-only preflight success, and explicit deploy-safe handoff evidence before packaging/deploy.

### Exact objective
Perform a fresh, read-only release-readiness check for the current launch-safety candidate: exact-SHA checks + Production Supabase health/dependency inspection + migration ledger/parity evidence. Stop and document drift rather than applying a migration or deploying.

### Reproduction / design finding
- Production Supabase project `mafia` is `ACTIVE_HEALTHY`.
- Read-only inspection confirms `public.public_abuse_rate_limits` and the new abuse-perimeter RPCs are absent in Production, so `20260911204500_public_abuse_perimeter.sql` is genuinely not deployed.
- The migration's prerequisite Production RPCs are present with the expected signatures.
- A second, older drift exists in migration bookkeeping: Production `supabase_migrations.schema_migrations` versions are server-recorded IDs that do not equal the filename prefixes in the repository. `scripts/release/preflight.mjs` currently compares those values literally, so its parity rule cannot pass against current Production history as-is.
- Safe next action is not to bypass preflight and not to apply the new migration yet. First reconcile/repair the migration-ledger parity contract in repository tooling with durable evidence for legacy Production history; then rerun exact-SHA preflight.

### Code / database / test / doc changes
- No application/schema/runtime code changed.
- No Production state changed; all Supabase operations were read-only.
- Updated handoff with exact Green candidate SHA, current Production absence of the perimeter objects, confirmed prerequisites, and migration-ledger blocker.

### Check/test results
- Candidate `3eed7d67ed92e75aef5102035bf240bfc2cea07b`: `validate` success ✅; full `qa` success ✅.
- Production DB health: `ACTIVE_HEALTHY` ✅.
- Abuse-perimeter Production parity: FAIL / expected drift ❌ — limiter table and new RPCs absent.
- Literal migration-ledger parity used by current preflight: FAIL ❌ — historical Production ledger versions do not match repo filename prefixes.
- No release package or deployment attempted because parity is a hard stop.

### Deploy-safety status
**Not deploy-safe for Production rollout.** Relevant E2E/QA is Green, but the required Production migration is absent and current migration-history preflight cannot establish trustworthy parity because of legacy ledger/version mismatch. No Production mutation occurred.

## Session 44 — 2026-09-12 — Migration parity / launch-safety checkpoint
### Session type
Checkpoint / planning only. No product feature, schema change, Production deploy, migration, restore, or Production DB write.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at checkpoint start: `e2bc2715d343b16e036dbfc16bd67c4858e5a35b` (`docs: record fresh release readiness audit`).
- Exact-SHA GitHub checks on that commit: `validate` completed/success ✅ and `qa` completed/success ✅.
- Four sessions elapsed since Session 39 checkpoint, so checkpoint cadence is due.

### Exact objective
Audit what is actually Green versus launch-blocked, verify the migration-history parity blocker in repository tooling, review gameplay/story/curated/AI evidence gaps, and set the next 3–4 substantial objectives without implementing unrelated scope.

### Reproduction / design finding
- No P0 gameplay regression surfaced. Core/full-game, identity/gender/caseRole, curated 4–10, abuse-perimeter QA, and current regression suites remain Green via the latest full `qa` check.
- Release guard defect is confirmed in repository code, not just handoff prose: `preflight.mjs` derives local identity exclusively from 14-digit migration filename prefixes and compares them set-for-set to Production ledger `version` values.
- Its deterministic contract test uses fixtures where remote versions intentionally equal those same local filename timestamps. Therefore the test proves strict literal equality behavior, but does **not** model or reconcile the known legacy Production ledger representation.
- This should be repaired by introducing a deterministic repository-owned migration-history identity/reconciliation source of truth (or equivalent verified mapping) that can distinguish known legacy aliases from genuine missing/unexpected migrations. The guard must still hard-fail unknown drift; do not convert parity into a permissive count-only/schema-only check.
- The genuinely absent `20260911204500_public_abuse_perimeter.sql` must remain detectable as missing after reconciliation. Fixing legacy identity mapping must not make that pending migration appear applied.
- AI Players still has a separate evidence gap: live/browser snapshot identity and UX proof before further LLM discussion scope. It stays behind the launch-safety blocker.
- Story/curated status does not justify new content scope now: 4–10 coverage is already Green and there is no evidence supporting 11–15 expansion.

### Code / database / test / doc changes
- Checkpoint only: no application, test, release script, schema, or Production state changed.
- Updated this handoff to record latest Green `main`, confirm the exact faulty parity assumption in code/tests, and define the next milestones.

### Commits
- Starting checkpoint SHA: `e2bc2715d343b16e036dbfc16bd67c4858e5a35b` — `validate` + `qa` Green.
- Checkpoint handoff commit: `docs: record migration parity checkpoint`.

### Check/test results
- `e2bc2715d343b16e036dbfc16bd67c4858e5a35b`: `validate` success ✅; `qa` success ✅.
- No new runtime tests were introduced in this checkpoint.
- Existing release-preflight contract still tests literal timestamp equality and therefore does not resolve the known Production ledger mismatch.

### Newly discovered bugs / risks
- The release-preflight test suite can be Green while the production-facing parity model is structurally incapable of recognizing the existing legacy migration ledger. This is a test-model coverage gap, not evidence that the production ledger is safe to rewrite.
- A naive alias/mapping fix could accidentally hide genuinely missing migrations. The next implementation must include negative fixtures proving that an allowed legacy mapping still reports the absent abuse-perimeter migration and still rejects unknown remote/local drift.
- Production observability remains code-complete but not runtime-proven deployed; do not treat it as live telemetry evidence until rollout is safely completed.
- No new gameplay/story P0 discovered.

### Deploy-safety status
**Not deploy-safe for launch-safety Production rollout.** App/QA checks are Green, but migration-history parity is not truthfully provable yet and the abuse-perimeter migration remains absent in Production. No Production mutation occurred.

### Roadmap impact / next milestones
1. **Migration-history parity contract reconciliation** — repository-owned deterministic mapping/identity model + regression fixtures that preserve hard failure for unknown drift and still flag the pending abuse-perimeter migration.
2. **Fresh exact-SHA release readiness rerun** — after objective 1 is Green, rerun `validate`/full `qa` and read-only Production preflight/parity; record whether the exact change is deploy-safe. No Production mutation in that proof session unless separately authorized and explicitly safe.
3. **Launch-safety rollout verification** — only after explicit deploy-safe evidence: apply/verify the exact authorized migration/release change with smoke checks and rollback-aware evidence; otherwise stay blocked.
4. **AI Players live UX/snapshot identity evidence** — browser/live validation before deciding any larger LLM discussion scope.

## الأولوية الدقيقة للجلسة التالية
إذا latest `main` ما زال Green، نفّذ **Migration-history parity contract reconciliation** كـvertical slice واحد: أضف source-of-truth/mapping deterministic للـlegacy Production migration identities، حدّث `preflight.mjs` ليستخدمه، وأضف regression fixtures تثبت (أ) known legacy history passes، (ب) `20260911204500_public_abuse_perimeter.sql` يظل missing حتى يُطبق فعلًا، و(ج) أي unknown local/remote drift يظل hard failure. لا تطبق migration ولا deploy Production في هذه الجلسة.