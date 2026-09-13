# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 80 is a delivery session focused only on Supabase local configuration/runtime compatibility. Core/full-game confidence remains strong for supported counts 4–10; no P0 gameplay regression was present at session start.

The Session 79 checkpoint SHA `9c64d104d094b8d2f0a808a657fe418c40229e66` is fully Green:
- `validate`: `completed/success` (run `34757319107`).
- `qa`: `completed/success` (run `34757319089`).

The connected GitHub surface still exposes no authorized workflow-dispatch action, so production release preflight/live smoke was not bypassed or simulated.

## Session 80 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `9c64d104d094b8d2f0a808a657fe418c40229e66`.
- Resolved the prerequisite first: exact-SHA `validate` and `qa` are both `completed/success`.
- Confirmed `supabase/config.toml` still contained the legacy disabled `[inbucket]` section identified by Session 79.
- No authorized release workflow-dispatch write action is available from the connected GitHub tool surface, so the handoff fallback objective applies.

### Exact objective
Replace the deprecated local Supabase `[inbucket]` configuration safely, preserve gameplay-required local services, prove compatibility through the existing clean local Supabase/Game QA startup path, and add regression protection so the deprecated config cannot silently return.

### Reproduction / design finding
- The legacy configuration was isolated to a disabled `[inbucket]` block; removing it does not change gameplay schema, migrations, auth semantics, storage behavior, or production configuration.
- Game QA already has the strongest appropriate runtime proof for this objective: pinned Supabase CLI `2.117.0`, `supabase start`, browser journeys, and all RPC E2E tests run against that clean local stack.
- Therefore the safest vertical slice is config cleanup + a static config contract + running that contract before local Supabase startup in Game QA, rather than introducing a new runtime path.

### Code / database / test / doc changes
- Removed the deprecated `[inbucket]` / `enabled = false` section from `supabase/config.toml`.
- Added `scripts/qa/supabase-config-contract.mjs` which fails if `[inbucket]` returns and also asserts the gameplay-required local API, DB, auth, and anonymous-auth configuration remains explicit.
- Added a `Supabase config contract` step to Game QA immediately before installing/starting the pinned Supabase CLI, so configuration drift fails before runtime E2E.
- No schema, migration, gameplay code, story content, dependency version, or production configuration changed.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- `abeaf79ecc0a3a39d0accb1bbc9361323f2b16af` — add Supabase config regression contract.
- `21828adb67ff045e1fae26bb0f3587c4b2690fa2` — remove deprecated local `[inbucket]` config.
- `c9b62a8dfaf2c08ff4f5c85164a55c05c75bec50` — run config contract in Game QA before Supabase startup.
- Session 80 handoff commit: this commit (`docs: record Supabase config compatibility session`).

### Check / test results
Starting SHA `9c64d104d094b8d2f0a808a657fe418c40229e66`:
- `validate`: `completed/success`.
- `qa`: `completed/success`.

Implementation SHA `c9b62a8dfaf2c08ff4f5c85164a55c05c75bec50` at the last inspection:
- `validate`: `queued` (run `34760243861`).
- Game QA / `qa` had not yet appeared in the exact-SHA check-runs response at that instant.

Because resulting checks are not yet Green, this session does not claim deploy safety. The next session must resolve these exact-SHA checks before any new objective or release action.

### Newly discovered bugs / risks
- No new P0 gameplay bug was discovered.
- Runtime compatibility of the cleaned config is pending the resulting Game QA run; do not infer success before `supabase start` and the downstream E2E suite are Green.
- Production migration parity and guarded live smoke remain unproven because the approved manual release workflow cannot be dispatched from the current connected surface.
- Existing moderate-only npm dependency debt and application-log-based observability remain launch debt, but neither was expanded in this session.

### Deploy safety
- Not deploy-safe from this session yet: implementation checks are pending and production release preflight/live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state.

### Roadmap impact
1. **Guarded exact-SHA release preflight + live smoke** remains the highest-value launch gate whenever an authorized dispatch path becomes available.
2. **Operational observability readiness** follows live evidence: define operator-facing failure queries/runbook and only evidence-justified alerting.
3. **Launch dependency/content readiness**: compatible Expo-stack dependency review, then curated-case breadth reassessment for 4–10.
4. Keep LLM discussion and 11–15 expansion deferred until launch gates close or product evidence changes priority.

## Durable milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 remain deliberately deferred.
- CI/tooling is reproducible: lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, and pinned Playwright runtime.
- Gameplay telemetry and telemetry-ingest failures have bounded privacy-safe operational evidence.
- Deprecated local `[inbucket]` configuration has now been removed and guarded against regression; runtime proof is pending Session 80 checks.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for `c9b62a8dfaf2c08ff4f5c85164a55c05c75bec50` and the Session 80 handoff descendant. If either fails, fix exactly the first meaningful Supabase config/runtime compatibility regression before new scope. If both are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If both are Green and dispatch is still unavailable, execute one operational observability-readiness vertical slice focused on an operator-facing failure query/runbook using the existing privacy-safe structured logs; do not add speculative alerting without production evidence, LLM discussion, or 11–15 expansion.
