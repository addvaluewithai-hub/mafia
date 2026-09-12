# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 65 is a delivery session constrained to the first meaningful prerequisite failure from Session 64. The implementation SHA `b61332119e680a5fbcb1de5877860df44b3cc88f` finished with CI Green but Game QA failed specifically at the new `Solo AI browser E2E` step; all static contracts, TypeScript, Expo doctor, full-game simulations, story critic, clean local Supabase startup, and browser runtime installation before that step were Green. The downstream local RPC E2E steps were skipped because the browser step failed.

The browser harness has now been changed to build the same Expo Router server-output web application first with `expo export --platform web`, then serve that exported application with the repository's production-style `expo serve` command before Playwright runs. This removes the dev-server/Metro startup path from the browser acceptance test while keeping the existing bounded health probe and 90-second Playwright cap. No product gameplay code or assertions were weakened.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 65 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `7da2c75d4c00789b3ff7ed10388db10a9c81a4f7` (`docs: record session 64 browser E2E slice`).
- Required prerequisite implementation SHA `b61332119e680a5fbcb1de5877860df44b3cc88f` resolved as:
  - CI run 34720594206: `completed/success`.
  - Game QA run 34720594230: `completed/failure`.
- The Game QA job shows every step through `Install browser QA runtime` Green, then `Solo AI browser E2E` failed; subsequent schema/RPC E2E steps were skipped.
- The uploaded QA reports still show deterministic full-game simulations Green (`140` simulations) and story critic Green (`9.9/10`, 4–10 coverage, no enforced fairness errors).

### Objective
Fix the first meaningful failing check from the new local Solo browser-E2E harness without weakening the browser journey or starting new launch-readiness scope.

### Reproduction / design finding
The failing boundary is the new browser orchestration step rather than an already-established gameplay/static contract. The previous harness launched `expo start --web`, i.e. the development/Metro server, inside CI and then probed `/solo` before Playwright. The exact job evidence available from GitHub identifies the failing step but does not expose the underlying Playwright/dev-server log through the connected read surface, so this session does not claim an unverified selector or gameplay root cause.

The harness itself had a deterministic reliability weakness: a production acceptance browser test depended on a development server boot path. The repository already declares `web: expo serve` and `web.output: server`; building with `expo export --platform web` and serving that output exercises a stable production-style artifact and removes Metro/dev-server readiness as an avoidable source of CI failure.

### Changes
- Updated `.github/workflows/game-qa.yml` only.
  - Replaced `CI=1 npx expo start --web --port 8081` with an explicit `npx expo export --platform web` build followed by `CI=1 npx expo serve --port 8081`.
  - Kept the same local Supabase environment injected into the Expo build/server.
  - Kept the bounded `/solo` health probe and 90-second Playwright outer timeout.
  - Kept the full Solo browser assertions unchanged; no test was skipped, deleted, relaxed, or rewritten to mask a product failure.
- No schema, migration, product gameplay code, Production database, provider, or deployed service was changed.

### Commits
- `da874464a608bc92e0a2ccc786aebaf6c305bfd4` — serve exported web app for browser E2E.

### Checks
- Baseline implementation SHA `b613321...`: CI success; Game QA failure specifically at `Solo AI browser E2E`.
- At the first post-commit inspection for `da874464...`, GitHub had not created exact-SHA workflow runs yet (`total_count = 0`). Therefore the fix is pending CI/Game QA evidence and is **not** deploy-safe from this session.

### Newly discovered bugs / risks
- No new gameplay P0/P1 was proven by the failed run; the failure boundary is the newly introduced browser QA step.
- Because the connected GitHub read surface does not expose the detailed browser-step log, the change deliberately addresses the observable harness reliability weakness rather than inventing an unverified selector/application diagnosis.
- If the production-style exported server still fails, the next session must inspect the new exact-SHA failure evidence and fix that first meaningful failure only; do not bypass or weaken the browser assertions.
- Browser/live Production evidence remains weaker than local evidence until an authorized guarded exact-SHA release can be run.

