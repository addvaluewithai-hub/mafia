# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 79 is a bounded checkpoint/planning session. It follows several launch-hardening delivery sessions and does not add an unrelated product feature.

The Session 78 handoff SHA `382c8bc7ea451cf128212d57542386743906691a` is fully Green:
- CI run `34754682489`: `completed/success`.
- Game QA run `34754682485`: `completed/success`.
- Exact-SHA check runs are `validate: completed/success` and `qa: completed/success`.

Core/full-game confidence remains strong for supported counts 4–10. The current Game QA workflow covers deterministic full-game simulations, Solo Chromium E2E, multi-client human browser E2E, identity/gender/case-role contracts, abuse guards, AI players, full-game Supabase RPC E2E for 4–10 players, eliminated-Boss admin behavior, and same-room rematch.

## Session 79 — 2026-09-13 — Checkpoint

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `382c8bc7ea451cf128212d57542386743906691a`.
- Resolved the Session 78 prerequisite first: CI `34754682489` and Game QA `34754682485` are both `completed/success`.
- Exact-SHA release-required checks on `382c8bc7...` are Green: `validate` and `qa` are both `completed/success`.
- No P0/gameplay failure was present, so the operating-mode checkpoint cadence applies instead of forcing another implementation slice.

### Exact objective
Audit what is actually Green and what still blocks launch confidence: full-game coverage, production/release evidence, observability/error paths, dependency/runtime/config debt, story/curated-case state, and roadmap ordering; then set the next 3–4 substantial milestones and one exact next-session priority without implementing unrelated product features.

### Audit findings
#### What is actually Green
- Core/full-game behavior is Green for supported player counts 4–10.
- Automated coverage spans room creation/join, role/case installation, clue progression, voting/elimination, reconnect/refresh, later rounds, winner resolution, Boss-after-elimination behavior, and rematch.
- Both a Solo Chromium journey and a separate-context multi-client human browser journey are in the Game QA gate.
- Identity/story contracts are covered: nickname remains visible identity; gender is wording-only; caseRole/preset/AI compatibility is guarded.
- Current curated stories pass the repository story critic; no current evidence justifies jumping to new gameplay or 11–15 player expansion before launch evidence is stronger.
- CI/tooling is reproducible: lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, and pinned Playwright test runtime.
- Session 78 observability work is Green: gameplay telemetry and telemetry-ingest rejection paths have separate privacy-safe, release-correlated structured evidence.

#### Production / release evidence gap
- `.github/workflows/package-vercel-source.yml` is the repository-approved release packaging gate and is manual-only via `workflow_dispatch`.
- It requires a full 40-character `release_sha`, checks out that exact SHA, and runs `scripts/release/preflight.mjs` before packaging.
- The preflight is read-only against Production DB and requires exact-SHA `validate` + `qa` success plus reconciliation of repository migrations with the production migration ledger.
- The connected GitHub surface available to this QA session does not expose an authorized workflow-dispatch write action. Therefore the checkpoint cannot truthfully establish production migration parity or produce an approved release artifact from this surface.
- This is now the highest-value launch evidence gap. Do not infer production parity from local Supabase success and do not bypass the release workflow with ad-hoc production access.

#### Observability / error-path status
- Critical gameplay events have bounded structured telemetry and server release correlation.
- Telemetry-ingest failures now have a separate structured error-only stream with an enumerated reason vocabulary and no request body, installation key, room/player identity, or raw provider errors.
- Remaining limitation: telemetry is application-log based, not a durable analytics/alerting pipeline. This is acceptable for current launch gating but should be revisited after release evidence/live smoke exists and real operational failure modes can justify alerts.

#### Dependency / runtime / config debt
- Current recorded npm audit baseline remains 13 moderate / 0 high / 0 critical; the known findings are largely Expo/Expo Router transitive debt and should not be "fixed" using unsafe forced major changes without compatibility evidence.
- `supabase/config.toml` still uses the legacy `[inbucket]` block with `enabled = false`. Supabase CLI has emitted deprecation warnings for this configuration shape in prior QA runs. It is non-blocking today, but it is a concrete configuration-maintenance item worth closing before launch readiness is declared complete.
- Toolchain pinning and lockfile reproducibility are already Green, so dependency work should focus on evidence-based compatible upgrades/config cleanup rather than churn.

