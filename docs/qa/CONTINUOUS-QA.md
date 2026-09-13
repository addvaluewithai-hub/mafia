# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 78 is a delivery session focused on launch-readiness observability/error-path hardening after the reproducible npm dependency milestone became fully Green.

The Session 77 handoff SHA `358ba16062b70783b7abab4126d98dac085d652c` is fully Green:
- CI run `34752202906`: `completed/success`.
- Game QA run `34752202909`: `completed/success`.

Core/full-game confidence remains strong for supported counts 4–10, including Solo browser and multi-client human browser journeys. No authorized release workflow-dispatch action is exposed through the connected GitHub surface, so this session did not attempt Production release/preflight and instead executed the handoff fallback priority: one bounded observability/error-path vertical slice.

## Session 78 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `358ba16062b70783b7abab4126d98dac085d652c`.
- Resolved the pending Session 77 prerequisite first: CI `34752202906` and Game QA `34752202909` both `completed/success`.
- Existing gameplay observability already covered create/join/start/generation/vote/resolve/reconnect with a strict privacy-safe telemetry schema and release correlation.
- The telemetry endpoint intentionally fails non-blockingly, but rejected ingest paths had no structured operational evidence. Invalid payloads, guard outages, or telemetry rate limiting could therefore make the telemetry channel itself fail silently from an operator perspective.

### Exact objective
Make telemetry-ingest failures diagnosable without weakening gameplay isolation or privacy: emit bounded structured evidence for telemetry endpoint rejection/failure paths, keep user/session/install identifiers and raw provider errors out of logs, protect the contract in CI, and document the operational query shape.

### Reproduction / design finding
- `app/api/telemetry+api.ts` returned explicit HTTP errors for missing abuse key, oversized body, invalid JSON, invalid telemetry, unavailable abuse guard, and telemetry rate limiting.
- Gameplay callers intentionally swallow telemetry transport failures, which is correct for product resilience, but there was no separate structured log for those ingest failures.
- This created an observability blind spot: operators could see missing gameplay telemetry without distinguishing normal absence from ingestion rejection/guard failure.
- The safe design is a separate error-only log type with an enumerated reason, HTTP status, and server release. It must never include request bodies, room/player identity, the installation key, or raw Supabase guard errors.

### Code / database / test / doc changes
- `app/api/telemetry+api.ts` now emits `type: "akher_kheit.telemetry_ingest"` only for ingest failures.
- Allowed ingest failure reasons are bounded to: `missing_abuse_key`, `payload_too_large`, `invalid_json`, `invalid_telemetry`, `guard_unavailable`, and `rate_limited`.
- Each ingest diagnostic contains only `outcome: "error"`, `reason`, HTTP `status`, and server `release`.
- Existing gameplay telemetry remains `type: "akher_kheit.gameplay"`; successful ingestion does not add a second noisy ingest log.
- `scripts/qa/observability-contract.mjs` now requires the structured ingest log, bounded reason vocabulary, status/release correlation, and verifies the ingest logger helper does not reference the installation key or raw guard error.
- `docs/operations/OBSERVABILITY.md` now documents the ingest diagnostic stream and its privacy/query contract.
- No gameplay, story, DB schema/migration, release behavior, dependency versions, or existing gameplay QA assertion was weakened.

### Commits
- `80a3cec1e16c3328a2ece731bbc4055a06b547fd` — structured privacy-safe telemetry ingest failure logs.
- `093ad54e152e20a28a757f06948c5078e28f9263` — initial ingest failure contract coverage.
- `bbcb3660d06cc3ab7b7233239f808d390cac9830` — tighten ingest privacy assertion to inspect the logger boundary directly.
- `318e03da1a27a0fac8d499bc579d0e996e387e79` — document telemetry ingest diagnostics and operational query shape.
- This documentation descendant records the final observed check state.

### Check / test results
Prior prerequisite `358ba16062b70783b7abab4126d98dac085d652c`:
- CI `34752202906`: `completed/success`.
- Game QA `34752202909`: `completed/success`.

Implementation SHA `bbcb3660d06cc3ab7b7233239f808d390cac9830` at final inspection:
- CI run `34754648506`: `in_progress`; dependency installation was still running and the observability contract step had not yet executed.
- Game QA run `34754648487`: `in_progress`.

The documentation descendant `318e03da...` was committed after those implementation checks started. Because the exact-SHA checks for this session are not yet Green, Session 78 does **not** claim deploy safety.

### Newly discovered bugs / risks
- Telemetry ingest is now observable when rejected, but it remains intentionally write-only to application logs; there is no durable analytics store or alerting pipeline in this repository.
- The failure reason vocabulary is intentionally coarse. Do not add raw exception messages or user-entered dimensions to make incident queries more detailed.
- Current npm audit debt remains 13 moderate, 0 high, 0 critical; Expo/Expo Router transitive findings remain separate dependency debt.
- Supabase local `[inbucket]` deprecation remains separate configuration debt.
- Release/live smoke remains blocked from this connected surface because authorized workflow dispatch is not exposed.

### Deploy safety
Not deploy-safe yet for Session 78 because CI/Game QA for the implementation/documentation descendants are still running or not yet observed Green. No Production deploy, restore, migration, production DB write, provider mutation, or release workflow dispatch was performed.

### Roadmap impact
Launch-readiness observability is stronger: gameplay operation failures and telemetry-channel failures are now distinguishable by separate structured, release-correlated, privacy-safe log types without making telemetry blocking or identifying users.

## Prior milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 player expansion remain deliberately deferred.
- Preset start no longer depends on Gemini in exported Expo flow.
- CI/release Actions and Supabase CLI are pinned to immutable/exact versions.
- Application npm dependency resolution is lockfile-backed; CI/Game QA use `npm ci`; current audit baseline is 13 moderate / 0 high / 0 critical.
- Gameplay telemetry has a strict privacy contract and telemetry-ingest failures now have separate bounded operational diagnostics.

## Exact next-session priority
First resolve exact-SHA CI and Game QA for the Session 78 implementation/documentation descendant. If either fails, fix exactly the first meaningful observability/compatibility failure without weakening the privacy contract or gameplay QA. If both are fully Green and an authorized exact-SHA release dispatch becomes available, run only the repository-approved guarded release/preflight + live smoke objective. If Green and dispatch is still unavailable, perform a checkpoint/planning session: Session 78 follows several launch-hardening delivery sessions and the checkpoint must audit what is actually Green, remaining launch blockers, production/release evidence gaps, observability/error-path gaps, dependency/config debt, and set the next 3–4 substantial milestones. Do not add LLM discussion or expand to 11–15 before that checkpoint.
