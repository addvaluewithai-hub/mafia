# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 76 is a delivery session focused on dependency/runtime launch hardening after the multi-client human browser milestone became Green.

The prerequisite implementation SHA `a16c8a7a167f3d6df747062dbb5deba2c8f94425` is now fully Green:
- CI run `34748124005`: `completed/success`.
- Game QA run `34748123981`: `completed/success`.

That closes the previously active preset-start regression and confirms the multi-client human browser journey through normal Boss creation, three independent human joins, reveal, Boss controls, voting/elimination, next round, reconnect/refresh, and winner alongside the existing Solo browser path and RPC/full-game suites.

No authorized workflow-dispatch action is exposed through the connected GitHub surface, so Session 76 did not attempt the guarded exact-SHA release workflow and did not perform a workaround. Per the prior checkpoint direction, the session instead executes one launch-hardening vertical slice: make GitHub Actions/runtime tooling deterministic and remove mutable action/runtime selectors that can make the same repository SHA behave differently over time.

Core/full-game confidence remains strong for supported counts 4–10. Production/release safety remains gated through the repository-approved exact-SHA release path; no Production deploy, restore, migration, provider mutation, or production DB write was performed.

## Session 76 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `65b37501e533622b4ae642a2cd01374798c90440` (`docs: record preset start regression fix`).
- Resolved the handoff prerequisite `a16c8a7a167f3d6df747062dbb5deba2c8f94425` before opening new scope:
  - CI `34748124005`: `completed/success`.
  - Game QA `34748123981`: `completed/success`.
- The connected GitHub tool surface supports repository reads/writes but does not expose workflow dispatch, so an authorized exact-SHA release/preflight run could not be initiated from this session.
- Repository workflow inspection found mutable CI/runtime inputs:
  - `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` used moving tags.
  - `supabase/setup-cli@v1` used a moving action tag.
  - Game QA requested Supabase CLI with `version: latest`.
  - Browser QA already used an exact Playwright package version (`@playwright/test@1.55.0`).

### Exact objective
Harden the CI/release toolchain as one coherent launch-readiness slice: pin GitHub Actions to immutable commit SHAs, pin Supabase CLI to an exact version, move the Supabase setup action to its current maintained major, and add an automated contract preventing mutable workflow dependencies from returning.

### Reproduction / design finding
The previous QA logic was Green, but workflow reproducibility was weaker than product-test reproducibility. A new release of a moving GitHub Action tag or `Supabase CLI latest` could change CI/Game QA behavior without any repository commit. This is especially undesirable now that exact-SHA release safety is the launch gate.

Current upstream release evidence checked during this session:
- `actions/checkout` latest stable release: `v7.0.1`, commit `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` latest stable release: `v7.0.0`, commit `820762786026740c76f36085b0efc47a31fe5020`.
- `actions/upload-artifact` latest stable release: `v7.0.1`, commit `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`.
- `supabase/setup-cli` latest stable release: `v3.0.0`, commit `46f7f98c7f948ad727d22c1e67fab04c223a0520`; this release supports exact npm-package CLI versions.
- Supabase CLI latest stable release observed: `v2.117.0`, so Game QA now pins `2.117.0` instead of `latest`.

### Code / database / test / doc changes
- Added `scripts/qa/ci-toolchain-pinning-contract.mjs`.
  - Requires external GitHub Actions in the three active CI/release workflows to use full 40-character commit SHAs.
  - Rejects `version: latest` for the Supabase CLI.
  - Requires an exact `x.y.z` Supabase CLI version.
  - Requires the browser QA Playwright package to remain exactly versioned.
- Updated `.github/workflows/ci.yml`:
  - pinned checkout to `3d3c42e5aac5ba805825da76410c181273ba90b1` (`v7.0.1`);
  - pinned setup-node to `820762786026740c76f36085b0efc47a31fe5020` (`v7.0.0`);
  - added the CI toolchain pinning contract as a normal CI step.
