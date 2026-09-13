# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 86 is a bounded checkpoint/planning session. It follows the required checkpoint cadence after the recent implementation/content sequence and the Session 85 regression fix. No unrelated product feature or 8–10 content expansion was implemented in this session.

The Session 85 prerequisite is now fully resolved:
- fix SHA `05b2bcc5e5de3dd2e7c69004ac6d98ca3c631b80`: `validate` and `qa` both `completed/success`.
- Session 85 handoff `95b7e6ee8155f711af4a9ff419381791d101f3ae`: `validate` and `qa` both `completed/success`.

Core/full-game confidence remains strong for supported counts 4–10. No known P0 gameplay deadlock is open. The connected GitHub surface still exposes repository content/check reads and content writes but no authorized workflow-dispatch write action, so the guarded production release workflow was not bypassed or simulated.

## Session 86 — 2026-09-13 — Checkpoint / Planning

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at Session 85 handoff `95b7e6ee8155f711af4a9ff419381791d101f3ae`.
- Resolved the prerequisite before planning: both exact implementation SHA `05b2bcc5...` and the Session 85 handoff descendant are Green in `validate` and `qa`.
- No newer implementation commit or failing check existed on `main` before this checkpoint.

### Exact objective
Perform one bounded checkpoint after the completed 4–7 curated-library milestone slice: audit what is actually Green, remaining full-game/production risks, story-quality status, curated coverage by player count, launch technical debt, and set the next 3–4 substantial objectives with one exact next-session priority.

### Checkpoint findings

#### 1. Core / full-game correctness
The repository's `Game QA` workflow currently protects the critical path with:
- deterministic full-game state simulations;
- Solo Chromium browser E2E;
- multi-client human browser E2E;
- local Supabase player identity, gender, case-role, abuse-perimeter, and AI-player E2E;
- full-game Supabase RPC E2E for exact supported counts 4–10;
- eliminated-Boss admin-control E2E;
- same-room rematch E2E.

This is sufficient to keep Milestone A/Core Stable in a Green posture on current `main`. No gameplay P0 or newly observed room/create/join/reveal/clue/vote/tie/elimination/reconnect/winner regression is open from this checkpoint.

Risk that remains: this is strong local/CI evidence, not production runtime evidence. A real production deploy still needs the guarded release preflight and live smoke before a deploy-safe claim.

#### 2. Production / DB drift and release evidence
The release workflow `package-vercel-source.yml` is intentionally `workflow_dispatch` only and requires a full 40-character `release_sha`. It checks out that exact SHA, runs `scripts/release/preflight.mjs`, and only packages source after preflight passes.

The preflight requires:
- exact-SHA `validate` Green;
- exact-SHA `qa` Green;
- read-only reconciliation of every local Supabase migration against the production migration ledger, including the documented migration-history alias map.

Current blocker: the connected GitHub surface available to this loop has no workflow-dispatch write action. Therefore production migration parity and guarded live-smoke evidence remain unproven here. Do not replace this with an ad-hoc production DB write, a guessed parity claim, or an unguarded deploy.

#### 3. Identity / gender / story contract
Identity and fairness contracts remain stable:
- nickname is the visible player identity;
- gender is wording-only and is not used for mafia assignment or win probability;
- generated and curated case roles have deterministic contract coverage;
- exact-count curated lookup remains shared between catalog/server paths with no fallback to unrelated player counts.

No checkpoint evidence justifies reopening identity/gender implementation scope before a regression appears.

#### 4. Story quality status
All 18 shipped curated cases for 4–10 have a current human semantic/fairness review in `CURATED-STORY-FAIRNESS-REVIEW.md`, covering plausible innocent alternatives, clue escalation, mafia evidence chains, red herrings, spoken Egyptian Arabic, and separation of independent acts in multi-mafia cases.

The Session 85 wording/semantic-role regression is now Green under the deterministic story critic. The correct operating posture is to rerun human semantic review when content materially changes, not to create hourly rewrite churn.

#### 5. Curated coverage by player count
Current exact-count library:
- 4 players: 3 cases, at least 2 theme packs.
- 5 players: 3 cases, at least 2 theme packs.
- 6 players: 3 cases, all 3 reviewed theme packs.
- 7 players: 3 cases, all 3 reviewed theme packs.
- 8 players: 2 cases (`home-social`, `stage-events`), missing `work-records` breadth.
- 9 players: 2 cases (`stage-events`, `home-social`), missing `work-records` breadth.
- 10 players: 2 cases (`stage-events`, `work-records`), missing `home-social` breadth.

The next coherent curated milestone is therefore the whole 8–10 launch band, not another small 4–7 tweak. A clean vertical slice would add one reviewed exact-count case for each of 8, 9, and 10 players in the missing pack, then raise the deterministic contract for 8–10 from two cases to three/all-three-pack coverage together. Do not advertise 11–15 support as part of that slice.

