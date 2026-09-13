# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 84 is a delivery session focused only on curated-content launch readiness for the 6–7-player band. Core/full-game confidence remains strong for supported counts 4–10; no P0 gameplay regression was present at session start.

The Session 83 implementation SHA `5a7f68019ab44d20a9b3b195cdedf461cd0e08f9` and handoff SHA `77e504f3b5de66cca048f4452cec3486f3c8d577` are fully Green:
- implementation `validate`: `completed/success` (run `34769001734`).
- implementation `qa`: `completed/success` (run `34769001726`).
- handoff `validate`: `completed/success` (run `34769066132`).
- handoff `qa`: `completed/success` (run `34769066124`).

The connected GitHub surface still exposes no authorized workflow-dispatch write action, so production release preflight/live smoke was not bypassed or simulated.

## Session 84 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `77e504f3b5de66cca048f4452cec3486f3c8d577`.
- Resolved the prerequisite first: exact-SHA CI and Game QA are Green for both the Session 83 implementation and handoff descendant.
- Audited `lib/story-catalog.ts`, the existing 6-player `last-rehearsal`/`blue-notebook` cases, the existing 7-player `fourth-floor`/`silent-auction` cases, `lib/server-stories/index.ts`, `scripts/qa/curated-player-count-contract.mjs`, and `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.
- The 6-player and 7-player bands each had exactly two cases, split only between `stage-events` and `work-records`; neither offered a `home-social` case. This was a launch breadth/replay-variety gap, not a known correctness defect.

### Exact objective
Improve one coherent curated-content band only: expand exact-count coverage for 6–7 players from two to three reviewed cases each, add the missing `home-social` theme so each count spans all three reviewed packs, preserve nickname/gender/case-role and mafia-fairness contracts, and add deterministic coverage protection without touching 8–10 or unsupported player counts.

### Reproduction / design finding
- `curated-player-count-contract.mjs` intentionally kept 6–10 at two cases after the previous 4–5 expansion.
- 6 players had `stage-events` + `work-records`; 7 players had `work-records` + `stage-events`. Adding one high-quality `home-social` case to each count is therefore the smallest coherent expansion and avoids duplicating an already-covered theme.
- Existing 6–7 cases use two independent mafia acts, so the new stories preserve that deduction model rather than introducing a large conspiracy or gender-dependent role logic.

### Code / database / test / doc changes
- Added `lib/server-stories/birthday-envelope.ts` for exactly 6 players in `home-social`:
  - mafia roles: `تجهيز الزينة` + `تنظيم المفاجأة`;
  - independent acts: one creates a temporary key copy; the other later discovers/uses it to steal the gift envelope;
  - rounds 1–3 keep real alternatives through shared kitchen/side-room movement and non-exclusive putty/paper evidence;
  - final evidence separates the two acts using a pre-party photo and an independent 9:44 guest video;
  - neutral role/bio plus explicit male/female wording for every role.
- Added `lib/server-stories/beach-house-key.ts` for exactly 7 players in `home-social`:
  - mafia roles: `توزيع المصاريف` + `حجز العربية`;
  - independent acts: one swaps the safe-code card; the other later steals the spare beach-house key;
  - rounds 1–3 retain innocent alternatives through shared note-paper, shelf contact, and ordinary travel movement;
  - final evidence separates pressure-mark/photo proof for the card swap from the driver-call interval + exit video for the key theft;
  - neutral role/bio plus explicit male/female wording for every role.
- Registered both cases in `lib/story-catalog.ts` and `lib/server-stories/index.ts`; no cross-count fallback was added.
- Updated `scripts/qa/curated-player-count-contract.mjs`:
  - reviewed catalog baseline is now 18 cases;
  - 4–7 require exactly three cases per exact count;
  - 6 and 7 must span all three declared theme packs;
  - 4–5 retain their already-reviewed minimum two-pack rule;
  - 8–10 remain exactly two cases each;
  - exact-count, shared-registry, file-existence, pack-filtering, and unsupported-count guards remain intact.
- Updated `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md` to cover all 18 cases and document the 6–7 semantic/fairness rationale.
- No schema, migration, gameplay state machine, voting, reconnect, winner logic, production config, AI discussion, 8–10 expansion, or 11–15 support was changed.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- `81a374de6ae365c77507d5a71a3675544c9883f6` — add 6-player `birthday-envelope` case.
- `e24a63b08531823bd3ea47568cdf0e44615dff75` — add 7-player `beach-house-key` case.
- `be41ceda742ea06b340ec5fb0a3d196087caf89b` — broaden curated 6–7 catalog.
- `2fddd877c358da88d786d0a2921c5b3a875cfb34` — register new server-side curated cases.
- `e567fee8f7407ef46aba301c039e6a9d590ab0d7` — enforce broader 6–7 coverage in QA.
- `a6f14782f5800bd93a581c9e8b885140479d9d8d` — document semantic/fairness review of expanded band.
- Session 84 handoff commit: this commit (`docs: record curated 6-7 launch breadth session`).

### Check / test results
Starting Session 83 implementation/handoff:
- `5a7f6801...`: `validate` and `qa` both `completed/success`.
- `77e504f3...`: `validate` and `qa` both `completed/success`.

Implementation/contract SHA `e567fee8f7407ef46aba301c039e6a9d590ab0d7` at the last inspection:
- `validate`: `in_progress` (run `34771818413`).
- `qa`: `in_progress` (run `34771818347`).

Documentation descendant `a6f14782f5800bd93a581c9e8b885140479d9d8d` at the last inspection:
- `validate`: `in_progress` (run `34771841365`).
- `qa`: `in_progress` (run `34771841386`).

Because resulting CI/Game QA are not yet fully Green, this session does not claim deploy safety.

### Newly discovered bugs / risks
- No P0 gameplay bug was discovered.
- Counts 8–10 still have only two curated cases per exact count. This is known content breadth debt, not a correctness regression.
- Semantic review of the two new cases is human-authored and is complemented, not replaced, by deterministic `story-critic.mjs`; resulting QA must still prove there are no lexical fairness/integrity regressions.
- Production migration parity and guarded live smoke remain unproven because the approved manual release workflow cannot be dispatched from the current connected surface.

### Deploy safety
- Not deploy-safe from this session yet: resulting CI/Game QA are still running and production release preflight/live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state.

### Roadmap impact
1. **Guarded exact-SHA release preflight + live smoke** remains the highest-value launch gate whenever an authorized dispatch path becomes available.
2. **4–7 curated launch breadth** is now expanded to three cases per exact count; 6 and 7 span all three reviewed theme packs, pending Green resulting QA.
3. **8–10 curated breadth** is the next coherent content gap only if release dispatch remains unavailable after Session 84 is Green.
4. Keep production-derived alert thresholds, LLM discussion, and 11–15 support deferred until higher-priority evidence changes direction.

## Durable milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role contracts are covered; gender remains wording-only and nickname remains visible identity.
- Curated stories use exact-count shared catalog/server metadata with deterministic player-count and fairness contracts.
- The curated library now contains 18 cases: three each for 4–7 players and two each for 8–10 players. Counts 6 and 7 span all three reviewed theme packs.
- CI/tooling remains reproducible with lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, pinned Playwright, bounded dependency-security debt, and privacy-safe operational observability.
- LLM discussion and 11–15 remain deliberately deferred.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for `e567fee8f7407ef46aba301c039e6a9d590ab0d7` and the Session 84 documentation/handoff descendants. If any real failure appears, fix exactly the first meaningful curated-content/type/story-critic/player-count-contract regression without weakening tests or removing the new cases. If all are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If all are Green and dispatch is still unavailable, execute one bounded checkpoint/planning session before expanding 8–10, because Sessions 81–84 have completed four implementation/content slices since the last checkpoint; audit launch blockers, full-game evidence, production/DB drift, story-quality status, 8–10 breadth, technical debt, and set the next 3–4 milestones.
