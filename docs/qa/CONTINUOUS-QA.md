# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 56 checkpoint started from latest `main` `320a8864006aa4f62e74e19b1b1b76fe0ca6740c` (`docs: record production parity audit`).
- Exact-SHA GitHub checks on that SHA are Green: `validate` completed/success and `qa` completed/success.
- Core/full-game 4–10 remains Green with no known gameplay P0. Latest QA artifact proves 140 deterministic state simulations across 4–10 and local Supabase full-game RPC scenarios across every player count 4–10, including tie reset, elimination, reconnect before/after voting and resolution, next clue, Boss authority after elimination, and winner/solution.
- Identity/story contract remains Green. AI Players E2E proves authoritative `isBot` survives case install, voting, and snapshot refresh while Boss remains explicitly human; nickname remains visible identity.
- Curated story system currently has 14 stories covering every player count 4–10. Latest story critic is Green with average score 9.9/10, integrity/fairness Green, zero early-reveal warnings, zero pre-final only-mafia warnings, and zero missing-final-mafia-role warnings. The critic is heuristic and does not replace human semantic/Egyptian-Arabic quality review; some roles receive zero explicit lexical clue mentions, which is a quality-review signal rather than a current enforced failure.
- Production DB contains launch-safety public-abuse perimeter and AI snapshot identity rollout. Production migration parity is closed: all 17 repo migrations reconcile with all 20 Production ledger records, zero missing and zero unexpected.
- Guarded web release remains externally blocked because the connected GitHub execution surface has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- No Production mutation or web deployment occurred in Session 56.

## Roadmap status
- [x] Core/full-game 4–10 stable with deterministic + local-RPC coverage.
- [x] Identity/story contract + gender-safe wording + caseRole + curated 4–10 fairness foundation.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + authoritative `isBot` snapshot/UI contract + Production DB rollout.
- [x] Release parity/deployment guardrails + Production observability + public-launch abuse perimeter.
- [x] Migration-history parity reconciliation; latest audit 17/17 repo migrations against 20/20 Production records.
- [~] Web rollout/live-browser evidence: product/check/DB prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [ ] Human semantic/Egyptian-Arabic quality pass on the curated 4–10 library, using critic output to target clue-role coverage and spoken clarity without weakening fairness.
- [ ] AI Players discussion-scope decision after guarded web/live evidence, or after a bounded local UX/product design review if release execution remains externally blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 56 — 2026-09-12 — Checkpoint: post-parity roadmap audit

### Session type
Bounded Checkpoint/Planning session. No feature implementation and no Production change. Exactly one objective: audit what is actually Green after Production parity closure, identify remaining risk/evidence gaps, and set the next 3–4 substantial milestones in protocol order.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `320a8864006aa4f62e74e19b1b1b76fe0ca6740c`.
- Exact-SHA checks: `validate` completed/success; `qa` completed/success.
- Latest Game QA artifact was inspected rather than relying only on workflow status.

### Exact objective
Audit current Green state, full-game coverage gaps, Production/DB drift blockers, web-release blocker, AI Players live-evidence gap, story/curated 4–10 quality, technical debt, and roadmap ordering; then record 3–4 substantial next objectives and one exact next-session priority.

### Reproduction / design finding
- Core correctness evidence is materially strong: 140 deterministic simulations cover player counts 4–10, and local Supabase E2E covers every 4–10 count through join/install/voting/tie/elimination/reconnect/next-clue/winner. Dedicated Boss-eliminated and same-room-rematch E2Es are Green. There is no evidence of a current P0/deadlock requiring priority inversion.
- AI Players identity is no longer merely a static contract: local E2E verifies authoritative `isBot` through case install, voting, and refresh. What remains is live/browser UX evidence on a guarded deployed SHA, not a known identity correctness bug.
- Story quality is quantitatively healthy but not finished as a human-quality milestone: 14 curated stories cover 4–10, critic average is 9.9, integrity/fairness are Green, and enforced fairness warning totals are zero. However the critic explicitly states its language/fairness analysis is heuristic; its report also exposes some roles with zero explicit lexical clue mentions. That should guide a bounded human semantic/Egyptian-Arabic review rather than be auto-fixed mechanically.
- Production migration drift is no longer a blocker. The remaining release blocker is execution/provenance capability: exact-SHA guarded package dispatch is unavailable. Generic/unpinned deploy remains unsafe and prohibited.
- No evidence currently justifies 11–15 expansion. Doing so before live UX evidence and a human curated-story quality pass would violate roadmap order.

