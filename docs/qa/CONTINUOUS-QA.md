# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 66 is a delivery session constrained to the first meaningful prerequisite failure from Session 65. At session start, `main` was `15e0d3da716fad09ac2ea47badb869818ef195bf`: CI run 34723045893 was `completed/success`, while Game QA run 34723045894 was `completed/failure` specifically at `Solo AI browser E2E`. Every preceding step was Green: dependencies, TypeScript, Expo doctor, all static identity/story/AI contracts, full-game state simulations, story critic, clean local Supabase startup, and browser runtime installation. Downstream schema/RPC E2E steps were skipped because the browser step failed.

The browser step had already been moved from Metro/dev-server startup to exported production-style Expo web serving in Session 65, yet the same browser step still failed. The connected GitHub read surface exposes the exact failed step and timestamps but not the underlying Playwright log. The run duration shows the browser boundary remained long-running, so this session hardened the browser journey itself rather than increasing global timeouts or weakening gameplay assertions.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 66 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `15e0d3da716fad09ac2ea47badb869818ef195bf` (`docs: record session 65 browser QA failure fix`).
- Exact-SHA CI run 34723045893: `completed/success`.
- Exact-SHA Game QA run 34723045894: `completed/failure`.
- Game QA job 103632273295 shows all steps through `Install browser QA runtime` Green, then `Solo AI browser E2E` failed; all downstream schema/RPC E2E steps were skipped.
- No new product gameplay P0/P1 was established by the available evidence.

### Objective
Fix the first meaningful browser-QA reliability boundary without weakening the Solo full-game browser journey or starting a second launch-readiness objective.

### Reproduction / design finding
The exported-app change from Session 65 did not make the browser check Green. The connected GitHub surface still does not expose the Playwright step log, so this session does not invent a selector or gameplay root cause. The observable failure remains inside a long-running browser navigation/hydration path.

The browser spec previously used default `page.goto`, `page.reload`, and URL-navigation waiting semantics. Those can wait on broader page lifecycle behavior than this acceptance test actually needs. For a React/Expo app backed by Supabase realtime, the stable contract is: receive DOM content, then assert the hydrated UI/state explicitly. Browser navigation should therefore be independently bounded and diagnostics should identify the last rendered URL/body when the journey fails.

### Changes
- Updated `scripts/qa/solo-browser-e2e.spec.mjs` only.
- Added `gotoHydrated` and `reloadHydrated` helpers using `waitUntil: 'domcontentloaded'` with a 15-second navigation cap.
- Bounded `waitForURL` to the same 15-second navigation contract.
- Added a 75-second Playwright test-level timeout, intentionally below the workflow's existing 90-second outer cap so Playwright can report the failure instead of being killed first.
- Added failure-only diagnostics that print the current URL, document title, and up to 4000 characters of rendered body text. This preserves actionable evidence on the next failure.
- Kept all gameplay assertions unchanged: room creation through the real UI, 1 human + 3 AI, case install, AI discussion visibility, human voting, deterministic local vote seeding, innocent elimination, next clue, refresh/reconnect, mafia elimination, winner UI, and final server snapshot.
- No product gameplay code, schema, migration, Production database, provider, or deployed service was changed.

### Commits
- `9d62c6611f728982d28dcdbcd6770abafc601dec` — bound Solo browser navigation and add failure diagnostics.

### Checks
- Baseline `15e0d3da...`: CI success; Game QA failure at `Solo AI browser E2E`.
- At the post-change inspection for `9d62c661...`:
  - CI run 34725685575: `in_progress`.
  - Game QA run 34725685563: `in_progress`.
- Therefore this session does **not** claim the browser fix is Green or deploy-safe yet.

### Newly discovered bugs / risks
- The browser E2E still has no proven product defect from the evidence currently exposed; the failure remains in the browser acceptance boundary until the new run resolves.
- If `9d62c661...` fails, the new bounded Playwright failure should finish before the shell timeout and emit last-page diagnostics, which must be treated as the next session's first evidence rather than bypassing the test.
- Browser/live Production evidence remains weaker than local evidence until an authorized guarded exact-SHA release can run.

### Deploy safety
Not deploy-safe from this session because exact-SHA CI/Game QA for `9d62c6611f728982d28dcdbcd6770abafc601dec` are still running. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session remains inside the browser-coverage milestone and does not start launch-readiness or any second product objective. LLM discussion and 11–15 expansion remain deferred.

## Prior handoff
Session 65 moved the browser QA server from `expo start --web` to `expo export --platform web` + `expo serve`, preserving the browser assertions. Its implementation did not close the browser check: latest evidence at Session 66 start was CI Green and Game QA failing specifically at `Solo AI browser E2E`.

## Exact next-session priority
Resolve exact-SHA CI/Game QA for `9d62c6611f728982d28dcdbcd6770abafc601dec` first. If `Solo AI browser E2E` or another check fails, inspect the newly bounded failure evidence/diagnostics and fix the first meaningful failure without weakening coverage or starting new scope. If both are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch is still unavailable, perform one bounded launch-readiness hardening objective driven by combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
