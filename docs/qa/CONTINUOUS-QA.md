# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest `main` at Session 50 start: `1eadccff7e82570fe8ca54eb3f83e89e80498be1` (`docs: record guarded web release blocker recheck`).
- Exact-SHA GitHub workflows on that SHA are Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB already contains `20260911204500_public_abuse_perimeter.sql`; post-migration object/ledger verification and migration parity were Green in the rollout session.
- Guarded web release remains externally blocked: repository policy requires `Vercel Release Package` via `workflow_dispatch` with an exact 40-character `release_sha`; the connected GitHub surface still exposes reads/reruns but no workflow-dispatch action.
- Generic/unpinned Vercel deployment remains prohibited because it would weaken source provenance and bypass the repository release invariant.

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
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 50 — 2026-09-12 — Checkpoint: blocked web release + roadmap audit

### Session type
Checkpoint/planning session. No unrelated product feature implementation.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was `1eadccff7e82570fe8ca54eb3f83e89e80498be1`.
- Fresh Actions inspection shows Game QA run `34678484634` completed/success and CI run `34678484668` completed/success on that exact SHA.
- No P0/full-game failure or regression surfaced before planning.
- The previous handoff required another guarded exact-SHA release attempt only if authorized workflow-dispatch capability became available.

### Exact objective
Perform the protocol-due bounded checkpoint: audit what is actually Green, what remains risky/blocked, whether repeated release-gate retries should continue consuming sessions, and set the next 3–4 substantial milestones with one exact next-session priority.

### Reproduction / design finding
- Core/full-game 4–10, identity/story contracts, curated 4–10, fairness, migration parity, and launch-safety Production DB rollout remain Green according to repository handoff plus fresh latest-SHA checks.
- Fresh connector capability discovery still exposes workflow run/job/artifact reads and rerun operations, but no workflow-dispatch operation. A rerun cannot provide the required `release_sha` input, so it cannot satisfy the release packaging contract.
- This is an external execution-surface blocker, not a gameplay/product defect. Repeating the same blocked release attempt every hour adds no product evidence.
- Production/web drift remains a launch risk: DB launch-safety objects are present while matching web source has not been proven deployed through the guarded artifact path.
- Story/curated coverage is established through 4–10; no new evidence supports expanding to 11–15 yet.
- The next product-confidence gap already identified by the roadmap is AI Players snapshot identity + browser/live UX evidence. It should proceed while the release dispatch blocker remains external, without weakening or bypassing the release gate.

### Code / database / test / doc changes
- Runtime/schema/tests: no changes; checkpoint only.
- Production DB: no writes, migrations, restores, or unrelated operations.
- Production web/Vercel: no deployment started.
- Docs: rolled the handoff forward with checkpoint evidence, risks, milestone order, and next-session priority.

### Commits
- Starting SHA: `1eadccff7e82570fe8ca54eb3f83e89e80498be1`.
- Session 50 handoff commit: `docs: checkpoint blocked web release and next roadmap`.

### Check / test results at session close
- Starting SHA `1eadccff7e82570fe8ca54eb3f83e89e80498be1`: CI/`validate` completed/success ✅; Game QA/`qa` completed/success ✅.
- No failing check was weakened, skipped, deleted, or rewritten.
- Handoff-only commit checks may be pending/absent at close; no runtime/schema behavior changed.

### Newly discovered bugs / risks
- No new gameplay/story P0 discovered.
- Guarded web release remains blocked solely by missing authorized workflow-dispatch capability in the connected execution surface.
- Repeatedly retrying the unchanged external blocker would stall roadmap evidence; bypassing it with generic deploy remains prohibited.
- AI Players still lacks the planned snapshot-identity/browser-live UX evidence needed before deciding whether LLM discussion scope is justified.

### Deploy-safety status
**No new web deploy is authorized from the current execution surface.** Latest source checks and DB parity remain Green, but the mandatory exact-SHA package workflow cannot be dispatched here. No Production web deployment or DB mutation occurred in this checkpoint.

### Roadmap impact — next milestones
1. **AI Players snapshot identity + browser/live UX evidence**: audit current solo/AI state persistence and identity presentation, add deterministic regression coverage for any real gap, and capture browser/live evidence sufficient to decide whether the MVP UX is coherent.
2. **Guarded exact-SHA web rollout when dispatch becomes available**: run repository-owned preflight/package for the latest Green 40-char SHA, deploy the exact artifact, prove provenance/stable alias, then production smoke. Never substitute generic/unpinned deploy.
3. **AI Players discussion-scope decision**: only after snapshot/live evidence, decide whether LLM discussion adds enough gameplay value and define a bounded vertical slice if justified.
4. **Curated/player-count expansion decision**: keep 4–10 as supported evidence; consider 11–15 only after gameplay/UX evidence demonstrates it is warranted.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا بقي Green وworkflow-dispatch ما زال غير متاح، نفّذ vertical slice واحدًا لـ **AI Players snapshot identity + browser/live UX evidence**: ابدأ من repository implementation/tests، أثبت أي gap باختبار deterministic إن أمكن، أصلح نفس الهدف end-to-end، وحدّث handoff بالأدلة. إذا أصبحت authorized `Vercel Release Package` workflow-dispatch capability متاحة قبل بدء scope، يسبق ذلك الهدفَ المنتج: نفّذ guarded exact-SHA release path فقط وفق `docs/operations/RELEASE-RUNBOOK.md`.