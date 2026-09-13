# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 88 is a bounded launch-readiness checkpoint performed after the 4–10 curated-library milestone completed. Session 87 prerequisite was resolved first: handoff `12f8bee51b2b4d9d98530359fb7fad0f2fe78eb2` is Green in both `validate` and `qa`.

Core/full-game confidence remains strong for supported counts 4–10 with no known open P0 gameplay deadlock. Identity/gender/story contracts remain unchanged: nickname is visible identity, gender is wording-only, and mafia assignment/win probability are gender-independent.

The 4–10 curated milestone is now complete at the current launch target: 21 reviewed exact-count cases, three per supported count; counts 6–10 span all three reviewed theme packs and 4–5 retain meaningful pack choice. 11–15 remain deliberately deferred.

The highest launch blocker is still production release evidence. The repository has a guarded exact-SHA `Vercel Release Package` workflow whose preflight requires Green `validate` + `qa` and performs read-only production migration-ledger parity before packaging. This connected GitHub surface still exposes no authorized workflow-dispatch write action, so the gate was not bypassed and production parity/live smoke remain unproven.

## Session 88 — 2026-09-14 — Checkpoint

### Starting evidence
- Read in order from the default branch: `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, then this handoff.
- `main` started at Session 87 handoff `12f8bee51b2b4d9d98530359fb7fad0f2fe78eb2`.
- Exact-SHA checks for that handoff were resolved before planning: `validate` = `completed/success`; `qa` = `completed/success`.
- No newer failing gameplay/story check existed on `main`.
- Checkpoint cadence is due because the curated 4–10 milestone ended; the operating mode explicitly calls for a checkpoint at milestone completion rather than forcing another implementation slice.

### Exact objective
Audit what is actually Green and launch-relevant after completion of the 4–10 curated milestone: production/release evidence, full-game coverage, story/content status, dependency and observability debt, and roadmap order. Produce the next 3–4 substantial objectives and one exact next-session priority without opening unrelated features or 11–15.

### Audit findings
#### Core / full-game
- No known open P0 gameplay deadlock was found in repository truth.
- Session 87 exact-SHA CI and Game QA are Green, so the newly completed 4–10 content library is covered by the existing type/story/player-count/runtime suite.
- The existing Game QA/full-game confidence remains the safety gate for create/join/start/reveal/clues/voting/ties/elimination/reconnect/Boss/winner/rematch paths. No evidence justified reopening those areas during this checkpoint.

#### Production / DB parity
- `.github/workflows/package-vercel-source.yml` is the authoritative release-preflight path and is `workflow_dispatch` only.
- It accepts a full 40-character `release_sha`, checks out that exact SHA, and runs `scripts/release/preflight.mjs` before packaging.
- `scripts/release/preflight.mjs` requires exact-SHA Green `validate` and `qa`, then performs a read-only query of `supabase_migrations.schema_migrations` and fails on missing/unexpected migration history.
- This is the correct next launch evidence, but the connected GitHub tool surface available in this session has read/file-write actions and no workflow-dispatch action. No manual production connection, migration, deploy, restore, or bypass was attempted.

#### Story / curated content
- `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md` covers all 21 current cases and records PASS semantic/fairness review for each.
- Every exact count 4–10 now has three curated cases. Counts 6–10 span `home-social`, `stage-events`, and `work-records`; 4–5 already have meaningful pack choice.
- Automated contracts keep exact-count/no-fallback behavior, catalog/server-registry agreement, file existence, and unsupported-count guards.
- Result: the current 4–10 launch breadth milestone is complete. Additional stories should be driven by playtest/reliability evidence, not hourly activity.

#### Dependency debt
- The reviewed production dependency baseline remains 13 moderate, 0 high, 0 critical.
- The known findings are concentrated in Expo / Expo Router transitive dependencies. Current npm remediation suggestions would move the app away from the supported Expo 57 stack, so forced audit fixes/framework downgrades are not deploy-safe.
- CI already fails on any new vulnerability name, any high/critical finding, or a moderate count above the reviewed baseline. This is bounded launch debt, not the highest next implementation priority without a compatible upstream path.

#### Observability debt
- Gameplay and telemetry-ingest logs are privacy-safe, release-correlated, bounded by allowlisted dimensions, and protected by CI contracts.
- A deterministic operator summary exists for exported Vercel JSONL logs, with incident triage documented.
- The remaining limitation is external/operational: no persistent analytics/alerting baseline exists. The runbook explicitly avoids inventing thresholds from local/test data. Alerting should wait for real production windows rather than speculative implementation.

### Code / database / test / doc changes
- Checkpoint only: no product code, schema, migration, UI, story content, or test behavior changed.
- Updated only this handoff to preserve the audit, roadmap, deploy-safety state, and exact next-session priority.

### Commits
- Session 88 checkpoint handoff: this commit (`docs: checkpoint completed 4-10 launch milestone`).

### Check / test results
Prerequisite:
- Session 87 handoff `12f8bee51b2b4d9d98530359fb7fad0f2fe78eb2`: `validate` = `completed/success`; `qa` = `completed/success`.

Resulting checkpoint-documentation SHA must still receive its own normal repository checks. If they are still pending at handoff time, do not treat this SHA as a new deploy-safe release candidate.

### Newly discovered bugs / risks
- No new gameplay P0 or story correctness defect was discovered.
- Production migration parity and live-smoke evidence remain unproven because authorized release workflow dispatch is unavailable from this connected surface.
- Dependency debt remains bounded at the reviewed moderate-only baseline but should be revisited when a compatible Expo/Router remediation exists.
- Observability is sufficient for bounded incident investigation, but launch alert thresholds cannot be justified before real production baseline data exists.
- Continuing to add curated cases to 4–10 now would create quantity without evidence-backed product value; 11–15 expansion remains intentionally deferred.

### Deploy safety
- No Production deploy, restore, migration, database write, provider mutation, or release workflow dispatch was performed.
- The prerequisite product/content state is Green in CI/Game QA, but production release evidence is still incomplete.
- This checkpoint itself does not make a new deploy-safe claim until its resulting repository checks are Green; even then, production deployment remains gated by exact-SHA release preflight and live-smoke evidence.

### Roadmap impact / next milestones
1. **Production release evidence** — when authorized workflow dispatch is available, run one guarded exact-SHA release-preflight for a Green `main` SHA, capture migration-parity evidence, package the exact source, and perform only the documented live smoke; stop on any parity/check failure.
2. **Evidence-driven launch defects** — after real preflight/smoke or production evidence exists, fix the first material gameplay/reliability/observability defect as one vertical slice with regression coverage. Do not invent features to fill sessions.
3. **Compatible dependency remediation** — when Expo/Expo Router provides a supported path that removes reviewed vulnerabilities without runtime downgrade, take one dependency-hardening slice with Expo Doctor, TypeScript, CI, and Game QA proof, then tighten the baseline.
4. **Post-evidence polish** — only after release evidence is established, use real playtest/production signals to choose UX polish or story rewrites. Keep 11–15 and unrelated new gameplay features deferred until evidence justifies them.

## Exact next-session priority
First resolve exact-SHA `validate` and `qa` for this Session 88 checkpoint handoff. If any real failure exists, fix exactly the first meaningful regression before new scope. If Green and an authorized release workflow dispatch is available, execute one guarded exact-SHA release-preflight + documented live-smoke session only. If Green and dispatch remains unavailable, do not manufacture content/features: perform one bounded launch-evidence/dependency reconnaissance session only if repository truth exposes a new actionable compatible remediation or failure; otherwise preserve the current roadmap and blocker in the handoff without production mutation.
