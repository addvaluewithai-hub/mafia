# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 75 is a delivery session resolving the first meaningful failure from Session 74's new multi-client human browser E2E. The starting implementation SHA `fdd97990d7af4dfb9afc931ade9807640fd6b97d` has CI Green (`34745619738`) but Game QA failed (`34745619742`) specifically at `Multi-client human browser E2E`; Solo AI browser E2E and every earlier Game QA step were Green before that failure.

The downloaded `game-qa-reports` artifact showed the new multi-client browser test successfully created a 4-player preset room, joined three independent human browser sessions, verified 4/4 lobby state, and verified nickname/gender persistence. Its last successful stage was `nickname-gender-state-verified`. The next Boss action, `ابدأ القضية`, left the room in `LOBBY`; diagnostics rendered `GEMINI_API_KEY مش متسجل على السيرفر لسه.` and the test timed out waiting for `دورك السري`.

Repository truth identified a real product-path drift: `app/api/generate-case+api.ts`, used by the exported Expo web server in browser QA, required `GEMINI_API_KEY` and claimed an AI generation slot before inspecting `snapshot.room.caseMode`. The repository's separate `api/case-start.ts` already had the correct contract: preset rooms resolve `storyTemplateId`, validate/install the curated case, and return `source: preset` before any AI rate-limit or Gemini dependency.

Session 75 fixes that runtime path. Preset room start in the Expo API now resolves and validates the curated case, installs it through the authoritative `install_case` RPC, and returns the preset title without touching Gemini or the AI generation limiter. AI rooms retain the existing abuse-key rate-limit and Gemini path.

Core/full-game confidence otherwise remains strong for supported counts 4–10: Solo Chromium full-game E2E is Green, 140 deterministic full games pass, Supabase full-game RPC E2E passes for each count 4–10, Boss-after-elimination/rematch/identity/gender/case-role/abuse/AI-player suites pass, and the story critic passes all 14 curated cases with average 9.9/10.

Production/release safety remains gated. No Production deploy, restore, migration, provider mutation, or release workflow dispatch was performed. The repository's exact-SHA guarded release path remains the only acceptable release route.

## Session 75 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from default branch.
- `main` started at `02fb119245f4909a05a1a64165afb8b7b1fa312b` (`docs: record multi-client browser E2E session`).
- The handoff prerequisite implementation SHA `fdd97990d7af4dfb9afc931ade9807640fd6b97d` resolved as:
  - CI run `34745619738`: `completed/success`.
  - Game QA run `34745619742`: `completed/failure`.
- Game QA job `103692925299` showed all steps through `Solo AI browser E2E` successful; `Multi-client human browser E2E` was the first failing step. Later RPC suites were skipped because the job stopped at that failure.
- Downloaded artifact `game-qa-reports` (`10313837357`) and inspected `human-multiclient-browser-e2e.json` before changing code.

### Exact objective
Fix the first meaningful multi-client browser failure end-to-end: make normal preset-case Boss start work through the exported Expo web API without requiring Gemini, while preserving the AI-only generation controls and the full multi-client browser acceptance test.

### Reproduction / design finding
The multi-client artifact reproduced the failure deterministically:
- Boss opened `/create`, created room `127392`, and three separate browser identities joined through `/join`.
- `four-human-lobby-verified` and `nickname-gender-state-verified` both completed.
- Clicking `ابدأ القضية` did not transition the room out of `LOBBY`.
- Boss diagnostics displayed `GEMINI_API_KEY مش متسجل على السيرفر لسه.`.
- The test then timed out waiting for `دورك السري`.

This is a product runtime bug rather than a test-selector bug. `app/api/generate-case+api.ts` checked for `GEMINI_API_KEY` before reading the room and applied `claim_case_generation_slot_v2` before any case-mode branch. That made a curated preset start depend on an AI credential and AI generation quota it should never need.

The repository already contained the intended behavior in `api/case-start.ts`: preset mode looks up `storyTemplateId`, validates player-count compatibility, installs the curated case, and returns before the AI branch.

### Code / database / test / doc changes
- Updated `app/api/generate-case+api.ts` to import `getCuratedCase` from the authoritative curated server-story catalog.
- Moved preset handling ahead of AI generation-slot claiming and Gemini initialization.
- Preset start now:
  - resolves `snapshot.room.storyTemplateId`;
  - rejects missing curated IDs cleanly;
  - rejects player-count mismatch cleanly;
  - validates the curated payload against the current player-count/mafia-count schema;
  - installs it through `install_case`;
  - returns `{ ok: true, source: 'preset', model: 'قضية جاهزة', storyTitle }`.
