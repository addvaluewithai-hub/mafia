# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 77 is a delivery session focused on reproducible npm dependency resolution and durable security evidence after the CI/runtime toolchain pinning milestone became Green.

The prior toolchain-hardening handoff SHA `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e` is fully Green:
- CI run `34749829387`: `completed/success`.
- Game QA run `34749829351`: `completed/success`.

Core/full-game confidence remains strong for supported counts 4–10, including Solo browser and multi-client human browser journeys. No authorized release workflow-dispatch action is exposed through the connected GitHub surface, so this session did not attempt Production release/preflight and instead executed the exact fallback priority from the handoff: reproducible npm dependency resolution/security evidence.

## Session 77 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e` (`docs: record CI toolchain hardening session`).
- Resolved the pending toolchain prerequisite before opening new scope:
  - CI `34749829387`: `completed/success`.
  - Game QA `34749829351`: `completed/success`.
- Repository had no committed npm lockfile and both normal CI and Game QA used `npm install`, so a later package publication could change the resolved graph for the same repository SHA.
- The connected execution container has no outbound DNS/cache suitable for package resolution, so no lockfile was hand-authored or guessed. A temporary bounded GitHub Actions bootstrap used normal npm tooling in GitHub's runner instead.

### Exact objective
Make application dependency resolution reproducible and security findings durable as one launch-hardening slice: generate a real npm lockfile using npm, capture an audit baseline, switch CI/Game QA to lockfile installs, add a high/critical production-dependency audit gate, keep the separately installed browser QA runtime from mutating lock state, and remove the temporary bootstrap workflow after use.

### Reproduction / design finding
- The absence of `package-lock.json` meant caret/tilde dependency ranges were re-resolved on every `npm install`.
- GitHub runner bootstrap generated lockfile v3 successfully with `npm install --package-lock-only --ignore-scripts` and committed it as `f9e932e3ae298b346fb052afcb574b8dd70c138e`.
- The same run captured `qa/reports/npm-audit-baseline.json` from `npm audit --json`.
- Baseline result: 13 moderate, 0 high, 0 critical vulnerabilities across the resolved graph. The reported moderate findings are concentrated in Expo/Expo Router transitive chains; npm's suggested fixes include semver-major/downgrade-style changes such as Expo `46.0.21` and Expo Router `5.1.11`, which are not safe automatic fixes for the current Expo 57 stack.
- Therefore this session records the moderate debt but does not run `npm audit fix --force` or change Expo/React Native versions blindly. CI now fails on newly observed high/critical production dependency findings while preserving visibility of the known moderate baseline.

### Code / database / test / doc changes
- Added generated `package-lock.json` (lockfileVersion 3), produced by npm on GitHub Actions rather than hand-authored.
- Added `qa/reports/npm-audit-baseline.json` with timestamped vulnerability/dependency counts and package-level findings.
- Updated `.github/workflows/ci.yml`:
  - changed install from `npm install` to `npm ci`;
  - added `npm audit --omit=dev --audit-level=high` as the production dependency security gate.
- Updated `.github/workflows/game-qa.yml`:
  - changed base install from `npm install` to `npm ci`;
  - kept Playwright QA runtime exact at `1.55.0` and added `--package-lock=false` so the test-only install cannot mutate lock state.
- Used a temporary path-scoped bootstrap workflow only to generate/commit npm-produced lock and audit evidence, then removed that workflow in the same session.
- No gameplay, story, database schema/migration, Production configuration, release behavior, or existing QA assertion was weakened.

### Commits
- `fb093db2505900d12c4bcea6250a7eb67f02992e` — `chore: bootstrap reproducible dependency lock` (temporary generator workflow).
- `f9e932e3ae298b346fb052afcb574b8dd70c138e` — `chore: commit npm lockfile and audit baseline` (GitHub Actions bot; npm-generated artifacts).
- `46349c7159289fa0c69f92ef236fcbd1ec6f520b` — `chore: remove dependency lock bootstrap workflow`.
- `629a560a3417ea7787ec2f37872833b8ae9d4bca` — `ci: enforce reproducible npm installs`.
- `83796943a02a0f647399c962e5d22bd9fe18e4d6` — `ci: use lockfile in game QA`.
- This documentation commit records Session 77 evidence and next priority.

### Check / test results
Prior prerequisite `c2ef1495294c1dc3e3e504eb12fe2bfb2491db4e`:
- CI `34749829387`: `completed/success`.
- Game QA `34749829351`: `completed/success`.

Dependency bootstrap run `34752058071` on `fb093db2...`:
- `completed/success`.
- `Generate npm lockfile with npm`: success.
- `Capture npm audit evidence`: success.
- `Commit generated dependency evidence`: success.

Latest implementation SHA `83796943a02a0f647399c962e5d22bd9fe18e4d6` had no check runs visible yet at the final pre-handoff inspection. The documentation descendant should trigger the normal CI/Game QA push workflows; resolve those exact-SHA checks first next session. Because final checks are not yet Green, this session does **not** claim the dependency-hardening change deploy-safe.

### Newly discovered bugs / risks
- Current npm audit baseline contains 13 moderate findings and no high/critical findings. The moderate Expo/Expo Router transitive debt remains open; do not apply npm's semver-major/stack-downgrade suggestions blindly.
- The audit gate depends on registry/advisory availability at CI time; `npm ci` itself remains reproducible from the committed lockfile even if advisory data evolves.
- Supabase local `[inbucket]` deprecation remains separate configuration debt.
- Release/live smoke still cannot be launched from the connected GitHub surface because authorized workflow dispatch is not exposed here.

### Deploy safety
Not deploy-safe yet for Session 77 because CI/Game QA for the final lockfile-install changes have not completed. No Production deploy, restore, migration, production DB write, provider mutation, or release workflow dispatch was performed.

### Roadmap impact
Launch-readiness reproducibility is materially stronger: GitHub Actions/runtime tools are immutable from Session 76, and application npm resolution is now lockfile-backed in Session 77. The known dependency security debt is measured rather than hidden, with a high/critical production gate added without destabilizing the Expo 57 stack.

## Prior milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 player expansion remain deliberately deferred.
- Preset start no longer depends on Gemini in exported Expo flow.
- CI/release Actions and Supabase CLI are pinned to immutable/exact versions.
- Application npm dependency resolution is now represented by a generated lockfile and CI/Game QA use `npm ci`.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for the Session 77 documentation descendant and confirm `npm ci` plus the production audit gate are compatible with the full suite. If either fails, fix exactly the first meaningful dependency/lockfile compatibility failure without deleting the lockfile, weakening QA, suppressing a high/critical finding, or force-upgrading/downgrading the Expo stack. If both are fully Green and an authorized exact-SHA release dispatch becomes available, run only the repository-approved guarded release/preflight + live smoke objective. If Green and dispatch is still unavailable, execute one bounded observability/error-path hardening vertical slice from the launch-readiness roadmap. Do not add LLM discussion or expand to 11–15 next session.