### Deploy safety
Not deploy-safe from this session yet because exact-SHA CI/Game QA for `da874464a608bc92e0a2ccc786aebaf6c305bfd4` have not reported. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session stays inside the Session 64 browser-coverage milestone and does not start a second objective. If the exported-app browser E2E becomes Green together with the downstream RPC suite, the next remaining major evidence gap returns to guarded live/deployed smoke and launch-readiness rather than new AI architecture. LLM discussion and 11–15 expansion remain deferred.

## Session 64 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `bb38b59145594896f9ab7acd0759daf36ec2b46c` (`docs: record session 63 checkpoint`).
- Exact-SHA Game QA run 34717342390: `completed/success`.
- Exact-SHA CI run 34717342392: `completed/success`.
- Guarded exact-SHA release dispatch remained unavailable from the connected GitHub action surface, so the checkpoint fallback objective applied.

### Objective
Add one substantial local browser-E2E vertical slice for the highest-value UI journey not already proven by static/RPC tests: Solo AI discussion and round change → elimination → refresh/reconnect → voting → winner.

### Reproduction / design finding
The previous suite proved server/state contracts but never launched the real React Native Web UI in a browser. That left a genuine confidence gap around rendered controls, browser auth persistence, AI discussion visibility, UI refresh after server transitions, and winner rendering.

The first browser harness attempt also exposed a QA-infrastructure defect: the Expo health probe used `curl` without a request timeout, so a partially accepting dev server could leave the Game QA step hanging instead of producing a bounded failure. The harness was tightened rather than weakening product assertions: each health probe now has a 3-second cap and the Playwright command has a 90-second outer cap.

### Changes
- Added `scripts/qa/solo-browser-e2e.spec.mjs`.
  - Opens `/solo` in Chromium and creates the room through the actual UI.
  - Uses browser-persisted anonymous auth to call Boss-only `install_case` against local Supabase.
  - Confirms 4-player Solo composition with 3 authoritative `isBot` players.
  - Verifies `كلام لاعيبة الـAI` renders during gameplay.
  - Performs the Boss human vote through the rendered player cards and `ثبّت صوتي` control.
  - Uses deterministic local-only vote seeding to force one innocent elimination, verifies `في السجن`, advances to `الدليل 2`, reloads the browser, and verifies the round/UI survive refresh.
  - Forces the final mafia elimination and verifies `انتهت القضية` / `الأبرياء كشفوا المافيا.` plus server `winner = innocents`.
- Updated `.github/workflows/game-qa.yml` to install Playwright/Chromium, start Expo web against clean local Supabase, and run the browser test before the remaining schema/RPC E2E checks.
- No product gameplay code, schema, migration, Production database, provider, or deployed service was changed.

### Commits
- `bbc05b421a8c1942131dc2aa50a53dd1fa78d250` — add Solo browser full-game E2E.
- `cace7973fd9c73f22505cb0c432f0dc4a413e31f` — wire browser E2E into Game QA.
- `b61332119e680a5fbcb1de5877860df44b3cc88f` — bound browser harness startup/runtime.

### Checks
- Before implementation, checkpoint SHA `bb38b591...`: CI success; Game QA success.
- Final result later resolved in Session 65: CI success; Game QA failed specifically at `Solo AI browser E2E`.

### Newly discovered bugs / risks
- Browser QA adds material confidence but uses local-only direct vote seeding to make elimination/winner transitions deterministic. Keep the existing real `cast_ai_votes` E2E as the authority for AI voting behavior.
- Browser/live Production evidence remains weaker than local browser + local RPC evidence until an authorized guarded exact-SHA release can be run.

### Deploy safety
Session 64 itself did not make a deploy-safe claim. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
Session 64 introduced the local-browser coverage slice; Session 65 is fixing its first exact-SHA failure before any next scope begins.

## Exact next-session priority
Resolve exact-SHA CI/Game QA for `da874464a608bc92e0a2ccc786aebaf6c305bfd4` first. If `Solo AI browser E2E` or another check fails, inspect and fix the first meaningful failure without weakening coverage and do not start new scope. If both are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch is still unavailable, perform one bounded launch-readiness hardening objective driven by the combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
