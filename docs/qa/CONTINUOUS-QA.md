# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 55 started from `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5` (`docs: record AI snapshot production rollout`).
- Exact-SHA GitHub checks are Green: `validate` completed/success and `qa` completed/success on `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5`.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB contains the launch-safety public-abuse perimeter and AI snapshot identity rollout. `room_snapshot(text)` returns `players[].isBot` from `players.is_bot`; nickname remains the visible identity.
- Production migration parity is now read-only verified against latest `main`: all 17 repo migrations reconcile with all 20 Production ledger records under `scripts/release/preflight.mjs` semantics and `scripts/release/migration-history-map.json`; there are zero missing canonical migrations and zero unexpected Production records.
- The exact AI snapshot rollout ledger record `20260912113608|ai_snapshot_identity` reconciles only through the explicit canonical alias for repo migration `20260912113500`; unknown Production records still hard-fail preflight.
- Guarded web release remains externally blocked because the connected GitHub execution surface still has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- No Production mutation or web deployment occurred in Session 55.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + relevant E2E + Production DB rollout.
- [x] AI Players authoritative `isBot` snapshot contract + explicit UI consumption.
- [x] Release parity + deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + deterministic QA.
- [x] Migration-history parity reconciliation for known historical/tool-generated records.
- [x] Launch-safety and AI snapshot Production migrations rolled out and verified.
- [x] Latest exact-SHA Production migration parity audit: 17/17 repo migrations reconciled against 20/20 Production ledger records.
- [~] Web rollout completion: DB/product/check prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [ ] AI Players discussion-scope decision after guarded web/live evidence is complete.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 55 — 2026-09-12 — Delivery: exact-SHA Production release/preflight parity audit

### Session type
Delivery/release-readiness audit. Exactly one coherent objective: resolve latest checks and perform the handoff-requested read-only exact-SHA migration parity audit against Production. No Production migration, DML, restore, service operation, web deploy, or unrelated feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5`.
- GitHub check-runs for that exact SHA show exactly the required release checks: `validate` completed/success and `qa` completed/success.
- The latest tree contains 17 canonical repo migration files, ending with `20260912113500_ai_snapshot_identity.sql`.
- `migration-history-map.json` explicitly maps the known legacy/tool-generated Production history, including canonical `20260912113500` → exact Production record `20260912113608|ai_snapshot_identity`, and separately recognizes the two historical-only temporary bridge records.

### Exact objective
Perform a read-only release/preflight parity audit for exact SHA `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5`: verify required checks are Green and reconcile every repo migration against the current Production migration ledger using the same matching semantics as `scripts/release/preflight.mjs`, without changing Production.

### Reproduction / design finding
- `scripts/release/preflight.mjs` requires a full 40-character SHA, successful `validate` and `qa` checks for that same SHA, and migration parity with no missing local canonical version and no unrecognized Production ledger record.
- Fresh Production read-only ledger inspection returned 20 records.
- Canonical migrations that were applied under the same timestamp reconcile directly by version; tool-applied records whose names begin with a canonical timestamp reconcile through the script's named-canonical rule.
- Historical timestamp divergences reconcile only through the narrow explicit alias map. The composite curated-story alias requires both known Production records. The AI snapshot canonical migration requires the exact `20260912113608|ai_snapshot_identity` record.
- Deterministic reconciliation using the current repo tree, current alias map, current historical-only list, and fresh Production ledger yields: 17 repo migrations applied/reconciled, 20 Production records recognized, `missingRemote=[]`, `unexpectedRemote=[]`.
- Therefore the migration-parity portion of release preflight is Green for this exact source state. This does not itself authorize a web deployment because the guarded exact-SHA packaging/dispatch path remains unavailable.

### Code / database / test / doc changes
- Code: none.
- Production DB: read-only inspection only; queried `supabase_migrations.schema_migrations` ordered by version. No DDL/DML/migration was executed.
- Tests/checks: no tests weakened, skipped, deleted, or rewritten. Existing exact-SHA `validate` and `qa` are Green.
- Docs: refreshed this rolling handoff with the exact parity evidence, current blocker, deploy-safety status, roadmap impact, and next-session priority.

### Commits
- Audited source/handoff SHA: `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5` — `docs: record AI snapshot production rollout`.
- Session 55 handoff: `docs: record production parity audit`.

### Check / test results at session close
- `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5` `validate`: completed/success ✅.
- `d6ce0a92aeb1317cbef7088ef96dd36dc8adf3a5` `qa`: completed/success ✅.
- Repo migration count: 17.
- Fresh Production ledger record count: 20.
- Missing canonical migrations after reconciliation: 0 ✅.
- Unexpected/unrecognized Production records after reconciliation: 0 ✅.
- No product regression or gameplay P0 discovered.
- No Production write or web deploy occurred.

### Newly discovered bugs / risks
- No new gameplay bug or migration drift was discovered.
- The guarded web release remains an external execution-capability blocker, not a product/DB parity blocker: the current connected GitHub surface cannot dispatch `Vercel Release Package` with an exact `release_sha` input.
- A generic/unpinned deploy would bypass the repository's provenance guard and remains prohibited.
- Migration-history correctness depends on preserving narrow aliases; broadening alias matching would reduce drift detection and should not be done.

### Deploy-safety status
Production DB parity is Green and latest exact-SHA required checks are Green. No additional Production DB change is needed or authorized by this session. A web deployment is still **not authorized from the current execution surface** because the required guarded exact-SHA package workflow cannot be dispatched here. Do not substitute a generic/unpinned Vercel deployment.

### Roadmap impact
- The Production migration/parity uncertainty created by the AI snapshot rollout is fully closed: repo and Production history reconcile with zero missing or unexpected records.
- Database state is no longer the blocker for guarded web/live evidence.
- The remaining release blocker is narrowly isolated to exact-SHA package dispatch/provenance execution.
- The recent sequence has now completed enough implementation/safety sessions since the last planning checkpoint that the next run should use the protocol's bounded checkpoint cadence rather than inventing a new feature while release execution remains blocked.

## الأولوية الدقيقة للجلسة التالية
نفّذ **Checkpoint/Planning session واحدة محدودة** وفق `QA-OPERATING-MODE.md`: راجع ما هو Green فعليًا بعد إغلاق DB parity، full-game coverage gaps، web-release execution blocker، AI Players live-evidence gap، story/curated 4–10 status، technical debt، وهل يجب تغيير الأولويات. حدّث الهاند أوف بـ3–4 أهداف/معالم substantial تالية وبأولوية جلسة واحدة دقيقة. لا تنفذ feature جديدة أو Production change أثناء الـcheckpoint.
