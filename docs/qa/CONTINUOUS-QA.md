# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 59 started from latest `main` `ef9885d8e59a9109b423f8475558d1d9e4063025`; exact-SHA CI and Game QA were both completed/success before implementation.
- Core/full-game 4–10 remains established Green with no known P0: deterministic simulations + local Supabase full-game RPC coverage include ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity.
- Production migration parity remains closed: 17/17 repo migrations reconcile with 20/20 Production ledger records.
- Guarded web release remains externally blocked because the connected GitHub execution surface exposes no authorized workflow-dispatch action for `Vercel Release Package` with exact `release_sha`. Generic/unpinned deploy remains prohibited.
- Curated story library has 14 cases covering every count 4–10; human semantic/Egyptian-Arabic quality milestone is closed.
- Deterministic AI discussion cues are now implemented: alive bots get one short clearly AI-labeled Egyptian-Arabic cue during voting/discussion, derived from an explicit public-only projection and stable across refresh/reconnect inputs. Eliminated bots do not speak. No LLM/provider, persistence, schema, or gameplay-state dependency was added.
- Checks on implementation head `d59b0fa3b30ad77bd4fb1730a16b503bab0b47f1` were still in progress at session close; do not infer deploy-safe status until they resolve.

## Roadmap status
- [x] Core/full-game 4–10 stable with deterministic + local-RPC coverage.
- [x] Identity/story contract + gender-safe wording + caseRole + curated 4–10 fairness foundation.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + authoritative `isBot` snapshot/UI contract + Production DB rollout.
- [x] Release parity/deployment guardrails + Production observability + public-launch abuse perimeter.
- [x] Migration-history parity reconciliation.
- [x] Human semantic/Egyptian-Arabic quality pass for the current 14 curated 4–10 stories.
- [~] Web rollout/live-browser evidence: prerequisites were Green before this slice, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [x] AI Players discussion-scope decision: deterministic public-evidence cues first; no LLM yet.
- [x] Deterministic AI discussion cues vertical slice implemented; latest checks pending.
- [ ] Collect browser/live or structured playtest evidence for the deterministic cues before reconsidering LLM discussion.
- [ ] LLM discussion only if evidence shows a concrete quality ceiling worth privacy/cost/latency complexity.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 59 — 2026-09-12 — Delivery: deterministic AI discussion cues

### Session type
Delivery. Exactly one coherent objective: implement deterministic, public-evidence-only discussion cues for AI Players end-to-end in room UX and regression coverage. No unrelated feature, LLM/provider, schema change, Production change, or player-count expansion.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `ef9885d8e59a9109b423f8475558d1d9e4063025` (`docs: decide AI discussion scope`).
- Exact-SHA Actions on the starting SHA: CI completed/success; Game QA completed/success.
- Handoff objective selected because guarded exact-SHA `Vercel Release Package` dispatch remains unavailable from this GitHub execution surface.
- Existing room UX had authoritative `player.isBot` markers and server-side AI voting but no visible bot contribution during the discussion window.

### Exact objective
Add one short Egyptian-Arabic discussion cue per alive bot for the current revealed round, clearly label it as AI, derive it strictly from public fields, keep identical inputs deterministic across refresh/reconnect, suppress eliminated bots, and add automated contract coverage to Game QA.

### Reproduction / design finding
- No database persistence is required for the first slice. Refresh/reconnect can reproduce identical text from stable public inputs, avoiding network calls, duplicate cost, stale generated content, and schema/state coupling.
- The safe information boundary is enforced structurally: the helper accepts only player id/nickname/caseRole/isBot/isEliminated plus current round index/clue/discussionPrompt. It does not accept `me.role`, winner, public solution, hidden solution, unrevealed clues, mafia-team membership, auth/session data, or arbitrary snapshot objects.
- Deterministic selection uses stable hashing of the allowlisted public inputs and a small set of uncertainty-aware Egyptian templates. The visible cue does not affect voting, phase progression, role assignment, winner logic, or any authoritative gameplay transition.
- UI only renders the cue surface in the active voting/discussion phase and only when at least one alive bot cue exists. Each line shows the bot nickname and an explicit `AI` label.

### Code / database / test / doc changes
- Added `lib/ai-discussion.ts` with typed public-only DTOs, deterministic stable selection, and alive-bot filtering.
- Updated `app/room/[code].tsx` to build an explicit allowlisted projection from the room snapshot and render `كلام لاعيبة الـAI` beside the discussion timer. No whole snapshot or private player role is passed to the helper.
- Added `scripts/qa/ai-discussion-contract.mjs` covering deterministic refresh/reconnect output, one cue per alive bot, eliminated-bot suppression, short/readable output, absence of private-role/solution claims, forbidden-field source boundary, and UI consumption/labeling.
- Added the AI discussion contract to `.github/workflows/game-qa.yml` using Node 22 type stripping to execute the real TypeScript helper.
- Database/Production: none. No migration, DDL, DML, restore, service mutation, or web deploy.

### Commits
- `8bbce5c5037c2845764c11bdeacc0a01bfa3f4ab` — `feat: add deterministic AI discussion cues`
- `e651806157a50897322689cbbba3042d281192ca` — `test: cover deterministic AI discussion cues`
- `aea5ca6c1cb2f45e9f81a580eedf7a7c9becd626` — `feat: show deterministic AI discussion cues`
- `d59b0fa3b30ad77bd4fb1730a16b503bab0b47f1` — `test: run AI discussion contract in Game QA`
- Session handoff: `docs: record deterministic AI discussion cues`.

### Check / test results at session close
- Starting SHA `ef9885d8...`: CI completed/success; Game QA completed/success.
- On implementation head `d59b0fa3...`: CI `in_progress`; Game QA `in_progress` at the latest inspection.
- Earlier intermediate implementation SHA `aea5ca6...`: CI and Game QA had started and were still in progress when superseded by the workflow-contract commit.
- Because the latest checks are not yet complete, this session records no new deploy-safe claim.

### Newly discovered bugs / risks
- No new gameplay correctness bug was discovered during implementation.
- Template-based cues are intentionally modest and may become repetitive in real solo play; that is now a UX-evidence question rather than a reason to introduce an LLM preemptively.
- If future code broadens helper inputs to a whole snapshot or private role/team data, it could create hidden-information leakage; the new contract is intended to fail that regression.
- Guarded web release/live-browser evidence remains externally blocked.
- 11–15 remains unsupported absent gameplay/UX evidence.

### Deploy-safety status
No Production change is authorized by this session. No Production/web/database mutation occurred. Latest implementation checks are still running, so the new slice is **not yet deploy-safe**. Generic/unpinned web deployment remains prohibited while exact-SHA guarded packaging cannot be dispatched.

### Roadmap impact
The previously identified AI social-presence gap now has a bounded implementation without new provider or database complexity. The next product question is evidence, not more feature scope: verify the cue UX in browser/live or structured playtesting, and only reconsider LLM generation if deterministic cues demonstrably harm clarity or engagement.

## الأولوية الدقيقة للجلسة التالية
Resolve CI/Game QA for the latest handoff/implementation first. If any real product failure exists, fix the first meaningful failure without weakening tests. If Green and authorized exact-SHA `Vercel Release Package` dispatch has become available, execute the guarded release/live-smoke objective. If dispatch remains unavailable, perform one bounded verification session for **deterministic AI discussion cue UX evidence**: inspect actual room behavior across round change, elimination, refresh/reconnect, and voting; record whether cues are clear/natural/non-repetitive enough to keep the LLM deferred. Do not add an LLM/provider, Production change, 11–15 support, or unrelated gameplay in that session.
