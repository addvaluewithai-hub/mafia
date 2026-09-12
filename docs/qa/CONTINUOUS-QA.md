# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 60 started from latest `main` `d0543a78a0f04103c34e0f0e5f6a732ee071a440`.
- CI on that SHA was completed/success, but Game QA was completed/failure. The first meaningful failure was the newly added AI discussion cue privacy contract, so no new UX/product scope was started.
- Failure diagnosis: `scripts/qa/ai-discussion-contract.mjs` searched for the raw substring `role:` and therefore falsely matched the allowed public field `caseRole:` in `lib/ai-discussion.ts`. The product helper did not accept or read a private `role` field.
- The QA contract now checks forbidden fields structurally: exact field declarations such as `role:` and actual property reads such as `.role` / `['role']`, while explicitly asserting that public `caseRole` remains allowed. The privacy boundary remains strict for `role`, winner, solution fields, mafia-team fields, secret/team data, etc.; the test was corrected rather than weakened.
- Fix commit: `36470062e247d73aed6efacb881a2792d36df996` (`test: make AI discussion privacy guard structural`). CI and Game QA for this exact SHA were queued at the latest inspection.
- Core/full-game 4–10 remains previously established Green with deterministic simulations + local Supabase RPC E2E coverage for ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity.
- Production migration parity remains closed: 17/17 repo migrations reconcile with 20/20 Production ledger records.
- Guarded web release remains externally blocked because the connected GitHub execution surface exposes no authorized exact-SHA workflow-dispatch action for `Vercel Release Package`. Generic/unpinned deploy remains prohibited.
- Curated story library remains 14 cases covering every count 4–10 with the human semantic/Egyptian-Arabic quality milestone closed.
- Deterministic AI discussion cues remain implemented: alive bots get one short clearly AI-labeled Egyptian-Arabic cue during voting/discussion, derived from an explicit public-only projection and stable across refresh/reconnect inputs. Eliminated bots do not speak. No LLM/provider, persistence, schema, or gameplay-state dependency was added.

## Roadmap status
- [x] Core/full-game 4–10 stable with deterministic + local-RPC coverage.
- [x] Identity/story contract + gender-safe wording + caseRole + curated 4–10 fairness foundation.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + authoritative `isBot` snapshot/UI contract + Production DB rollout.
- [x] Release parity/deployment guardrails + Production observability + public-launch abuse perimeter.
- [x] Migration-history parity reconciliation.
- [x] Human semantic/Egyptian-Arabic quality pass for the current 14 curated 4–10 stories.
- [~] Web rollout/live-browser evidence: guarded exact-SHA package dispatch remains unavailable from the connected execution surface.
- [x] AI Players discussion-scope decision: deterministic public-evidence cues first; no LLM yet.
- [x] Deterministic AI discussion cues vertical slice implemented.
- [~] AI discussion cue QA closure: false-positive privacy regression fixed; exact-SHA CI/Game QA pending.
- [ ] Collect browser/live or structured playtest evidence for deterministic cues before reconsidering LLM discussion.
- [ ] LLM discussion only if evidence shows a concrete quality ceiling worth privacy/cost/latency complexity.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 60 — 2026-09-12 — Delivery: fix AI discussion privacy contract false positive

### Session type
Delivery. Exactly one coherent objective: resolve the first meaningful failing check on latest `main` without weakening the privacy contract or starting new product scope.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `d0543a78a0f04103c34e0f0e5f6a732ee071a440` (`docs: record deterministic AI discussion cues`).
- Exact-SHA CI: completed/success.
- Exact-SHA Game QA: completed/failure.
- Failed step: `AI discussion cue contract`; all prior workflow steps through player-card identity passed, later QA steps were skipped because the job stopped at this failure.

### Exact objective
Fix the AI discussion privacy regression so it distinguishes the allowed public `caseRole` field from an actual private `role` field/read, while preserving strict failure for private-role/solution/team leakage.

### Reproduction / design finding
- CI log assertion: `public cue helper must not accept or read forbidden private field: role:`.
- Root cause was test logic, not product leakage: `helperSource.includes('role:')` matched the suffix of the public declaration `caseRole: string | null`.
- `lib/ai-discussion.ts` accepts only `id`, `nickname`, `caseRole`, `isBot`, `isEliminated`, plus public round index/clue/discussionPrompt. No private role, winner, solution, mafia-team, auth/session, or whole-snapshot object is accepted.
- Correct regression semantics are structural: reject exact forbidden field declarations and explicit property reads, not arbitrary substrings embedded in allowed identifiers.

### Code / database / test / doc changes
- Updated `scripts/qa/ai-discussion-contract.mjs`:
  - positively asserts that `caseRole` is an allowed public field;
  - rejects exact forbidden field declarations using word-boundary regexes;
  - rejects direct/dynamic forbidden property reads (`.role`, `['role']`, etc.);
  - retains deterministic output, alive-bot-only, short/readable output, no visible private-role/solution claims, authoritative `isBot`, and UI-consumption checks.
- No product helper/UI behavior changed.
- Database/Production: none. No migration, DDL, DML, restore, service mutation, or web deploy.

### Commits
- `36470062e247d73aed6efacb881a2792d36df996` — `test: make AI discussion privacy guard structural`
- Session handoff — `docs: record AI discussion QA contract fix`.

### Check / test results at session close
- Starting SHA `d0543a78...`: CI completed/success; Game QA completed/failure at the AI discussion cue contract.
- Fix SHA `36470062...`: CI queued; Game QA queued at the latest inspection.
- Because the exact fix checks are not complete, this session records no new deploy-safe claim.

### Newly discovered bugs / risks
- No product/gameplay bug or hidden-information leak was found; the defect was a false-positive source-text assertion in the new QA contract.
- Source-scanning regressions can produce false positives when checking raw substrings; future privacy/static contracts should prefer syntax-aware or identifier-boundary checks.
- Guarded web release/live-browser evidence remains externally blocked.
- Deterministic cue UX still lacks browser/live or structured playtest evidence; do not infer that template quality is sufficient from static tests alone.

### Deploy-safety status
No Production change is authorized by this session. No Production/web/database mutation occurred. Exact-SHA checks for the fix are pending, so no new deploy-safe status is claimed. Generic/unpinned web deployment remains prohibited.

### Roadmap impact
This session does not expand feature scope. It restores the intended QA gate for the deterministic cue slice while keeping its public-only privacy boundary meaningful. UX evidence remains the next product question only after the latest checks are Green.

## الأولوية الدقيقة للجلسة التالية
Resolve CI/Game QA for the latest handoff/fix first. If a real failure remains, fix the first meaningful failure without weakening tests. If Green and authorized exact-SHA `Vercel Release Package` dispatch has become available, execute the guarded release/live-smoke objective. If dispatch remains unavailable, perform one bounded verification session for deterministic AI discussion cue UX evidence across round change, elimination, refresh/reconnect, and voting; record whether cues are clear, natural, and non-repetitive enough to keep the LLM deferred. Do not add an LLM/provider, Production change, 11–15 support, or unrelated gameplay in that session.
