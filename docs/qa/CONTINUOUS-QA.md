# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 57 delivery started from latest `main` `328b1baee7450ea38a19fe152f909d8bd2ba744a`; exact-SHA `validate` and `qa` were both completed/success.
- Core/full-game 4–10 remains Green with no known P0. Latest established QA evidence includes 140 deterministic simulations plus local Supabase full-game RPC coverage across every player count 4–10, tie reset, elimination, reconnect, next clue, Boss authority, winner, rematch, and AI Players identity.
- Production migration parity remains closed: 17/17 repo migrations reconcile with 20/20 Production ledger records. No Production mutation occurred in Session 57.
- Guarded web release remains externally blocked because the connected GitHub execution surface still exposes no authorized workflow-dispatch action for `Vercel Release Package` with exact `release_sha`. Generic/unpinned deploy remains prohibited.
- Curated story library has 14 cases covering every count 4–10. The human semantic/Egyptian-Arabic quality milestone is now closed against the current library: the existing case-by-case fairness review was re-audited against current source and the one residual player-facing English game-design phrase found (`red herring` in `midnight-menu`) was replaced with natural Egyptian wording without changing clue semantics. The review remains the semantic authority; critic lexical zero-mention signals are not automatically defects.
- Session 57 implementation commits: `7ceff5df990bd550c13dbf4c9014e7bbabf344d2` (`content: naturalize midnight menu discussion prompt`) and `99431603a7a6149f37e36b94126ac4373a3e339c` (`docs: close curated story human quality pass`).
- At session close, CI and Game QA for `99431603...` were queued, so this session makes no new deploy-safe claim.

## Roadmap status
- [x] Core/full-game 4–10 stable with deterministic + local-RPC coverage.
- [x] Identity/story contract + gender-safe wording + caseRole + curated 4–10 fairness foundation.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + authoritative `isBot` snapshot/UI contract + Production DB rollout.
- [x] Release parity/deployment guardrails + Production observability + public-launch abuse perimeter.
- [x] Migration-history parity reconciliation.
- [x] Human semantic/Egyptian-Arabic quality pass for the current 14 curated 4–10 stories.
- [~] Web rollout/live-browser evidence: product/check/DB prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [ ] AI Players discussion-scope decision after guarded web/live evidence, or after a bounded local UX/product design review if release execution remains externally blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 57 — 2026-09-12 — Delivery: curated 4–10 human semantic/Egyptian-Arabic quality closure

### Session type
Delivery. Exactly one coherent objective: close the current-library human semantic/spoken-Egyptian story-quality pass without expanding player counts or adding unrelated gameplay.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `328b1baee7450ea38a19fe152f909d8bd2ba744a`.
- Exact-SHA checks on that SHA: `validate` completed/success; `qa` completed/success.
- Authorized exact-SHA release dispatch was not available, so the handoff's fallback story-quality objective was selected.
- Existing `CURATED-STORY-FAIRNESS-REVIEW.md` already contained a full 14-case semantic matrix and two prior evidence-chain fixes; this session treated that durable evidence as the baseline and checked current source rather than pretending the review did not exist.

### Exact objective
Re-audit the current 14-story 4–10 curated library for spoken Egyptian naturalness, role clarity, plausible ambiguity, clue escalation, and critic zero-mention signals; fix only a real residual quality defect while preserving fairness and record why zero lexical mentions alone are not an automatic rewrite trigger.

### Reproduction / design finding
- The current semantic review already documents all 14 stories case-by-case as fair after prior fixes to `garden-locker` and `midnight-menu`; the critic separately enforces pre-final mafia-isolation and final-mafia reconnection guards.
- A residual spoken-language defect remained in `midnight-menu` round-2 discussion: player-facing copy literally used the English game-design term `red herring`. That is understandable to some players but is not natural Egyptian speech and exposes authoring jargon instead of inviting deduction.
- Replacing it with `موجود بس عشان يشتتكم` preserves exactly the same clue function: distinguish a widespread, non-dispositive trace from evidence that actually narrows a suspect.
- No evidence justified changing mafia assignment, clue timing, motive chains, or adding explicit mentions merely to improve lexical matrix counts. Some innocent roles can remain plausible through shared opportunity/evidence or bios without being named in every clue.

### Code / database / test / doc changes
- Story content: `lib/server-stories/midnight-menu.ts` round-2 discussion prompt naturalized; no clue, role, mafia index, solution, or gameplay behavior changed.
- Semantic QA doc: `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md` refreshed to 2026-09-12, records the spoken-language defect/fix, clarifies zero-mention interpretation, and closes the current 14-case human-quality pass.
- Tests: no test weakened/deleted. Existing story critic/fairness guards remain unchanged and will exercise the content through Game QA.
- Database/Production: none. No DDL/DML/migration/deploy/service operation.

### Commits
- `7ceff5df990bd550c13dbf4c9014e7bbabf344d2` — `content: naturalize midnight menu discussion prompt`.
- `99431603a7a6149f37e36b94126ac4373a3e339c` — `docs: close curated story human quality pass`.
- Session handoff commit: `docs: record curated story quality closure`.

### Check / test results at session close
- Starting SHA `328b1bae...`: `validate` success; `qa` success.
- On `99431603...`, both CI and Game QA had been created and were queued at last inspection. Therefore the new content has not yet earned a Green/deploy-safe claim.
- No failing check was observed during this session.

### Newly discovered bugs / risks
- Fixed: one English game-design term leaked into player-facing Egyptian discussion copy.
- The story critic is intentionally heuristic; automated 9.9/10-style scores cannot prove semantic naturalness. Human review remains necessary after material story changes.
- Lexical zero-mention roles are a review signal, not automatically a fairness defect; mechanically forcing every role into clues would make dialogue less natural and can reduce ambiguity.
- Guarded web release/live-browser evidence remains externally blocked.
- 11–15 remains unsupported absent gameplay/UX evidence.

### Deploy-safety status
No Production change is authorized by this session. Starting state was Green, but checks for the new story/doc commits were still queued at close. Web deployment remains not authorized from the current execution surface until exact-SHA guarded packaging can be dispatched and provenance verified.

### Roadmap impact
Milestone C (Story Quality) is closed for the current 14-case 4–10 library. Future human story review should be event-driven by new/rewritten content or regression evidence, not repeated hourly. The next roadmap decision can move to the already-planned AI Players discussion-scope evidence gate while keeping guarded release as the preferred blocker-clearing path when capability appears.

## الأولوية الدقيقة للجلسة التالية
Resolve CI/Game QA for the latest handoff first. If Green and authorized exact-SHA `Vercel Release Package` dispatch has become available, execute the guarded release/live-smoke objective. If dispatch is still unavailable, perform one bounded **AI Players discussion-scope product/UX design review** using repository truth and existing local gameplay/AI evidence: decide whether bot discussion needs LLM generation at all, define the smallest safe interaction contract and deterministic fallback, identify privacy/cost/latency/failure-mode gates, and record a go/no-go implementation objective without implementing the feature in that same review session.