- AI mode keeps the existing abuse-key `claim_case_generation_slot_v2` guard and only then requires `GEMINI_API_KEY`.
- Kept `scripts/qa/human-multiclient-browser-e2e.spec.mjs` unchanged so the exact failing browser journey remains the regression test; no assertion was deleted, skipped, weakened, or rewritten to force Green.
- No database schema/migration, curated story content, Production DB, or provider configuration changed.

### Commits
- `a16c8a7a167f3d6df747062dbb5deba2c8f94425` — `fix: start preset cases without Gemini dependency`.
- This documentation commit records Session 75 evidence and handoff state.

### Check / test results
Starting failure SHA `fdd97990d7af4dfb9afc931ade9807640fd6b97d`:
- CI run `34745619738`: `completed/success`.
- Game QA run `34745619742`: `completed/failure` at `Multi-client human browser E2E`.
- `Solo AI browser E2E` was `completed/success` immediately before the failure.

Fix SHA `a16c8a7a167f3d6df747062dbb5deba2c8f94425` at latest inspection:
- CI run `34748124005`: `in_progress`.
- Game QA run `34748123981`: `in_progress`.

Because exact-SHA checks are still running, this session does **not** claim the fix Green or deploy-safe yet.

### Newly discovered bugs / risks
- Confirmed runtime drift existed between the exported Expo API route and `api/case-start.ts`; both routes now agree on the critical preset-vs-AI start boundary for this behavior, but duplicated server start implementations remain technical debt and could drift again.
- The multi-client test has not yet progressed beyond Boss case start on the fix SHA; once it does, later selector/state failures may still appear and must be treated as new evidence, not preemptively guessed.
- Existing launch technical debt remains: npm vulnerability triage, deprecated GitHub Actions Node runtime warnings, and Supabase local SMTP config deprecation. These remain below the active browser/full-game failure until this exact path is Green.

### Deploy safety
Not deploy-safe yet for this change because exact-SHA CI/Game QA are still running. No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Roadmap impact
This fix removes a real normal-human preset-start regression uncovered by the new browser vertical slice. If `a16c8a7a...` becomes fully Green through the multi-client winner path, the principal local browser-confidence gap from Session 73 will be closed. The next roadmap gate then returns to guarded exact-SHA release/live smoke when an authorized dispatch path exists; if dispatch remains unavailable, proceed to dependency/runtime launch hardening rather than new gameplay scope.

## Session 74 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `fa8e7cd2e034f161c537cd928e2f67659ce44069`.
- CI run `34743104102` and Game QA run `34743104100` were both `completed/success`.
- Session 73 explicitly ranked a separate-Boss/separate-human browser journey as the highest remaining launch-confidence gap.

### Exact objective
Add one deterministic multi-client human browser E2E vertical slice using separate browser identities and local Supabase, covering normal Boss creation and standalone human joins through role reveal, Boss controls, real human voting, elimination, next round, refresh/reconnect, and winner rendering/state.

### Changes
- Added `scripts/qa/human-multiclient-browser-e2e.spec.mjs` with four isolated browser contexts: Boss + three humans.
- Added the `Multi-client human browser E2E` step to `.github/workflows/game-qa.yml` after the Solo browser step.
- Added durable evidence output at `qa/reports/human-multiclient-browser-e2e.json`.
- Commits: `99fb0a60de628e2ee5ea7c620a2a1082bc22dbae` and `fdd97990d7af4dfb9afc931ade9807640fd6b97d`.

### Handoff result
The first run later resolved as CI Green and Game QA failing at the new multi-client step. Session 75 owns that exact failure and does not open unrelated launch scope.

## Prior checkpoint direction
Session 73 confirmed core/full-game checks Green and ranked the next substantial objectives as: (1) multi-client human browser E2E, (2) guarded exact-SHA release + live smoke when authorization exists, (3) dependency/runtime launch hardening, and (4) launch observability/error-path hardening. LLM discussion and 11–15 expansion remain deliberately deferred.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for `a16c8a7a167f3d6df747062dbb5deba2c8f94425`. If `Multi-client human browser E2E` still fails, download the new `game-qa-reports` artifact, read `human-multiclient-browser-e2e.json`, and fix exactly the first meaningful new failure without weakening coverage or starting unrelated scope. If both CI and Game QA are fully Green and an authorized exact-SHA release dispatch is available, run only the repository-approved guarded release/preflight + live smoke objective. If Green but dispatch remains unavailable, execute one dependency/runtime launch-hardening vertical slice while keeping all Game QA Green. Do not add LLM discussion or expand to 11–15 next session.