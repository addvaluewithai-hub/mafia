# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 61 started from latest `main` `4a7533de509eaf809cb7d239efcd18e9a68bae4f` (`docs: record AI discussion QA contract fix`).
- CI on that SHA was completed/success, but Game QA was completed/failure at `AI discussion cue contract`; no new UX/product scope was started.
- Root cause: the previous structural guard still treated the local function parameter `role` in `roleLabel(role: string | null)` as though it were a private input field. This was another test false positive, not a product privacy leak.
- The QA contract now inspects the declared fields of `PublicAiDiscussionPlayer`, `PublicAiDiscussionRound`, and `AiDiscussionInput` directly and requires exact public-only field sets. It separately rejects forbidden property reads such as `.role`, `['role']`, solution/team/winner/secret fields. Local variable/parameter names no longer create false positives.
- Fix commit: `043b590a59d1e0fe6d56c7bd384dbe3f6bf71448` (`test: scope AI cue privacy guard to public input fields`). At latest inspection both CI and Game QA were in progress on this exact SHA.
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
- [~] AI discussion cue QA closure: second false-positive privacy regression fixed; exact-SHA CI/Game QA pending.
- [ ] Collect browser/live or structured playtest evidence for deterministic cues before reconsidering LLM discussion.
- [ ] LLM discussion only if evidence shows a concrete quality ceiling worth privacy/cost/latency complexity.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 61 — 2026-09-12 — Delivery: scope AI discussion privacy guard to actual public input fields

### Session type
Delivery. Exactly one coherent objective: resolve the first meaningful failing check on latest `main` without weakening the public-only privacy contract or starting new product scope.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `4a7533de509eaf809cb7d239efcd18e9a68bae4f`.
- Exact-SHA CI: completed/success.
- Exact-SHA Game QA: completed/failure.
- Failed step: `AI discussion cue contract`; prior contract steps passed and later Game QA steps were skipped after the failure.

### Exact objective
Correct the AI discussion privacy regression so it validates the actual public input schema and forbidden private property reads, while allowing harmless local variables/parameters named `role` that are derived only from public `caseRole`.

### Reproduction / design finding
- CI assertion: `public cue helper must not declare forbidden private field: role`.
- `lib/ai-discussion.ts` does not accept a private `role` field. The match came from `roleLabel(role: string | null)`, where `role` is only a local parameter receiving public `caseRole`.
- The prior regex therefore still conflated local identifier names with object/type fields.
- Correct contract boundary is the declared shape of the public projection plus explicit forbidden property reads.

### Code / database / test / doc changes
- Updated `scripts/qa/ai-discussion-contract.mjs`:
  - extracts declared fields from `PublicAiDiscussionPlayer`, `PublicAiDiscussionRound`, and `AiDiscussionInput`;
  - requires exact public-only field sets for all three types;
  - retains forbidden direct/dynamic property-read checks for private role, winner, solution, mafia-character, secret, and team data;
  - retains determinism, alive-bot-only, short/readable output, visible private-role/solution leakage checks, authoritative `isBot`, and UI-consumption checks.
- No product helper/UI behavior changed.
- Database/Production: none. No migration, DDL, DML, restore, service mutation, or web deploy.

### Commits
- `043b590a59d1e0fe6d56c7bd384dbe3f6bf71448` — `test: scope AI cue privacy guard to public input fields`
- Session handoff — `docs: record AI discussion privacy guard scope fix`.

### Check / test results at session close
- Starting SHA `4a7533de...`: CI completed/success; Game QA completed/failure at the AI discussion cue contract.
- Fix SHA `043b590a...`: CI in_progress; Game QA in_progress at latest inspection.
- Because the exact fix checks are not complete, this session records no new deploy-safe claim.

### Newly discovered bugs / risks
- No product/gameplay bug or hidden-information leak was found; the defect was a second false-positive source-scanning assertion.
- Privacy/static regressions should validate semantic boundaries (declared projection fields/property access) rather than arbitrary identifier names.
- Guarded web release/live-browser evidence remains externally blocked.
- Deterministic cue UX still lacks browser/live or structured playtest evidence; static tests do not prove conversational quality.

### Deploy-safety status
No Production change is authorized by this session. No Production/web/database mutation occurred. Exact-SHA checks for the fix are pending, so no new deploy-safe status is claimed. Generic/unpinned web deployment remains prohibited.

### Roadmap impact
No feature scope expansion. This keeps the deterministic-cue privacy gate strict while removing a false-positive class that could repeatedly block Game QA for harmless local identifiers.

## الأولوية الدقيقة للجلسة التالية
Resolve CI/Game QA for the latest handoff/fix first. If a real failure remains, fix the first meaningful failure without weakening tests. If Green and authorized exact-SHA `Vercel Release Package` dispatch has become available, execute the guarded release/live-smoke objective. If dispatch remains unavailable, perform one bounded verification session for deterministic AI discussion cue UX evidence across round change, elimination, refresh/reconnect, and voting; record whether cues are clear, natural, and non-repetitive enough to keep the LLM deferred. Do not add an LLM/provider, Production change, 11–15 support, or unrelated gameplay in that session.
