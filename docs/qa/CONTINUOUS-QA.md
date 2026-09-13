# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 82 is a delivery session focused only on launch dependency-security readiness. Core/full-game confidence remains strong for supported counts 4–10; no P0 gameplay regression was present at session start.

The Session 81 handoff SHA `9d6610b39327f81fbc03cbe376a94da123f887b0` is fully Green:
- `validate`: `completed/success` (run `34763145972`).
- `qa`: `completed/success` (run `34763145976`).

The connected GitHub surface still exposes no authorized workflow-dispatch action, so production release preflight/live smoke was not bypassed or simulated.

## Session 82 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `9d6610b39327f81fbc03cbe376a94da123f887b0`.
- Resolved the prerequisite first: exact-SHA `validate` and `qa` are both `completed/success`.
- Reviewed `qa/reports/npm-audit-baseline.json`: the production audit baseline is 13 moderate, 0 high, 0 critical vulnerabilities across 769 dependencies.
- The reviewed findings are concentrated in the Expo / Expo Router transitive dependency graph. npm's advertised remediations include moving Expo 57 to Expo 46 and Expo Router 57-era code to Router 5, which is not a compatible launch-hardening change.
- No authorized release workflow-dispatch write action is available from the connected GitHub tool surface, so the handoff fallback objective applies.

### Exact objective
Bound the known moderate dependency debt without destabilizing the supported Expo 57 stack: turn the reviewed audit baseline into a deterministic CI regression contract, fail on any high/critical or unreviewed vulnerability growth, surface compatible improvements, and document how the baseline may be tightened safely.

### Reproduction / design finding
- The existing CI gate `npm audit --omit=dev --audit-level=high` correctly blocked high/critical findings, but it did not detect a new moderate advisory or growth in the reviewed moderate set.
- The current 13 moderate findings are not safely removable using npm's suggested automated fixes because those fixes propose incompatible major/downgrade moves in the Expo stack.
- A forced audit fix or framework downgrade would trade a measured moderate dependency risk for a much larger runtime/gameplay compatibility risk and violates the repository's launch-stability direction.
- The safe vertical slice is therefore to freeze the reviewed debt as an explicit upper bound while making future compatible remediation immediately visible.

### Code / database / test / doc changes
- Added `scripts/qa/dependency-security-contract.mjs`:
  - runs a fresh production-only `npm audit --json`;
  - fails on any high or critical vulnerability;
  - fails if a vulnerability name appears outside the reviewed baseline;
  - fails if the moderate count rises above the reviewed baseline;
  - reports baseline vulnerability names that disappear and the moderate-count reduction so compatible upstream fixes are visible immediately;
  - does not rewrite the baseline automatically.
- Added `qa:dependencies` to `package.json`.
- Replaced the CI's coarse audit command with `npm run qa:dependencies`, preserving the high/critical gate while adding reviewed-moderate regression protection.
- Added `docs/operations/DEPENDENCY-SECURITY.md` with the current risk posture, why `npm audit fix --force` / Expo downgrades are not accepted remediations, the exact CI contract, baseline-update rules, and release posture.
- Did not change Expo, React Native, routing, native module, application, schema, migration, story, or gameplay code.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- `6785783e93e9826aa2ada1208dd4d98d42a7c780` — add reviewed dependency-security regression contract.
- `3563ad0dcfe65d141dc7e190844d8577070ea228` — expose dependency-security QA command.
- `49f58a2a66097ed4d5db276f24cb047557a8891b` — enforce the reviewed audit baseline in CI.
- `166e9294d69949cb46bd97b116284fbd47f3df92` — document dependency-security launch posture.
- Session 82 handoff commit: this commit (`docs: record dependency security readiness session`).

### Check / test results
Starting SHA `9d6610b39327f81fbc03cbe376a94da123f887b0`:
- `validate`: `completed/success`.
- `qa`: `completed/success`.

Implementation SHA `49f58a2a66097ed4d5db276f24cb047557a8891b` at the last inspection:
- `validate`: `in_progress` (run `34765908334`).
- `qa`: `in_progress` (run `34765908278`).

Because resulting checks are not yet Green, this session does not claim deploy safety. The next session must resolve these exact-SHA checks and the Session 82 handoff descendant before any new objective or release action.

### Newly discovered bugs / risks
- No new P0 gameplay bug was discovered.
- The 13-moderate audit baseline remains launch debt. This session prevents silent regression; it does not claim the moderate findings are harmless or resolved.
- The contract intentionally treats a new moderate vulnerability name as a CI failure even if the total count stays flat; this forces explicit review rather than allowing one advisory to silently replace another.
- If a known baseline vulnerability disappears, CI remains Green and reports the improvement; the baseline should then be deliberately tightened in a later bounded maintenance change after confirming lockfile/runtime compatibility.
- Production migration parity and guarded live smoke remain unproven because the approved manual release workflow cannot be dispatched from the current connected surface.

### Deploy safety
- Not deploy-safe from this session yet: resulting checks are pending and production release preflight/live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state.

### Roadmap impact
1. **Guarded exact-SHA release preflight + live smoke** remains the highest-value launch gate whenever an authorized dispatch path becomes available.
2. **Dependency security is now bounded rather than open-ended**: no high/critical and no unreviewed moderate growth are allowed; compatible upstream reductions should tighten the baseline when they appear.
3. **Curated content launch readiness for supported 4–10** becomes the next fallback product objective if release dispatch remains unavailable after these checks are Green.
4. Keep production-derived alert thresholds, LLM discussion, and 11–15 expansion deferred until live evidence or product evidence changes priority.

## Durable milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 remain deliberately deferred.
- CI/tooling is reproducible: lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, and pinned Playwright runtime.
- Gameplay telemetry and telemetry-ingest failures have bounded privacy-safe operational evidence plus a deterministic release-scoped operator summary workflow.
- Deprecated local `[inbucket]` configuration has been removed and its runtime path is Green.
- Dependency audit debt is now explicitly bounded in CI: the reviewed baseline is 13 moderate / 0 high / 0 critical, and CI fails on high/critical, any unreviewed vulnerability name, or moderate-count growth.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for `49f58a2a66097ed4d5db276f24cb047557a8891b` and the Session 82 handoff descendant. If either fails, fix exactly the first meaningful dependency-contract/CI compatibility regression before new scope. If both are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If both are Green and dispatch is still unavailable, execute one curated-content launch-readiness vertical slice for supported counts 4–10 based on repository evidence: audit coverage breadth and quality gaps first, then improve one coherent highest-value player-count band without expanding to 11–15 or adding unrelated features.
