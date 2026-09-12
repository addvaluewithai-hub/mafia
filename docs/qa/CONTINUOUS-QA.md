# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 64 is a delivery session for the highest-priority executable checkpoint objective: a local browser-E2E vertical slice for Solo AI discussion/full-game UI state transitions. It started from checkpoint commit `bb38b59145594896f9ab7acd0759daf36ec2b46c`; exact-SHA CI and Game QA for that checkpoint were both Green before new scope began. No P0 or failing prerequisite check was present.

Core full-game coverage for 4–10 remains Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

A browser-E2E slice now exists in `scripts/qa/solo-browser-e2e.spec.mjs` and is wired into Game QA. It launches the real Expo web UI against clean local Supabase, creates a Solo room through the visible UI, verifies one human + three authoritative AI identities, installs a deterministic local case through the authenticated Boss session, verifies AI discussion rendering, performs a human vote through the UI, drives a deterministic innocent elimination, reveals the next round, verifies refresh/reconnect rendering, drives a final mafia elimination, and verifies the winner in both browser UI and server snapshot. Vote seeding for deterministic browser state-transition assertions uses only local Supabase service-role access inside CI; it does not affect Production and does not replace the existing real AI-voting RPC E2E.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

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
- Updated `.github/workflows/game-qa.yml`.
  - Installs pinned `@playwright/test@1.55.0` without persisting a package dependency change.
  - Installs Chromium for the QA job.
  - Starts Expo web against the same clean local Supabase used by the RPC E2E suite.
  - Runs the browser test before the remaining schema/RPC E2E checks.
  - Bounds Expo health checks and Playwright runtime so failures produce evidence instead of hanging indefinitely.
- No product gameplay code, schema, migration, Production database, provider, or deployed service was changed.

### Commits
- `bbc05b421a8c1942131dc2aa50a53dd1fa78d250` — add Solo browser full-game E2E.
- `cace7973fd9c73f22505cb0c432f0dc4a413e31f` — wire browser E2E into Game QA.
- `b61332119e680a5fbcb1de5877860df44b3cc88f` — bound browser harness startup/runtime after the first run exposed an unbounded health probe.

### Checks
- Before implementation, checkpoint SHA `bb38b591...`: CI success; Game QA success.
- First implementation run on `cace7973...`: static/contracts through story critic passed; clean local Supabase and Playwright runtime installed successfully; the new `Solo AI browser E2E` step remained in progress long enough to expose the unbounded health-probe risk, so the harness was bounded in a follow-up commit rather than treating the run as deploy-safe.
- Latest implementation SHA `b613321...`: CI run 34720594206 is in progress; Game QA run 34720594230 is in progress. At the last inspection, TypeScript, Expo doctor, all static identity/story/AI cue contracts, full-game simulations, and story critic were Green; `Start clean local Supabase` was still in progress, so the bounded browser step had not yet reported its final result.
- Because latest exact-SHA checks are still running, this session does **not** make a new deploy-safe claim.

### Newly discovered bugs / risks
- No new gameplay P0/P1 was discovered during this session.
- Browser QA adds material confidence but currently uses local-only direct vote seeding to make elimination/winner transitions deterministic. Keep the existing real `cast_ai_votes` E2E as the authority for AI voting behavior; do not mistake seeded browser transitions for an AI-vote algorithm test.
- The first harness attempt showed that browser/dev-server orchestration needs bounded timeouts. The latest workflow addresses that, but its exact-SHA result must be resolved before relying on the new coverage.
- Browser/live Production evidence still remains weaker than local browser + local RPC evidence until an authorized guarded exact-SHA release can be run.

### Deploy safety
Not deploy-safe from this session yet because exact-SHA CI/Game QA for `b613321...` are still running. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session closes the implementation side of the local-browser coverage gap identified at the Session 63 checkpoint, subject to the pending exact-SHA Game QA result. If Green, the next remaining major evidence gap is guarded live/deployed smoke rather than more local AI architecture. LLM discussion and 11–15 expansion remain deferred.

## Exact next-session priority
Resolve exact-SHA CI/Game QA for `b61332119e680a5fbcb1de5877860df44b3cc88f` first. If the new bounded `Solo AI browser E2E` or another check fails, fix the first meaningful failure without weakening coverage and do not start new scope. If both are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch is still unavailable, perform one bounded launch-readiness hardening objective driven by the now-combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