#### 6. Technical / launch debt
- Dependency security is bounded but not zero-risk: the reviewed production baseline is 13 moderate, 0 high, 0 critical findings, concentrated in the Expo/Expo Router transitive graph. CI rejects high/critical findings, new unreviewed vulnerability names, or growth above the moderate baseline. Do not use `npm audit fix --force` or an incompatible Expo downgrade merely to reduce the count.
- Observability is privacy-safe and operationally usable for exported Vercel logs, including release-correlated gameplay failures and telemetry-ingest failures. It is not yet a durable analytics/alerting platform. Numeric alert thresholds should wait for real production baseline windows.
- Production release evidence remains the largest launch blocker because production migration parity and live smoke have not been executed from this connected surface.
- No new schema/database migration need was identified by this checkpoint.

### Code / database / test / doc changes
- Checkpoint only: no gameplay, story, schema, migration, UI, dependency, CI, or production-runtime implementation was changed.
- Updated this handoff to record the audit, risks, roadmap ordering, and next substantial objectives.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- Session 86 checkpoint handoff: this commit (`docs: record post-curated checkpoint`).

### Check / test results
Prerequisite evidence:
- `05b2bcc5e5de3dd2e7c69004ac6d98ca3c631b80` `validate`: `completed/success`.
- `05b2bcc5e5de3dd2e7c69004ac6d98ca3c631b80` `qa`: `completed/success`.
- `95b7e6ee8155f711af4a9ff419381791d101f3ae` `validate`: `completed/success`.
- `95b7e6ee8155f711af4a9ff419381791d101f3ae` `qa`: `completed/success`.

This checkpoint changes documentation only. Resulting checks for the checkpoint commit must still be inspected before the next session treats this handoff descendant as Green.

### Newly discovered bugs / risks
- No new gameplay P0 was discovered.
- No new story fairness defect was discovered; the only recent deterministic critic defect is resolved and Green.
- The remaining curated breadth imbalance is explicit at 8–10: each count still has only two cases and one missing theme pack.
- Production migration parity/live smoke are still unknown from this automation surface; this is a launch-evidence blocker, not permission to mutate production manually.
- The moderate dependency baseline and log-only observability remain launch debt, but neither currently outranks release evidence or the remaining curated-library milestone when release dispatch is unavailable.

### Deploy safety
- Current `main` has Green CI/Game QA evidence through the Session 85 handoff, but this checkpoint does **not** claim production deploy safety.
- Production migration parity and guarded live smoke remain unproven.
- Do not deploy, restore services, or apply production migrations from this state without the repository's release safety gate.

### Roadmap impact — next substantial objectives
1. **Guarded exact-SHA release evidence, whenever authorized dispatch becomes available.** Run only the repository release workflow against a Green 40-character `main` SHA, prove production migration parity read-only, then perform the documented live smoke. Any real failure becomes the next fix objective before product expansion.
2. **Complete the curated 8–10 launch band if dispatch remains unavailable.** Add one high-quality exact-count case per count in the missing theme pack (8 `work-records`, 9 `work-records`, 10 `home-social`), extend shared catalog/server registry, deterministic coverage contracts, and human fairness/spoken-Arabic review as one coherent vertical slice.
3. **Production observability baseline after real release evidence exists.** Use privacy-safe release-correlated logs across real production windows to determine whether alerting/aggregation work is justified; do not invent thresholds from local QA.
4. **Compatible dependency-debt reduction / final launch readiness.** Prefer upstream-compatible Expo/React Native dependency remediation when available and keep high/critical/new-vulnerability gates strict; then perform only evidence-backed launch polish. New gameplay features, LLM discussion expansion, and 11–15 remain deferred until the curated 4–10 library and release evidence are stronger.

## Durable milestone summary
- **Milestone A — Core Stable:** Green for supported 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, multi-client human browser E2E, Boss-after-elimination coverage, and rematch coverage. Production parity remains an explicit external evidence blocker.
- **Milestone B — Identity & Story Contract Stable:** nickname identity, gender wording-only behavior, case-role install/generation, and legacy compatibility are covered.
- **Milestone C — Story Quality:** all 18 current curated cases have deterministic critic coverage plus human semantic/fairness review; no open story-quality regression is known.
- **Milestone D — Curated Case Library:** 4–7 breadth is strengthened to three exact-count cases each; 6–7 cover all three packs. The next coherent gap is 8–10, currently two cases each with exactly one missing pack per count.
- **Milestone F launch foundations:** CI/tooling is reproducible with lockfile-backed `npm ci`, immutable Action SHAs, exact Supabase CLI, pinned Playwright, bounded dependency-security debt, and privacy-safe operational observability. Production preflight/live smoke remain unproven from this surface.
- LLM discussion expansion and 11–15 remain deliberately deferred.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for this Session 86 checkpoint handoff descendant. If any real failure exists, fix exactly the first meaningful failure before new scope. If Green and an authorized exact-SHA release workflow dispatch becomes available, execute one guarded release-preflight + live-smoke session only. If Green and dispatch remains unavailable, execute one substantial curated 8–10 vertical slice: add one reviewed case for each of 8, 9, and 10 players in that count's currently missing theme pack, update shared catalog/server registry plus deterministic coverage/fairness evidence, and stop without opening 11–15 or unrelated features.
