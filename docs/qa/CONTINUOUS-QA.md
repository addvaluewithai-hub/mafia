# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 83 is a delivery session focused only on curated-content launch readiness for the 4–5-player band. Core/full-game confidence remains strong for supported counts 4–10; no P0 gameplay regression was present at session start.

The Session 82 implementation SHA `49f58a2a66097ed4d5db276f24cb047557a8891b` and handoff SHA `c812294c6235f2abc68b27e28e7c1f295f904534` are fully Green:
- implementation `validate`: `completed/success` (run `34765908334`).
- implementation `qa`: `completed/success` (run `34765908278`).
- handoff `validate`: `completed/success` (run `34765945687`).
- handoff `qa`: `completed/success` (run `34765945643`).

The connected GitHub surface still exposes no authorized workflow-dispatch action, so production release preflight/live smoke was not bypassed or simulated.

## Session 83 — 2026-09-13 — Delivery

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from the default branch.
- `main` started at `c812294c6235f2abc68b27e28e7c1f295f904534`.
- Resolved the prerequisite first: exact-SHA CI and Game QA are Green for both the Session 82 implementation and handoff descendant.
- Audited `lib/story-catalog.ts`, `lib/server-stories`, `scripts/qa/curated-player-count-contract.mjs`, `scripts/qa/story-critic.mjs`, and `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.
- The library had 14 cases: exactly two for every supported count 4–10. The meaningful launch-breadth gap was theme diversity in the smallest bands: both 4-player cases were `home-social`, while both 5-player cases were `work-records`.
- Existing semantic review considered all 14 cases fair; the gap was breadth/replay variety, not a known story-correctness defect.

### Exact objective
Improve one coherent curated-content band only: expand exact-count coverage for 4–5 players from two to three reviewed cases each, add theme diversity without changing gameplay/player-count semantics, preserve nickname/gender/case-role contracts, and add deterministic coverage protection so the launch breadth cannot silently regress.

### Reproduction / design finding
- `curated-player-count-contract.mjs` enforced exactly two stories for every count, which was appropriate for the previous milestone but would reject any legitimate library expansion.
- 4 players had only `home-social` choices; 5 players had only `work-records` choices. This made the most common/smallest launch band feel narrower than the overall three-pack catalog suggested.
- The safest bounded slice was to add one `stage-events` 4-player case and one `home-social` 5-player case, then raise only the completed 4–5 contract. Counts 6–10 remain unchanged for later coherent slices.

### Code / database / test / doc changes
- Added `lib/server-stories/soundcheck-ticket.ts` for exactly 4 players in `stage-events`:
  - mafia role: `الصوت`;
  - four clue rounds with ordinary backstage access as real innocent alternatives;
  - shared silver-tape evidence is deliberately non-exclusive;
  - final accidental-video evidence places the missing stamped envelope in sound gear only after earlier timing/opportunity evidence has accumulated;
  - full neutral role/bio plus male/female wording for every role.
- Added `lib/server-stories/family-fridge.ts` for exactly 5 players in `home-social`:
  - mafia role: `تنظيم السفر`;
  - domestic kitchen movement keeps all innocents plausible through rounds 1–3;
  - paper/magnet evidence remains shared/non-exclusive;
  - final photo links the missing safe-number note to the travel file only after prior knowledge + distraction-window evidence;
  - full neutral role/bio plus male/female wording for every role.
- Registered both stories in `lib/story-catalog.ts` and `lib/server-stories/index.ts`; no fallback to unrelated player counts was added.
- Updated `scripts/qa/curated-player-count-contract.mjs`:
  - catalog baseline is now 16 reviewed cases;
  - 4 and 5 players require exactly three cases each and at least two theme packs per count;
  - 6–10 remain exactly two cases each;
  - existing shared-registry, exact-count, pack-filtering, file-existence, and unsupported-count guards remain intact.
- Updated `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md` with semantic review for both new cases and the 4–5 breadth rationale.
- No schema, migration, gameplay state machine, voting, winner logic, production config, AI discussion, or 11–15 support was changed.
- No Production deploy, restore, migration, DB write, provider mutation, or release workflow dispatch was performed.

### Commits
- `dacf83b27209d085b2a471ad511f960d82ba0134` — add 4-player `soundcheck-ticket` case.
- `1cedd74fd0e893caece913b2507f5e75f9ecd076` — add 5-player `family-fridge` case.
- `18764ad611f623fa4be4607b0178e4f6ddabbe7a` — broaden curated 4–5 catalog.
- `35327b0a0a33b7ec287bfebf369a7ddf2615b224` — register new server-side curated cases.
- `5a7f68019ab44d20a9b3b195cdedf461cd0e08f9` — enforce broader 4–5 coverage in QA.
- `7c4e4e1c3b3cfa4746e0146d4c670192a209f48e` — document semantic/fairness review of expanded band.
- Session 83 handoff commit: this commit (`docs: record curated 4-5 launch breadth session`).

### Check / test results
Starting Session 82 implementation/handoff:
- `49f58a2a...`: `validate` and `qa` both `completed/success`.
- `c812294c...`: `validate` and `qa` both `completed/success`.

Implementation/contract SHA `5a7f68019ab44d20a9b3b195cdedf461cd0e08f9` at the last inspection:
- `validate`: `completed/success` (run `34769001734`).
- `qa`: `in_progress` (run `34769001726`).

The Game QA run includes the curated player-count contract and story critic before full local-Supabase/browser/RPC coverage. Because Game QA and the later documentation/handoff descendants are not yet fully Green, this session does not claim deploy safety.

### Newly discovered bugs / risks
- No P0 gameplay bug was discovered.
- Counts 6–10 still have only two curated cases per exact count. This is known content breadth debt, not a correctness regression.
- The new story semantic review is human-authored and is complemented, not replaced, by deterministic `story-critic.mjs`; resulting QA must still prove there are no lexical fairness/integrity regressions.
- Production migration parity and guarded live smoke remain unproven because the approved manual release workflow cannot be dispatched from the current connected surface.

### Deploy safety
- Not deploy-safe from this session yet: resulting Game QA/checks are still pending and production release preflight/live smoke were not executed.
- Do not deploy, restore services, or apply production migrations from this state.

### Roadmap impact
1. **Guarded exact-SHA release preflight + live smoke** remains the highest-value launch gate whenever an authorized dispatch path becomes available.
2. **4–5 curated launch breadth is now expanded** from two to three cases per exact count with at least two theme packs each, pending Green resulting QA.
3. **6–7 curated breadth** is the next coherent content gap if release dispatch remains unavailable after Session 83 is Green; both counts still have two cases and incomplete three-pack variety.
4. Keep 8–10 expansion, production-derived alert thresholds, LLM discussion, and 11–15 support deferred until higher-priority evidence changes direction.

## Durable milestone summary
- Core/full-game behavior is Green for supported counts 4–10 with deterministic simulations, local Supabase RPC E2E, Solo Chromium full-game E2E, and multi-client human browser E2E.
- Identity/gender/case-role contracts are covered; gender remains wording-only and nickname remains visible identity.
- Curated stories use exact-count shared catalog/server metadata with deterministic player-count and fairness contracts.
- The curated library now contains 16 cases: three each for 4 and 5 players, and two each for 6–10 players. The 4–5 band spans at least two theme packs per exact count.
- CI/tooling remains reproducible with lockfile-backed `npm ci`, immutable GitHub Action SHAs, exact Supabase CLI, pinned Playwright, bounded dependency-security debt, and privacy-safe operational observability.
- LLM discussion and 11–15 remain deliberately deferred.

## Exact next-session priority
First resolve exact-SHA CI/Game QA for `5a7f68019ab44d20a9b3b195cdedf461cd0e08f9` and the Session 83 documentation/handoff descendants. If any real failure appears, fix exactly the first meaningful curated-content/type/story-critic/player-count-contract regression without weakening tests or removing the new cases. If all are Green and an authorized exact-SHA release workflow dispatch is available, execute one guarded release-preflight + live-smoke session only. If all are Green and dispatch is still unavailable, execute one curated-content launch-readiness vertical slice for the 6–7-player band: audit pack/quality breadth first, then add the smallest coherent high-quality expansion without touching 8–10, LLM discussion, or 11–15.
