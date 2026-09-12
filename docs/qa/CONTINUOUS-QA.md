# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest `main` at Session 48 start: `4ae823e4bbe6fe4fb5672558de115c1b03ee39ef` (`docs: record launch-safety migration rollout`).
- Exact-SHA GitHub workflows on that SHA are Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Session 47 completed the approved Production DB rollout of `20260911204500_public_abuse_perimeter.sql`; post-migration object/ledger verification and migration parity were Green.
- Production web project is Vercel `akher-kheit` (`prj_pSOvdKrKEZhabTtCxp722JpM7FN9`). The currently listed Production deployment is `dpl_So7A51KxPVdmh1eGbRsrB1Uzwagb`, READY and aliased to `akher-kheit.vercel.app`, but its Vercel metadata does not expose a repository commit SHA.
- No new Vercel/web deploy or Production DB write occurred in Session 48.

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
- [~] Web release readiness: DB parity and latest-main checks are Green, but the guarded exact-SHA package/deploy path could not be executed from the connected automation surface in Session 48.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 48 — 2026-09-12 — Exact-SHA web release readiness / deployment gate

### Session type
Delivery/release-readiness session. Exactly one coherent objective: resolve latest checks, then execute the repository-defined exact-SHA web release path only if every guardrail can be satisfied and verified. No feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` was `4ae823e4bbe6fe4fb5672558de115c1b03ee39ef`.
- CI/`validate` and Game QA/`qa` on that exact SHA are both completed/success.
- `docs/operations/RELEASE-RUNBOOK.md` requires an exact 40-character main SHA, Green `validate` + `qa`, reconciled Production migrations, successful read-only preflight, and an explicit deploy-safe statement before packaging/deployment.
- The canonical packaging path is the workflow `.github/workflows/package-vercel-source.yml`, which runs the read-only Production preflight before producing `vercel-source-<short-sha>`.

### Exact objective
Attempt the exact-SHA release readiness/deploy verification objective without bypassing the repository-owned preflight/package invariant. Deploy only if the guarded package can be produced from the exact approved SHA and the resulting Production deployment can be verified and smoked.

### Reproduction / design finding
- Latest-main checks are Green, so CI is not the blocker.
- The connected GitHub surface in this run provides workflow/check reads and file writes, but no workflow-dispatch action. Therefore it cannot start the required `Vercel Release Package` workflow with `release_sha=4ae823e4bbe6fe4fb5672558de115c1b03ee39ef`.
- The connected Vercel surface exposes a generic `deploy_to_vercel` action, but the runbook explicitly forbids rebuilding from a moving/unpinned source and requires the exact guarded artifact. Using the generic deploy action without first producing/verifying that artifact would bypass the release invariant, so it was intentionally not called.
- Current Vercel Production deployment `dpl_So7A51KxPVdmh1eGbRsrB1Uzwagb` is READY and owns the stable aliases, but its returned metadata contains no Git/repository SHA. It therefore cannot be used as evidence that the launch-safety source is already deployed.
- This is an execution-surface blocker, not a product/CI failure. The safe next action is to dispatch the repository `Vercel Release Package` workflow for the exact latest Green SHA through an authorized GitHub Actions write surface, then deploy that exact artifact and verify deployment SHA/smoke.

### Code / database / test / doc changes
- Runtime/schema/tests: no changes; no defect was found that justified changing product code.
- Production DB: no writes, migrations, restores, or unrelated operations.
- Vercel: read-only project/deployment inspection only; no deployment was started.
- Docs: updated this rolling handoff with the exact release blocker and next action.

### Commits
- Starting/latest source SHA: `4ae823e4bbe6fe4fb5672558de115c1b03ee39ef`.
- Session 48 handoff commit: `docs: record exact-SHA web release blocker`.

### Check / test results at session close
- `4ae823e4bbe6fe4fb5672558de115c1b03ee39ef`: CI/`validate` completed/success ✅; Game QA/`qa` completed/success ✅.
- Repository release runbook/workflow contract inspected and unchanged.
- Vercel current Production deployment: READY; stable alias present; exact source SHA not exposed in returned metadata.
- Guarded release preflight/package: not run because the required workflow-dispatch capability is unavailable in the connected GitHub action surface. This is a hard stop under the runbook.
- Handoff-only commit checks may be pending/absent at close; no runtime/schema behavior changed.

### Newly discovered bugs / risks
- No new gameplay/story P0 discovered.
- Production DB now contains the anonymous-churn perimeter while the exact web source using it is not yet proven deployed; the launch-safety web rollout therefore remains incomplete.
- A generic Vercel deployment action is insufficient evidence of exact-SHA provenance in this repository's current release model. Bypassing the guarded package would weaken the release invariant and is prohibited.

### Deploy-safety status
**Not deploy-safe to perform a web deployment from the currently available automation surface.** CI and DB prerequisites are Green, but the required exact-SHA read-only preflight/package step cannot be dispatched here, and the current Vercel deployment does not expose enough provenance to prove it already contains the candidate SHA.

No Production web deployment or DB mutation occurred in this session.

### Roadmap impact
Launch-safety product/database work remains complete; web release completion is blocked only on executing the existing guarded exact-SHA packaging path through an authorized workflow-dispatch surface. Do not reopen product scope or AI Players until this release gate is either completed or explicitly deprioritized at a checkpoint.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا بقي Green، أعد محاولة **exact-SHA guarded web release** فقط: dispatch `Vercel Release Package` للـlatest Green 40-char SHA عبر authorized GitHub Actions write capability؛ لا تستخدم generic/unpinned deploy كبديل. إذا نجح preflight وظهر artifact الصحيح، انشر نفس artifact إلى Vercel ثم أثبت deployment provenance/stable alias وproduction smoke وفق `docs/operations/RELEASE-RUNBOOK.md`. إذا ظلت workflow-dispatch capability غير متاحة، وثّق استمرار blocker ولا تنفذ deploy جانبي.