# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 74 is a delivery session implementing the checkpoint's highest-priority launch-confidence gap: a real multi-client human browser E2E path. Session 73's latest checkpoint SHA `fa8e7cd2e034f161c537cd928e2f67659ce44069` is confirmed Green: CI run `34743104102` and Game QA run `34743104100` both completed successfully.

Core/full-game confidence before this session remains strong for supported counts 4–10: Solo Chromium full-game E2E is Green, 140 deterministic full games pass, Supabase full-game RPC E2E passes for each count 4–10, Boss-after-elimination/rematch/identity/gender/case-role/abuse/AI-player suites pass, and the story critic passes all 14 curated cases with average 9.9/10.

Production/release safety remains gated. No Production deploy, restore, migration, provider mutation, or release workflow dispatch was performed. The repository's exact-SHA guarded release path remains the only acceptable release route.

## Session 74 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from default branch.
- `main` started at `fa8e7cd2e034f161c537cd928e2f67659ce44069` (`docs: record checkpoint check state`).
- Exact-SHA checks on that starting commit are Green:
  - CI run `34743104102`: `completed/success`.
  - Game QA run `34743104100`: `completed/success`.
- No new P0/P1 gameplay failure was present at session start.
- Session 73 explicitly ranked a separate-Boss/separate-human browser journey as the highest remaining launch-confidence gap.

### Exact objective
Add one substantial deterministic multi-client human browser E2E vertical slice using separate browser identities and local Supabase, covering normal Boss creation and standalone human joins through role reveal, Boss controls, real human voting, elimination, next round, refresh/reconnect, and winner rendering/state.

### Reproduction / design finding
The gap was coverage rather than a reproduced product defect: existing real-browser evidence covered the Solo AI path, while normal human multiplayer create/join UI integration still relied on static and RPC evidence.

Repository UI truth supports a complete browser path without adding product-only hooks:
- `/create` can create a 4-player preset room with the Boss as a real player.
- `/join` creates anonymous human identities with nickname + gender.
- the room UI exposes private-role reveal independently per browser session;
- the Boss alone gets start/resolve/reveal controls;
- live players submit their own votes through the authoritative UI;
- room snapshot state persists across reload/reconnect;
- winner UI is visible to both Boss and non-Boss players.

To keep the browser test deterministic without weakening gameplay assertions, the test uses four isolated browser contexts (Boss + three humans), performs one real human UI vote in each voting round, and then uses the existing local service-role test harness only to make the remaining eligible votes converge on the chosen deterministic target. Boss resolution, next-round reveal, player reconnect, and winner rendering remain exercised through the real UI.

### Code / database / test / doc changes
- Added `scripts/qa/human-multiclient-browser-e2e.spec.mjs`.
- The browser test creates a 4-player preset room from `/create` as `Browser Boss`.
- Three isolated browser contexts join through `/join` as `Browser Salma`, `Browser Karim`, and `Browser Dina`, exercising both male and female join input while preserving nickname as visible identity.
- Verifies server-authoritative player count, zero bots, nicknames, and persisted genders before start.
- Starts the preset case from the Boss UI and verifies Boss private-role reveal plus Boss controls.
- Selects an actual innocent human browser identity from authoritative assigned roles, reveals that player's private role, and submits a real UI vote.
- Deterministically completes the first vote, verifies innocent elimination, and reveals round two from the Boss UI.
- Reloads the surviving human browser to verify reconnect state: same nickname/session, round-two clue, and private-role surface remain available.
- Submits a second real human UI vote against the mafia, completes the vote deterministically, and verifies `الأبرياء كسبوا` on both Boss and human screens plus the authoritative finished/winner snapshot.
- Writes durable failure/success evidence to `qa/reports/human-multiclient-browser-e2e.json`, with stage milestones and bounded diagnostics for each browser identity.
- Updated `.github/workflows/game-qa.yml` with a dedicated `Multi-client human browser E2E` step after the already-Green Solo browser step. It runs against the same clean local Supabase and exported Expo web server and has bounded shell/Playwright timeouts.
- No runtime product code, schema, migration, curated story, Production DB, or provider configuration was changed.

### Commits
- `99fb0a60de628e2ee5ea7c620a2a1082bc22dbae` — `test: add multi-client human browser E2E`.
- `fdd97990d7af4dfb9afc931ade9807640fd6b97d` — `ci: run multi-client human browser E2E`.
- This documentation commit records Session 74 evidence and handoff state.

### Check / test results
Starting checkpoint SHA `fa8e7cd2...`:
- CI: `completed/success`.
- Game QA: `completed/success`.

Implementation/workflow SHA `fdd97990d7af4dfb9afc931ade9807640fd6b97d` at the latest inspection:
- CI run `34745619738`: `in_progress`.
- Game QA run `34745619742`: `in_progress`.
- Game QA job `103692925299` had completed checkout/setup successfully and was still in dependency installation; the new `Multi-client human browser E2E` step had not run yet at that observation.

Because the implementation checks are still running, this session does **not** claim the new browser slice Green or deploy-safe yet.

### Newly discovered bugs / risks
- No new confirmed gameplay bug was discovered during implementation.
- The new test materially increases browser integration breadth but has first-run risk around selectors/timing and the real preset-start API path; any failure must be diagnosed from `human-multiclient-browser-e2e.json` and fixed at the first meaningful failing stage rather than by weakening assertions.
- The deterministic service-role vote seeding is test-only. At least one real surviving human browser submits an authoritative UI vote in each covered round; existing RPC/game simulations remain responsible for exhaustive vote/tie semantics.
- Existing launch technical debt remains: npm vulnerability triage, deprecated GitHub Actions Node runtime warnings, and Supabase local SMTP config deprecation. These remain below a real browser failure if one appears.

### Deploy safety
Not deploy-safe yet for this change because exact-SHA CI/Game QA are still running. No Production deploy, restore, migration, DB write, provider mutation, or release package was performed.

### Roadmap impact
If `fdd97990...` becomes fully Green, the principal local browser-confidence gap from Session 73 is closed: both Solo AI and normal multi-human browser journeys will have end-to-end evidence through winner state. The next roadmap gate should then return to the previously ranked guarded exact-SHA release/live smoke when an authorized dispatch path exists; if dispatch is still unavailable, proceed to dependency/runtime launch hardening rather than new gameplay scope.

## Prior handoff
Session 73 was a checkpoint after closing the Solo browser milestone. It confirmed all core/full-game checks Green and ranked the next substantial objectives as: (1) multi-client human browser E2E, (2) guarded exact-SHA release + live smoke when authorization exists, (3) dependency/runtime launch hardening, and (4) launch observability/error-path hardening. LLM discussion and 11–15 expansion remain deliberately deferred.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for `fdd97990d7af4dfb9afc931ade9807640fd6b97d`. If the new multi-client browser step fails, read `qa/reports/human-multiclient-browser-e2e.json` and fix exactly the first meaningful failure without weakening coverage or starting unrelated scope. If it is fully Green and an authorized exact-SHA release dispatch is available, run only the repository-approved guarded release/preflight + live smoke objective. If it is Green but dispatch remains unavailable, execute one dependency/runtime launch-hardening vertical slice while keeping all Game QA Green. Do not add LLM discussion or expand to 11–15 next session.