#### Story-quality / curated coverage status
- Story critic remains Green for the current curated set and the supported product band remains 4–10 players.
- The current roadmap direction remains correct: do not expand to 11–15 merely to create activity.
- Additional curated-case breadth is lower priority than proving the guarded release/live path because current core/story contracts already have automated coverage and no active story-quality failure is documented.

### Code / database / test / doc changes
- Checkpoint only: no gameplay code, schema, migration, production configuration, test assertion, dependency version, or release behavior was changed.
- Updated this handoff with the audited Green state, blockers, risks, roadmap milestones, and exact next-session priority.
- No Production deploy, restore, migration, production DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- Session 79 checkpoint handoff commit: this commit (`docs: checkpoint launch readiness after observability hardening`).

### Check / test results
Starting SHA `382c8bc7ea451cf128212d57542386743906691a`:
- CI run `34754682489`: `completed/success`.
- Game QA run `34754682485`: `completed/success`.
- `validate`: `completed/success`.
- `qa`: `completed/success`.

The checkpoint changes documentation only. Inspect the resulting exact-SHA checks at the start of the next session before any implementation or release action.

### Newly discovered bugs / risks
- No new P0 gameplay bug was found during this checkpoint.
- Production migration parity is not established in this session because the repository-approved workflow that performs the read-only production preflight cannot be dispatched from the connected GitHub surface.
- There is no durable telemetry store/alerting pipeline; current observability depends on application logs.
- npm retains moderate-only dependency debt; do not trade compatibility for a cosmetic zero-audit count.
- Supabase local config contains legacy `[inbucket]` configuration and should be updated only with current CLI-compatible evidence and regression coverage.
- A Green local/CI suite is necessary but not sufficient evidence for live production behavior; guarded exact-SHA live smoke remains outstanding.

### Deploy safety
- The starting Session 78 SHA is CI/Game-QA Green, but this checkpoint does **not** declare a new Production deploy-safe release because production migration parity and guarded live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state merely because local/CI QA is Green.

### Roadmap impact — next 4 substantial milestones
1. **Guarded exact-SHA release preflight + live smoke** — highest priority when an authorized dispatch path is available. Use only the repository-approved release workflow, verify production migration parity read-only, package the exact Green SHA, then run the approved live smoke without introducing production writes beyond normal application behavior.
2. **Supabase config/runtime compatibility hardening** — if release dispatch remains unavailable, remove the legacy local `[inbucket]` configuration using the pinned/current supported Supabase config shape, preserve clean local startup, and add/extend a CI contract so config drift cannot silently return.
3. **Operational observability readiness** — after live smoke evidence exists, define a minimal operator-facing failure query/runbook for create/join/start/vote/resolve/reconnect plus telemetry-ingest failures, and add alerting only for failure modes justified by observed production evidence.
4. **Launch content/dependency readiness** — review the moderate npm debt for compatible Expo-stack upgrades and then reassess curated-case breadth for 4–10. Keep LLM discussion and 11–15 expansion deferred until launch gates above are closed or product evidence changes priority.

## Prior milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 player expansion remain deliberately deferred.
- Preset start no longer depends on Gemini in exported Expo flow.
- CI/release Actions and Supabase CLI are pinned to immutable/exact versions.
- Application npm dependency resolution is lockfile-backed; CI/Game QA use `npm ci`; current recorded audit baseline is 13 moderate / 0 high / 0 critical.
- Gameplay telemetry has a strict privacy contract and telemetry-ingest failures have separate bounded operational diagnostics.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for this Session 79 checkpoint commit. If either fails, fix exactly the first meaningful regression before new scope. If both are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If both are Green and dispatch is still unavailable, execute one Supabase configuration/runtime compatibility vertical slice focused on replacing the deprecated local `[inbucket]` configuration safely, proving clean local Supabase/Game QA startup, and adding regression protection. Do not add LLM discussion or expand to 11–15 players.