### Code / database / test / doc changes
- Code: none.
- Database/Production: none; no DDL/DML/migration/deploy/service operation.
- Tests: none modified or weakened. Latest QA artifact was audited for actual coverage and story metrics.
- Docs: rolling handoff condensed and refreshed with checkpoint findings, risks, milestones, and exact next priority.

### Commits
- Audited source SHA: `320a8864006aa4f62e74e19b1b1b76fe0ca6740c` — `docs: record production parity audit`.
- Session 56 handoff: `docs: checkpoint post-parity roadmap`.

### Check / test results at session close
- Starting SHA `320a8864006aa4f62e74e19b1b1b76fe0ca6740c`: `validate` success ✅; `qa` success ✅.
- Latest QA artifact: game simulation `ok=true`, 140 simulations, counts 4–10; local Supabase RPC E2E `ok=true`, counts 4–10; Boss-eliminated E2E `ok=true`; rematch E2E `ok=true`; AI Players E2E `ok=true`.
- Story critic: `ok=true`, average 9.9, threshold 8, integrity Green, fairness Green, curated coverage 4–10. Fairness baseline: 14 stories; early reveal warnings 0; pre-final-only-mafia warnings 0; final-mafia-role-missing warnings 0.
- No new gameplay P0 or Production parity drift discovered.

### Newly discovered bugs / risks
- No new correctness bug was discovered.
- Story critic remains intentionally heuristic; a high automated score must not be mistaken for proof of natural spoken Egyptian Arabic or semantic plausibility. Zero-mention roles in the lexical matrix are a targeted review signal.
- Live/browser evidence for the latest AI Players UI remains blocked behind guarded web release provenance.
- Exact-SHA web packaging remains an external capability blocker. Do not bypass it with generic/unpinned deployment.
- 11–15 remains unsupported roadmap expansion absent gameplay/UX evidence.

### Deploy-safety status
Production DB parity and current product checks are Green, but this checkpoint authorizes no Production change. Web deployment remains **not authorized from the current execution surface** until the repository's guarded exact-SHA package workflow can be dispatched and its provenance verified.

### Roadmap impact — next substantial objectives
1. **Curated 4–10 human semantic/Egyptian-Arabic quality pass**: review all 14 current stories against spoken naturalness, role clarity, plausible ambiguity, clue escalation, and critic zero-mention signals; make only evidence-backed story/test changes as one coherent quality slice.
2. **Guarded exact-SHA web release + live smoke/AI UX evidence** when authorized workflow dispatch becomes available: run preflight/package, deploy the exact artifact, prove deployed SHA/stable alias, then execute production smoke without DB mutation.
3. **AI Players discussion-scope decision** after live evidence; if release remains externally blocked, perform a bounded local product/UX design review rather than prematurely implementing LLM discussion.
4. **11–15 evidence gate** only after the above: assess whether gameplay pacing, voting UX, story readability, and curated-role coverage justify expansion; do not implement merely for count coverage.

## الأولوية الدقيقة للجلسة التالية
إذا لم تظهر قبل بداية الجلسة صلاحية authorized exact-SHA `Vercel Release Package` dispatch، نفّذ **curated 4–10 human semantic/Egyptian-Arabic quality pass واحدة كاملة** على الـ14 قصة الحالية: استخدم latest critic/fairness reports لتحديد zero-mention/clarity/escalation risks، راجع النصوص ككلام مصري يُقرأ بصوت عالٍ، أصلح فقط المشاكل الحقيقية مع الحفاظ على plausible ambiguity وعدم كشف المافيا مبكرًا، وحدّث/أضف deterministic story regressions عند الحاجة. إذا أصبحت guarded release dispatch متاحة قبل بدء هذا الهدف، ارجع للـexact-SHA release/live-evidence objective أولًا لأنه blocker سابق جاهز للتنفيذ.