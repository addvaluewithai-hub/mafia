# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 81 is a delivery session focused only on operational observability readiness. Core/full-game confidence remains strong for supported counts 4–10; no P0 gameplay regression was present at session start.

The Session 80 handoff SHA `01a0eefca82204354c6e681e5150876ab3dda90a` is fully Green:
- `validate`: `completed/success` (run `34760270198`).
- `qa`: `completed/success` (run `34760270182`).

The connected GitHub surface still exposes no authorized workflow-dispatch action, so production release preflight/live smoke was not bypassed or simulated.

## Session 81 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `01a0eefca82204354c6e681e5150876ab3dda90a`.
- Resolved the prerequisite first: exact-SHA `validate` and `qa` are both `completed/success`.
- Confirmed existing telemetry already emits bounded privacy-safe gameplay and ingest-failure JSON logs, but the operator guidance stopped at query dimensions and did not provide a deterministic incident-summary workflow.
- No authorized release workflow-dispatch write action is available from the connected GitHub tool surface, so the handoff fallback objective applies.

### Exact objective
Turn the existing privacy-safe structured logs into a bounded operator-facing incident workflow: add a deterministic failure-summary tool, regression-test its privacy/filtering behavior, wire the contract into CI, and document a release-scoped triage sequence without inventing production alert thresholds.

### Reproduction / design finding
- Existing gameplay logs already expose the right bounded dimensions: `release`, `event`, `outcome`, and coarse `errorClass`; telemetry-ingest logs expose `release`, allowlisted `reason`, and HTTP `status`.
- The operational gap was consumption rather than instrumentation: an operator had to manually aggregate exported logs and could accidentally echo unrelated fields while doing so.
- Production traffic baselines are not available in repository truth, so numeric alert thresholds would be speculative. The safe slice is deterministic aggregation + triage/runbook + CI privacy protection, while deferring alert thresholds until live evidence exists.

### Code / database / test / doc changes
- Added `scripts/operations/observability-summary.mjs`:
  - reads JSONL from `--file` or stdin;
  - accepts direct structured telemetry records and common `message`/`text`/`msg` wrappers;
  - defaults to failures/recoveries only, with optional `--all` for a bounded denominator;
  - supports exact `--release` filtering;
  - outputs aggregate counts only for allowlisted operational dimensions and never echoes arbitrary input fields.
- Added `scripts/qa/observability-operations-contract.mjs` with deterministic fixture coverage for release filtering, gameplay errors, reconnect recovery, telemetry-ingest failures, optional success inclusion, and non-echoing of injected nickname/room-code/installation-key values.
- Extended `qa:observability` so both instrumentation privacy and operator-workflow contracts run together.
- Updated CI naming to make the combined privacy/operations contract explicit.
- Expanded `docs/operations/OBSERVABILITY.md` with exact CLI usage, release-scoped triage order, telemetry-channel caveats, and an explicit rule not to derive alert thresholds from local/test evidence.
- No gameplay logic, schema, migration, story content, dependency version, production configuration, or telemetry payload schema changed.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- `4f5b5c200c6dd862fa4c1e76a249a2e0bfb9caf9` — add privacy-safe observability summary tool.
- `d771679d3b6a90adc647a24b7d677746469721ee` — add operator observability regression contract.
- `c249f8fa13419eb2cb1de1b682a5b3ea76a704bc` — expose the operator tool and combine observability QA contracts.
- `dd0ec3df974f5b614a968fd64d84f40b06edb958` — enforce the combined observability contract in CI.
- `48c8284580ead1ff7c6656d91be44f9ccfc4ad1d` — document the operator incident workflow.
- Session 81 handoff commit: this commit (`docs: record observability operations session`).

### Check / test results
Starting SHA `01a0eefca82204354c6e681e5150876ab3dda90a`:
- `validate`: `completed/success`.
- `qa`: `completed/success`.

Implementation/documentation SHA `48c8284580ead1ff7c6656d91be44f9ccfc4ad1d` at the last inspection:
- `validate`: `queued` (run `34763124275`).
- `qa`: `queued` (run `34763124255`).

Because resulting checks are not yet Green, this session does not claim deploy safety. The next session must resolve these exact-SHA checks and the handoff descendant before any new objective or release action.

### Newly discovered bugs / risks
- No new P0 gameplay bug was discovered.
- The new operator summary is intentionally an offline/log-export helper, not a durable dashboard, analytics warehouse, or alerting system.
- JSONL wrapper support is deliberately narrow (`message`, `text`, `msg`); unknown shapes are ignored rather than guessed or echoed.
- Production migration parity and guarded live smoke remain unproven because the approved manual release workflow cannot be dispatched from the current connected surface.
- Numeric alert thresholds remain intentionally undefined until multiple real production windows provide a baseline.
- Existing moderate-only npm dependency debt remains launch debt but was not expanded in this session.

### Deploy safety
- Not deploy-safe from this session yet: resulting checks are pending and production release preflight/live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state.

### Roadmap impact
1. **Guarded exact-SHA release preflight + live smoke** remains the highest-value launch gate whenever an authorized dispatch path becomes available.
2. **Production-evidenced observability thresholds/durable alerting** should follow only after live windows exist; the operator query/runbook foundation is now implemented.
3. **Launch dependency/content readiness**: compatible Expo-stack dependency review, then curated-case breadth reassessment for 4–10.
4. Keep LLM discussion and 11–15 expansion deferred until launch gates close or product evidence changes priority.

## Durable milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role and curated story contracts are covered; gender remains wording-only and nickname remains visible identity.
- Story critic passes the current curated set; LLM discussion and 11–15 remain deliberately deferred.
- CI/tooling is reproducible: lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, and pinned Playwright runtime.
- Gameplay telemetry and telemetry-ingest failures have bounded privacy-safe operational evidence.
- Deprecated local `[inbucket]` configuration has been removed and its runtime path is Green from Session 80.
- Operator-facing observability now has a deterministic release-scoped JSONL summary tool, CI privacy/filtering regression coverage, and a bounded incident triage runbook; production baselines/alerting remain intentionally deferred.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for `48c8284580ead1ff7c6656d91be44f9ccfc4ad1d` and the Session 81 handoff descendant. If either fails, fix exactly the first meaningful observability-tool/CI compatibility regression before new scope. If both are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If both are Green and dispatch is still unavailable, execute one launch dependency/content-readiness vertical slice based on repository evidence, preferring compatible dependency-risk reduction before expanding curated content; do not add speculative alert thresholds, LLM discussion, or 11–15 expansion.
