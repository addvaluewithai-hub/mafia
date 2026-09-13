# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 72 is a delivery session constrained to the still-failing `Solo AI browser E2E` prerequisite. At session start, latest `main` was `c9830b0f5b3bc2fd734e60a9349245d16453e1b2`. The prerequisite implementation SHA `62e865010d0d29c141122ee88198276eea91172e` had exact-SHA CI `completed/success` and Game QA `completed/failure` specifically in the browser E2E path.

The durable `solo-browser-e2e.json` artifact proves the browser journey reaches a completed innocents win after Solo creation, 1 human + 3 AI, case install, AI discussion, human vote, first elimination, next round, refresh/reconnect, mafia vote seeding, and final vote resolution. The failure is now a strict-locator ambiguity only: `getByText('CASE CLOSED', { exact: true })` resolves to two intentional elements. Current room UI renders `CASE CLOSED` once in the global room-status eyebrow when `room.status === 'finished'` and again inside the finished-result card. The same artifact DOM also shows `الأبرياء كسبوا` and `Browser E2E fixture only.`.

Session 72 fixes only that evidenced acceptance-selector drift. The browser test now explicitly expects the two current `CASE CLOSED` labels and verifies the finished-result occurrence is visible before checking the unique winner copy and deterministic public solution. No gameplay behavior, state transition, timeout, schema, migration, Production path, or downstream acceptance step was removed or weakened.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 72 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `c9830b0f5b3bc2fd734e60a9349245d16453e1b2` (`docs: record session 71 winner UI contract fix`).
- Prerequisite implementation `62e865010d0d29c141122ee88198276eea91172e`:
  - CI run 34738209075: `completed/success`.
  - Game QA run 34738209000: `completed/failure`.
- All Game QA steps before `Solo AI browser E2E` were Green, including TypeScript, Expo doctor, static contracts, full-game state simulations, story critic, clean local Supabase startup, and browser runtime installation.
- Game QA artifact `game-qa-reports` artifact id 10312365439 contained `solo-browser-e2e.json`.
- Browser evidence:
  - `ok: false`.
  - last stage: `mafia-votes-seeded`.
  - every earlier milestone succeeded through refresh/reconnect and final mafia vote seeding.
  - strict-mode failure: exact `CASE CLOSED` resolved to two elements.
  - diagnostics showed a finished room with two `CASE CLOSED` labels, `الأبرياء كسبوا`, the eliminated mafia, `Browser E2E fixture only.`, and the rematch control.
- Current `app/room/[code].tsx` intentionally renders `CASE CLOSED` in two finished-state places: the top room-status eyebrow and the finished-result card.

### Objective
Fix the first newly evidenced browser acceptance failure by disambiguating the finished-state `CASE CLOSED` assertion while preserving the complete full-game browser path and winner contract.

### Reproduction / design finding
The browser journey is completing the gameplay transition successfully. The failure occurs only because Playwright strict mode rejects a text locator that matches two intentional UI elements. This is test-selector drift, not evidence of a gameplay deadlock, failed winner resolution, or missing finished state.

The product contract currently contains both labels intentionally. The acceptance test therefore now asserts there are exactly two visible-context labels for the current finished-state layout, verifies the result-card occurrence via the last matching label, and continues to require the unique winner copy, deterministic public solution, and authoritative final snapshot.

### Changes
- Updated `scripts/qa/solo-browser-e2e.spec.mjs`.
- Replaced the ambiguous bare `CASE CLOSED` visibility assertion with:
  - `toHaveCount(2)` for the two intentional finished-state labels;
  - visibility of the last matching label, which is the finished-result card in the current layout.
- Preserved exact `الأبرياء كسبوا` and `Browser E2E fixture only.` assertions.
- Preserved the final RPC assertions for `room.status === 'finished'` and `room.winner === 'innocents'`.
- Preserved the complete earlier browser path: Solo creation → 1 human + 3 AI → case install → AI discussion → human voting → deterministic vote completion → innocent elimination → next clue → refresh/reconnect → mafia elimination → finished winner UI → authoritative winner snapshot.
- No app runtime, schema, migration, Production database, provider, release, or deployed service was changed.

### Commits
- `575b418caf25435d8808b1f14978605d7309dc29` — disambiguate the finished-state `CASE CLOSED` browser assertion.

### Checks
- Baseline `62e865010...`: CI success; Game QA failure only at the duplicate `CASE CLOSED` strict locator described above.
- Immediately after the implementation commit, no exact-SHA workflow runs had appeared yet for `575b418caf25435d8808b1f14978605d7309dc29` at the first inspection.
- Reinspect exact-SHA checks before the next session begins. This session does **not** claim the browser check is Green or deploy-safe unless those checks subsequently prove it.

### Newly discovered bugs / risks
- The previous winner-copy repair is now proven to reach a fully rendered finished state; the new failure is selector ambiguity caused by intentional duplicate status text.
- Exact-text browser assertions remain sensitive to deliberate presentation changes. When text intentionally repeats, locators must encode the intended occurrence rather than rely on strict uniqueness.
- If Game QA fails after `winner-ui-verified`, use the persisted stage/error/diagnostics to fix only the next first evidenced failure; do not infer downstream correctness prematurely.
- Browser/live Production evidence remains weaker than local evidence until the complete browser suite is Green and an authorized guarded exact-SHA release can run.

### Deploy safety
Not deploy-safe from this session because exact-SHA CI and Game QA for `575b418caf25435d8808b1f14978605d7309dc29` were not yet available at the first post-change inspection. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session remains inside the same full-game/browser-confidence objective. It removes an acceptance-selector false failure at the completed winner screen without changing product semantics. No new gameplay, LLM discussion, 11–15 expansion, or unrelated polish was started.

## Prior handoff
Session 71 aligned the winner assertions with the current finished-state copy but then exposed this duplicate-text strict-locator issue. Session 70 fixed the ambiguous human-vote selector. Session 69 added durable browser milestones and diagnostics. Session 68 corrected Solo room creation to use the canonical hardened helper. Git history contains the full details.

## Exact next-session priority
Resolve exact-SHA CI and Game QA for `575b418caf25435d8808b1f14978605d7309dc29` first. If `Solo AI browser E2E` fails again, download `game-qa-reports`, read `solo-browser-e2e.json`, and fix the first newly evidenced assertion/navigation/product failure only, without weakening coverage or starting new scope. If browser and all downstream Game QA steps are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch remains unavailable, perform one bounded launch-readiness hardening objective driven by combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
