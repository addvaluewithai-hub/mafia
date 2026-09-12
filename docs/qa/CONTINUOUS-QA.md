# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest `main` at Session 49 start: `f103b7f33904c2c46bc1d293879fb43918274f10` (`docs: record exact-SHA web release blocker`).
- Exact-SHA GitHub workflows on that SHA are Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB already contains `20260911204500_public_abuse_perimeter.sql`; post-migration object/ledger verification and migration parity were Green in the rollout session.
- The repository release invariant still requires the `Vercel Release Package` workflow for an exact 40-character `main` SHA, including read-only preflight before package creation.
- The connected GitHub execution surface still exposes workflow/check reads plus rerun actions, but no workflow-dispatch action; therefore it cannot start the required package workflow with a `release_sha` input.
- No Production web deploy or Production DB write occurred in Session 49.

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
- [~] Web release readiness: DB parity and latest-main checks are Green, but the guarded exact-SHA package/deploy path remains blocked by unavailable workflow-dispatch capability in the connected automation surface.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 49 — 2026-09-12 — Guarded exact-SHA web release gate recheck

### Session type
Delivery/release-readiness session. Exactly one coherent objective: resolve the existing guarded exact-SHA web release gate without bypassing repository-owned safety invariants. No feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` is `f103b7f33904c2c46bc1d293879fb43918274f10`.
- CI/`validate` and Game QA/`qa` on that exact SHA are both completed/success.
- `docs/operations/RELEASE-RUNBOOK.md` still requires: exact 40-character `main` SHA, Green `validate` + `qa`, reconciled Production migrations, successful read-only release preflight, explicit deploy-safe handoff state, then the repository `Vercel Release Package` artifact path.

### Exact objective
Attempt only the repository-defined guarded web release path for the latest Green SHA. Do not use a generic or unpinned Vercel deployment as a substitute.

### Reproduction / design finding
- Latest-main checks are Green, so CI is not the blocker.
- Fresh capability discovery on the connected GitHub surface exposes workflow run/job/artifact reads and rerun operations, but no workflow-dispatch operation.
- Rerunning an existing workflow cannot supply the required `workflow_dispatch` input `release_sha=<exact SHA>` and therefore cannot satisfy the packaging contract.
- The runbook explicitly requires `Vercel Release Package` to check out the exact SHA and run read-only preflight before creating `vercel-source-<short-sha>`; bypassing that package would weaken provenance and release safety.
- Therefore this remains an execution-surface blocker rather than a product defect, CI failure, or migration-parity failure.

### Code / database / test / doc changes
- Runtime/schema/tests: no changes; no product defect or failing check justified code changes.
- Production DB: no writes, migrations, restores, or unrelated operations.
- Production web/Vercel: no deployment started.
- Docs: refreshed this rolling handoff with current exact-SHA evidence and the still-active execution blocker.

### Commits
- Starting source SHA: `f103b7f33904c2c46bc1d293879fb43918274f10`.
- Session 49 handoff commit: `docs: record guarded web release blocker recheck`.

### Check / test results at session close
- `f103b7f33904c2c46bc1d293879fb43918274f10`: CI/`validate` completed/success ✅; Game QA/`qa` completed/success ✅.
- Repository release runbook inspected and unchanged in its exact-SHA package requirement.
- Guarded release preflight/package: not run because the required workflow-dispatch capability is still unavailable in the connected GitHub action surface.
- No test was weakened, skipped, deleted, or rewritten.
- Handoff-only commit checks may be pending/absent at close; no runtime/schema behavior changed.

### Newly discovered bugs / risks
- No new gameplay/story P0 or regression discovered.
- Launch-safety DB changes are present in Production while the matching web source is still not proven deployed through the guarded exact-SHA artifact path.
- Repeated use of a generic/unpinned deploy would create unverifiable source provenance and remains prohibited by the runbook.

### Deploy-safety status
**Not deploy-safe to perform a web deployment from the currently available automation surface.** The latest source checks are Green and prior DB parity/rollout evidence remains valid, but the mandatory exact-SHA preflight/package workflow cannot be dispatched here.

No Production web deployment or DB mutation occurred in this session.

### Roadmap impact
No roadmap reprioritization. Launch-safety implementation/database work remains complete; web rollout completion is blocked only on executing the existing guarded exact-SHA packaging path through an authorized workflow-dispatch surface. Do not reopen unrelated product scope while this release gate remains the explicit next priority unless a future checkpoint deliberately changes direction.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا بقي Green، أعد محاولة **exact-SHA guarded web release** فقط عبر authorized GitHub Actions workflow-dispatch capability للـ`Vercel Release Package` مع full latest Green 40-char SHA. إذا نجح preflight وظهر artifact الصحيح، انشر نفس artifact ثم أثبت deployment provenance/stable alias وproduction smoke حسب `docs/operations/RELEASE-RUNBOOK.md`. إذا ظلت dispatch capability غير متاحة، وثّق blocker فقط ولا تستخدم generic/unpinned deploy كبديل.