- Updated `.github/workflows/game-qa.yml`:
  - pinned checkout/setup-node to the same immutable SHAs;
  - upgraded/pinned `supabase/setup-cli` to `46f7f98c7f948ad727d22c1e67fab04c223a0520` (`v3.0.0`);
  - pinned Supabase CLI to `2.117.0`;
  - pinned upload-artifact to `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (`v7.0.1`);
  - retained exact Playwright `1.55.0` and all existing gameplay/browser/RPC assertions unchanged.
- Updated `.github/workflows/package-vercel-source.yml` to pin checkout/setup-node/upload-artifact to the same immutable SHAs, preserving exact-SHA release semantics.
- No gameplay code, tests, database schema/migration, story content, Production configuration, or release behavior was weakened.

### Commits
- `3291cd6f9bdb982866003f55f348506889ea49fd` — `test: guard pinned CI toolchain`.
- `43c3eba743e76270bb98ff34ea73e4f13d6732fa` — `ci: pin workflow toolchain`.
- `474353ba66f810c2c58c94bfd1dc41872f10f539` — `ci: pin game QA runtime`.
- `fb8edf4a12909b798ff29aadfe85d67c2961b7ff` — `ci: pin release packaging actions`.
- This documentation commit records Session 76 evidence and handoff state.

### Check / test results
Prerequisite SHA `a16c8a7a167f3d6df747062dbb5deba2c8f94425`:
- CI `34748124005`: `completed/success`.
- Game QA `34748123981`: `completed/success`.

Latest implementation SHA `fb8edf4a12909b798ff29aadfe85d67c2961b7ff` at final pre-handoff inspection:
- CI `34749798351`: `in_progress`.
- Game QA `34749798377`: `in_progress`.

Because exact-SHA checks are still running, this session does **not** claim the hardening change Green or deploy-safe yet.

### Newly discovered bugs / risks
- The repository still has no committed npm lockfile, and CI uses `npm install`; application-package resolution therefore remains less deterministic than the workflow runtime itself. Creating a lockfile should be treated as a separate dependency-management objective because it requires generating and validating the full dependency graph rather than hand-authoring lock data.
- Existing npm vulnerability triage remains open and should be based on a concrete audit/report once dependency resolution is made reproducible; do not blindly apply force upgrades across the Expo/React Native stack.
- Supabase local SMTP `[inbucket]` deprecation remains separate configuration debt below the currently running toolchain-hardening checks.
- If the upgraded pinned GitHub Actions or Supabase setup action expose a real compatibility failure in CI/Game QA, fix that first next session rather than reverting to mutable tags.

### Deploy safety
Not deploy-safe yet for Session 76 because CI/Game QA on `fb8edf4a...` are still in progress. No Production deploy, restore, migration, production DB write, provider mutation, or release workflow dispatch was performed.

### Roadmap impact
The multi-client browser milestone is Green, so launch readiness is now the active roadmap phase. This session reduces CI/release drift and strengthens exact-SHA semantics by ensuring workflow tooling is immutable at the repository level. It does not claim release readiness until the pinned toolchain passes the full suite and the guarded production preflight/live smoke can run through an authorized dispatch path.

## Prior milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 player expansion remain deliberately deferred.
- Session 75 fixed exported Expo preset start incorrectly depending on Gemini; `a16c8a7a...` is now fully Green.
- Prior checkpoint launch priorities were: multi-client browser confidence, guarded release/live smoke, dependency/runtime hardening, then observability/error-path hardening. Multi-client confidence is now closed; this session executes the dependency/runtime hardening fallback because release dispatch is unavailable through the connected surface.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for `fb8edf4a12909b798ff29aadfe85d67c2961b7ff` (and the documentation descendant). If either check fails, fix exactly the first meaningful toolchain compatibility failure without weakening QA coverage or restoring mutable tags. If both are fully Green and an authorized exact-SHA release dispatch becomes available, run only the repository-approved guarded release/preflight + live smoke objective. If Green and dispatch is still unavailable, execute one bounded dependency-management hardening slice centered on reproducible npm dependency resolution/security evidence (generate/validate a lockfile and audit findings using normal package tooling; do not hand-author lock data or force-upgrade the Expo stack). Do not add LLM discussion or expand to 11–15 next session.
