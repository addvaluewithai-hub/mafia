# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 71 is a delivery session constrained to the still-failing `Solo AI browser E2E` prerequisite. At session start, latest `main` was `50ad3ba5e207d7c17a758abfc95915f0b3e7c7ee`. The prerequisite implementation SHA `6268ed29728dea9985c6481e50f559dc0044fbed` had exact-SHA CI `completed/success` and Game QA `completed/failure` specifically in the browser E2E path.

The durable `solo-browser-e2e.json` artifact proved Session 70's vote-selector fix worked end-to-end through human vote submission, first elimination, next-round reveal, refresh/reconnect, mafia vote seeding, and final mafia elimination. The run reached `mafia-votes-seeded`, then failed only because the browser test still asserted stale winner copy (`انتهت القضية` and `الأبرياء كشفوا المافيا.`). The captured DOM already showed a finished case with `CASE CLOSED`, `الأبرياء كسبوا`, the eliminated mafia revealed, the fixture's public solution, and the rematch control. The current room UI source confirms that `room.status === 'finished'` renders exactly `CASE CLOSED`, winner text `الأبرياء كسبوا` for an innocents win, and `room.publicSolution`.

Session 71 fixes only that evidenced acceptance-contract drift. The browser test now asserts the current finished-state UI contract: `CASE CLOSED`, `الأبرياء كسبوا`, and the deterministic fixture solution `Browser E2E fixture only.`. It still verifies the authoritative final snapshot afterward (`status === 'finished'`, `winner === 'innocents'`). No gameplay behavior, state transition, timeout, schema, migration, Production path, or downstream acceptance step was removed or weakened.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 71 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `50ad3ba5e207d7c17a758abfc95915f0b3e7c7ee` (`docs: record session 70 solo vote selector fix`).
- Prerequisite implementation `6268ed29728dea9985c6481e50f559dc0044fbed`:
  - CI run 34735731510: `completed/success`.
  - Game QA run 34735731511: `completed/failure`.
- Game QA artifact `game-qa-reports` artifact id 10310289676 contained `solo-browser-e2e.json`.
- Browser evidence:
  - `ok: false`.
  - last stage: `mafia-votes-seeded`.
  - all earlier milestones succeeded, including `human-vote-target-clicked`, `human-vote-submitted`, first elimination, round two, and refresh/reconnect.
  - failure: `getByText('انتهت القضية', { exact: true })` was not found within 5 seconds.
  - diagnostics showed `CASE CLOSED`, `الأبرياء كسبوا`, the mafia revealed in prison, `Browser E2E fixture only.`, and the rematch button.
- Current `app/room/[code].tsx` finished-state UI renders `CASE CLOSED`, then `المافيا كسبت` or `الأبرياء كسبوا`, followed by `room.publicSolution`.

### Objective
Fix the first newly evidenced browser acceptance failure by aligning the winner assertions with the product's current finished-state UI contract while preserving authoritative winner-state verification and all earlier full-game browser coverage.

### Reproduction / design finding
The state machine had already finished successfully: after the final `احسم التصويت`, the rendered DOM showed the innocents-win screen and the eliminated mafia. The test failed because it expected obsolete copy that is not rendered by the current product. This is test-contract drift, not evidence of a winner-resolution deadlock or missing finished state.

The deterministic fixture sets `solution: 'Browser E2E fixture only.'`, and the product renders `room.publicSolution` in the finished card. Therefore the strongest current acceptance boundary is to assert the finished eyebrow, winner label, and exact fixture solution, then continue to the server-authoritative snapshot assertions.

### Changes
- Updated `scripts/qa/solo-browser-e2e.spec.mjs`.
- Replaced stale winner-copy assertions with:
  - exact `CASE CLOSED` visibility;
  - exact `الأبرياء كسبوا` visibility;
  - exact deterministic public solution `Browser E2E fixture only.` visibility.
- Preserved `winner-ui-verified` milestone and final RPC assertions for `room.status === 'finished'` and `room.winner === 'innocents'`.
- Preserved the complete earlier browser path: Solo creation → 1 human + 3 AI → case install → AI discussion → human voting → deterministic vote completion → innocent elimination → next clue → refresh/reconnect → mafia elimination → finished winner UI → authoritative winner snapshot.
- No app runtime, schema, migration, Production database, provider, release, or deployed service was changed.

### Commits
- `62e865010d0d29c141122ee88198276eea91172e` — assert the current Solo finished-state winner UI contract.

### Checks
- Baseline `6268ed297...`: CI success; Game QA failure at the stale winner-copy assertion described above.
- Post-change exact-SHA checks for `62e865010d0d29c141122ee88198276eea91172e` at final inspection:
  - CI run 34738209075: `in_progress`.
  - Game QA run 34738209000: `queued`.
- Therefore this session does **not** claim the browser check is Green or deploy-safe.

### Newly discovered bugs / risks
- The previous selector repair is now proven to work through vote submission and the rest of the game path up to finished state.
- The new failure was stale acceptance copy, not a product gameplay defect. Future product copy changes can still cause exact-text browser drift; exact assertions are retained here because they intentionally verify the current winner presentation contract and deterministic public solution.
- If Game QA fails after `winner-ui-verified`, use the persisted stage/error/diagnostics to fix only the next first evidenced failure; do not infer downstream correctness prematurely.
- Browser/live Production evidence remains weaker than local evidence until the complete browser suite is Green and an authorized guarded exact-SHA release can run.

### Deploy safety
Not deploy-safe from this session because exact-SHA CI and Game QA for `62e865010d0d29c141122ee88198276eea91172e` were still pending at final inspection. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session remains inside the same full-game/browser-confidence objective. It advances the browser E2E from voting/reconnect coverage through a correctly asserted finished-state UI without changing product semantics. No new gameplay, LLM discussion, 11–15 expansion, or unrelated polish was started.

## Prior handoff
Session 70 fixed the ambiguous human-vote selector after durable evidence proved the test was clicking a repeated AI nickname outside the voting card. Session 69 added durable browser milestones and diagnostics. Session 68 corrected Solo room creation to use the canonical hardened helper. Git history contains the full details.

## Exact next-session priority
Resolve exact-SHA CI and Game QA for `62e865010d0d29c141122ee88198276eea91172e` first. If `Solo AI browser E2E` fails again, download `game-qa-reports`, read `solo-browser-e2e.json`, and fix the first newly evidenced assertion/navigation/product failure only, without weakening coverage or starting new scope. If browser and all downstream Game QA steps are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch remains unavailable, perform one bounded launch-readiness hardening objective driven by combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
