# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 77 is a delivery session focused on reproducible npm dependency resolution and durable security evidence after the CI/runtime toolchain pinning milestone became Green.

The prior toolchain-hardening handoff SHA `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e` is fully Green:
- CI run `34749829387`: `completed/success`.
- Game QA run `34749829351`: `completed/success`.

Core/full-game confidence remains strong for supported counts 4–10, including Solo browser and multi-client human browser journeys. No authorized release workflow-dispatch action is exposed through the connected GitHub surface, so this session did not attempt Production release/preflight and instead executed the handoff fallback priority: reproducible npm dependency resolution/security evidence.

## Session 77 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e`.
- Resolved the pending toolchain prerequisite first: CI `34749829387` and Game QA `34749829351` both `completed/success`.
- Repository had no committed npm lockfile and both normal CI and Game QA used `npm install`, allowing package-range resolution to drift for the same repository SHA.
- The local execution container has no outbound DNS/cache suitable for package resolution, so no lockfile was hand-authored or guessed. A temporary bounded GitHub Actions bootstrap used normal npm tooling in GitHub's runner.

### Exact objective
Make application dependency resolution reproducible and security findings durable as one launch-hardening slice: generate a real npm lockfile with npm, capture an audit baseline, switch CI/Game QA to lockfile installs, add a high/critical production-dependency audit gate, keep the separately installed browser QA runtime from mutating lock state, and remove the temporary bootstrap workflow after use.

### Reproduction / design finding
- GitHub runner bootstrap generated npm lockfile v3 with `npm install --package-lock-only --ignore-scripts` and committed it as `f9e932e3ae298b346fb052afcb574b8dd70c138e`.
- The same run captured `qa/reports/npm-audit-baseline.json` from `npm audit --json`.
- Baseline: 13 moderate, 0 high, 0 critical vulnerabilities; 769 resolved dependencies total.
- Moderate findings are concentrated in Expo/Expo Router transitive chains. npm's suggested fixes include semver-major/stack-downgrade changes such as Expo `46.0.21` and Expo Router `5.1.11`, which are not safe automatic fixes for the current Expo 57 stack.
- Therefore the session records this debt but does not use `npm audit fix --force` or blindly change Expo/React Native versions. CI instead gates new high/critical production dependency findings.

### Code / database / test / doc changes
- Added npm-generated `package-lock.json` (`lockfileVersion: 3`).
- Added `qa/reports/npm-audit-baseline.json` with timestamped counts and package-level findings.
- `.github/workflows/ci.yml` now uses `npm ci` and runs `npm audit --omit=dev --audit-level=high`.
- `.github/workflows/game-qa.yml` now uses `npm ci`; the exact Playwright `1.55.0` test-only install uses `--package-lock=false` so it cannot mutate lock state.
- A temporary path-scoped bootstrap workflow generated/committed the npm artifacts and was removed in the same session.
- No gameplay, story, DB schema/migration, Production configuration, release behavior, or existing QA assertion was weakened.

### Commits
- `fb093db2505900d12c4bcea6250a7eb67f02992e` — temporary npm bootstrap workflow.
- `f9e932e3ae298b346fb052afcb574b8dd70c138e` — npm-generated lockfile and audit baseline.
- `46349c7159289fa0c69f92ef236fcbd1ec6f520b` — remove temporary bootstrap workflow.
- `629a560a3417ea7787ec2f37872833b8ae9d4bca` — CI reproducible npm install + production audit gate.
- `83796943a02a0f647399c962e5d22bd9fe18e4d6` — Game QA lockfile install.
- `e4721eb6765919fca838e929e1090afe82efc847` — initial Session 77 handoff evidence.
- This documentation descendant records the observed final-check state.

### Check / test results
Prior prerequisite `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e`:
- CI `34749829387`: `completed/success`.
- Game QA `34749829351`: `completed/success`.

Dependency bootstrap run `34752058071` on `fb093db2...`:
- `completed/success`.
- lockfile generation: success.
- npm audit evidence capture: success.
- generated evidence commit: success.

Session 77 handoff SHA `e4721eb6765919fca838e929e1090afe82efc847` at final inspection:
- CI run `34752169998`: `in_progress`.
- Game QA run `34752170006`: `in_progress`.

Because final exact-SHA checks are still running, Session 77 does **not** claim the dependency-hardening change Green or deploy-safe yet.

### Newly discovered bugs / risks
- Current npm audit baseline contains 13 moderate findings and no high/critical findings. The moderate Expo/Expo Router transitive debt remains open; do not apply npm's semver-major/stack-downgrade suggestions blindly.
- The security gate depends on current registry/advisory availability; `npm ci` resolution itself is reproducible from the committed lockfile.
- Supabase local `[inbucket]` deprecation remains separate configuration debt.
- Release/live smoke remains blocked from this connected surface because authorized workflow dispatch is not exposed.

### Deploy safety
Not deploy-safe yet for Session 77 because CI/Game QA for the final lockfile-backed changes remain in progress. No Production deploy, restore, migration, production DB write, provider mutation, or release workflow dispatch was performed.

### Roadmap impact
Launch-readiness reproducibility is materially stronger: workflow/runtime tooling is immutable from Session 76, and application npm resolution is now lockfile-backed with measured security debt and a high/critical production gate.

## Prior milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 player expansion remain deliberately deferred.
- Preset start no longer depends on Gemini in exported Expo flow.
- CI/release Actions and Supabase CLI are pinned to immutable/exact versions.
- Application npm dependency resolution is now represented by a generated lockfile and CI/Game QA use `npm ci`.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for the Session 77 documentation descendant and confirm `npm ci` plus the production audit gate are compatible with the full suite. If either fails, fix exactly the first meaningful dependency/lockfile compatibility failure without deleting the lockfile, weakening QA, suppressing a high/critical finding, or force-upgrading/downgrading the Expo stack. If both are fully Green and an authorized exact-SHA release dispatch becomes available, run only the repository-approved guarded release/preflight + live smoke objective. If Green and dispatch is still unavailable, execute one bounded observability/error-path hardening vertical slice from the launch-readiness roadmap. Do not add LLM discussion or expand to 11–15 next session.
