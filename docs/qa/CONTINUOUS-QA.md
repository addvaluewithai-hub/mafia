# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 62 started from latest `main` `23cee857d33805cc827db6178ac5ac52eb031765` (`docs: record AI discussion privacy guard scope fix`).
- Exact-SHA CI and Game QA on that starting SHA were both completed/success, so the prior AI discussion QA closure is Green and there was no failing check or P0 blocking the planned UX verification.
- Guarded web release remains externally blocked because the connected GitHub execution surface exposes no authorized exact-SHA workflow-dispatch action for `Vercel Release Package`. Generic/unpinned deploy remains prohibited.
- Bounded AI-cue UX verification found one concrete quality defect in the current Solo surface: three alive Bots independently chose from four templates, so multiple Bots could repeat the same discussion style in the same round even though refresh/reconnect determinism and privacy were correct.
- The deterministic cue helper now assigns stable Bot ranks by `player.id` and rotates those ranks by `roundIndex`. For the supported Solo surface (1 human + 3 AI), all three alive Bots get distinct cue styles in a round, each Bot changes style on the next round, and the same Bot keeps the same cue if snapshot player order changes during refresh/reconnect.
- The regression now verifies: three alive Bot cues; no same-round duplicate cue in Solo; refresh/reconnect determinism even after player-array reorder; round-to-round style rotation; eliminated Bot silence; short/readable visible text; public-only privacy boundary; and UI gating to voting/discussion phase.
- Core/full-game 4–10 remains previously established Green with deterministic simulations + local Supabase RPC E2E coverage for ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting.
- Production migration parity remains closed: 17/17 repo migrations reconcile with 20/20 Production ledger records.
- Curated story library remains 14 cases covering every count 4–10 with the human semantic/Egyptian-Arabic quality milestone closed.
- No LLM/provider, persistence, schema, or gameplay-state dependency was added. LLM discussion remains deferred pending real browser/live or structured playtest evidence that deterministic cues hit a concrete quality ceiling.

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
- [x] AI discussion cue QA privacy closure.
- [~] Deterministic cue UX verification: structured verification + same-round variety fix implemented; exact-SHA checks pending at session close.
- [ ] Collect browser/live playtest evidence before reconsidering LLM discussion.
- [ ] LLM discussion only if evidence shows a concrete quality ceiling worth privacy/cost/latency complexity.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 62 — 2026-09-12 — Delivery: deterministic AI discussion UX verification and variety closure

### Session type
Delivery. Exactly one coherent objective: perform the bounded deterministic AI discussion cue UX verification requested by the handoff across round change, elimination, refresh/reconnect, and voting; fix only defects found inside that same cue-quality objective.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `23cee857d33805cc827db6178ac5ac52eb031765`.
- Exact-SHA CI: completed/success.
- Exact-SHA Game QA: completed/success.
- `app/solo.tsx` defines the current supported Solo playtest as one human + exactly three AI players in a four-player room.
- `app/room/[code].tsx` derives cue inputs only from public snapshot fields and displays cues only while `votePhaseOpen` is true.
- Existing `scripts/qa/ai-players-e2e.mjs` already proves authoritative AI identity survives case install, voting, and snapshot refresh, and AI voting cannot deadlock resolution.

### Exact objective
Verify whether deterministic AI discussion cues are clear, natural, stable, alive-only, voting-phase scoped, and sufficiently non-repetitive across the supported three-Bot Solo flow to keep the LLM deferred; close any bounded deterministic-quality defect discovered by that verification.

### Reproduction / design finding
- Privacy, alive-only filtering, refresh/reconnect determinism, and voting-phase UI placement were already structurally sound.
- Quality defect: each Bot independently hashed into one of four templates. Nothing prevented two or all three Solo Bots from selecting the same template in the same round, creating a robotic chorus despite otherwise distinct identities.
- The UX does not need an LLM to solve this. A deterministic stable-rank rotation can guarantee diversity for the exact supported three-Bot Solo surface without network, persistence, secret context, cost, or latency.
- Naturalness review of the four short Egyptian-Arabic templates remains acceptable for this MVP; one phrase was tightened from `خصوصًا دور ...` to the more spoken `خصوصًا في دور ...`.

### Code / database / test / doc changes
- `lib/ai-discussion.ts`:
  - removed independent per-Bot hash selection;
  - filters alive Bots, derives a stable rank from sorted Bot IDs, and rotates template choice by `roundIndex`;
  - preserves original display order while making cue identity stable even if snapshot player ordering changes;
  - guarantees the current three-Bot Solo surface uses three different templates per round and rotates each Bot to another style next round;
  - keeps all inputs public-only and keeps eliminated Bots silent.
- `scripts/qa/ai-discussion-contract.mjs` now verifies:
  - three alive Bot cues in Solo;
  - same-round cue diversity;
  - exact refresh/reconnect determinism;
  - determinism under reordered snapshot players;
  - round-to-round style change for every Bot;
  - immediate eliminated-Bot silence;
  - short/readable output and no private-role/solution claims;
  - exact public input schemas and forbidden private property reads;
  - AI cue UI remains gated by `votePhaseOpen`.
- Database/Production: none. No migration, DDL, DML, restore, service mutation, LLM/provider, or web deploy.

### Commits
- `007c5445d9dd4e790216d7ecb246c3c5e32e4711` — `fix: keep solo AI discussion cues varied by round`
- `2d32a4a4c45d0c363bdff25f937f4d8a48bc9fbe` — `test: verify AI cue UX across rounds and elimination`
- Session handoff — `docs: record AI discussion UX verification`.

### Check / test results at session close
- Starting SHA `23cee857...`: CI completed/success; Game QA completed/success.
- Implementation SHA `2d32a4a4...`: CI and Game QA were queued at first post-change inspection.
- Because exact implementation checks were not yet complete when this handoff was written, this session records no new deploy-safe claim.

### Newly discovered bugs / risks
- Fixed: same-round repeated AI discussion style could make the three-Bot Solo experience feel robotic.
- The four-template pool is intentionally scoped to the current three-Bot Solo MVP. It is not evidence that larger AI populations would remain sufficiently varied; do not generalize this to 11–15 or arbitrary Bot counts.
- Static/structured verification still does not equal live conversational playtest evidence. Browser/live evidence remains unavailable through the blocked guarded release path.
- Deterministic cues remain intentionally shallow: they surface public evidence and prompt discussion but do not simulate deep multi-turn reasoning. That is acceptable until evidence proves a concrete UX ceiling.

### Deploy-safety status
No Production change is authorized by this session. No Production/web/database mutation occurred. Exact-SHA checks for the implementation are pending, so no new deploy-safe status is claimed. Generic/unpinned web deployment remains prohibited.

### Roadmap impact
The deterministic approach remains the preferred MVP path. The discovered repetition problem was solvable locally without adding LLM privacy/cost/latency/failure complexity, strengthening the decision to keep LLM discussion deferred until actual playtest evidence justifies it.

## الأولوية الدقيقة للجلسة التالية
Resolve exact-SHA CI/Game QA for the latest handoff/implementation first. If a real failure appears, fix the first meaningful failure without weakening tests. If Green and authorized exact-SHA `Vercel Release Package` dispatch becomes available, execute the guarded release/live-smoke objective. If dispatch remains unavailable, perform one bounded product/QA checkpoint: audit the now-stable deterministic AI Players milestone, current full-game/browser evidence gap, release blocker, technical debt, and the next 3–4 substantial objectives before starting another feature. Do not add an LLM/provider, Production change, 11–15 support, or unrelated gameplay during that checkpoint.
