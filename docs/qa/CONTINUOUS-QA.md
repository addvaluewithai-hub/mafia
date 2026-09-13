# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 87 is a normal delivery session that completed the planned curated 8–10 launch-band breadth slice. The Session 86 checkpoint prerequisite was resolved first: handoff `aae794733dbd57f9c19bfb516025035b510dc09b` is Green in both `validate` and `qa`. The connected GitHub surface still has no authorized workflow-dispatch write action, so the guarded production release workflow was not bypassed.

Core/full-game confidence remains strong for supported counts 4–10 with no known open P0 gameplay deadlock. Identity/gender/story contracts remain unchanged: nickname is visible identity, gender is wording-only, and mafia assignment/win probability are gender-independent.

## Session 87 — 2026-09-13 — Delivery

### Starting evidence
- Read in order from the default branch: `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, then this handoff.
- `main` started at Session 86 handoff `aae794733dbd57f9c19bfb516025035b510dc09b`.
- Exact-SHA checks for that handoff were resolved before new scope: `validate` = `completed/success`, `qa` = `completed/success`.
- No newer failing gameplay check existed on `main`.
- Authorized release workflow dispatch is still unavailable from this connected surface, so the checkpoint-directed fallback objective became active.

### Exact objective
Complete the curated 8–10 launch band as one coherent vertical slice: add one reviewed exact-count case for each count in its missing theme pack (8 `work-records`, 9 `work-records`, 10 `home-social`), wire catalog/server registry, raise deterministic breadth contracts, refresh semantic/fairness evidence, and stop without opening 11–15 or unrelated features.

### Reproduction / design finding
The checkpoint established a breadth imbalance rather than a gameplay defect:
- 8 players had `home-social` + `stage-events` but no `work-records` case.
- 9 players had `stage-events` + `home-social` but no `work-records` case.
- 10 players had `stage-events` + `work-records` but no `home-social` case.

The smallest coherent completion therefore required three cases together. Splitting one count per hourly run would have artificially fragmented a single launch-band milestone.

### Code / content changes
Added three exact-count curated cases:
- `invoice-stamp` — 8 players / `work-records` / **ختم الفاتورة**. Two independent acts: removal of a stamped original invoice and later insertion of a deficient replacement. Shared paper/clip traces preserve innocent alternatives; cabinet and printer logs resolve the two acts separately.
- `expense-ledger` — 9 players / `work-records` / **دفتر المصروفات**. Two independent acts: removing a ledger page and replacing an original receipt with an unsigned copy. Shared ruler/paper/record access remains ambiguous until camera + printer evidence.
- `villa-guest-list` — 10 players / `home-social` / **قائمة ضيوف الفيلا**. Three independent acts: taking an access card, changing the seating sheet, and hiding the original guest list. Shared party-prep movement remains plausible until three separate final evidence sources resolve the actors.

All three cases:
- use real runtime nicknames as visible identity via the existing player mapping;
- keep neutral semantic `role` values plus male/female wording variants;
- do not use gender in mafia assignment or probability;
- keep rounds 1–3 non-conclusive with real innocent alternatives;
- reconnect every mafia semantic role explicitly in the final clue;
- use natural spoken Egyptian Arabic and make difficulty come from ordering/timing rather than confusing wording.

Shared integration changes:
- `lib/story-catalog.ts` now contains 21 reviewed cases and registers the three new entries in the previously missing packs.
- `lib/server-stories/index.ts` imports/registers all three so preset lookup and AI reference cases continue through the shared exact-count registry.
- No schema, database migration, gameplay state machine, UI behavior, or supported-count range changed.

### Test / contract changes
Updated `scripts/qa/curated-player-count-contract.mjs`:
- exact catalog total raised from 18 to 21;
- every supported exact count 4–10 now requires exactly three curated cases;
- counts 6–10 must span all three reviewed theme packs;
- existing file-existence, catalog/registry consistency, exact-count filtering, no-fallback, create-room range, and unsupported 11–12 guards remain intact.

Updated `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md` to cover all 21 cases and record explicit semantic review for the three new stories.

### Commits
- `0fa4a7c8902ca2b536308db85552d025656e883b` — `content: add 8-player work-records case`.
- `0e34723d1b479e5268357a980e5b9d16a71953b2` — `content: add 9-player work-records case`.
- `d6e4e811e3856ca579f9655e46f2f925a9e9a510` — `content: add 10-player home-social case`.
- `79dc1d902dc02a06cd07036acfaf51277959e59a` — `content: register 8-10 launch cases`.
- `f853f34d5589f4e19dae6fd2f53b9c816aeadde1` — `content: register 8-10 server stories`.
- `1ad9809f158aa877a497d670b3a281e5f0cab9b8` — `qa: require complete 4-10 curated breadth`.
- `e03ccdff4cf3b1aaa1ae330d17cc035b32e85b1d` — `docs: review completed 4-10 curated library`.
- Session 87 final handoff: this commit (`docs: record 8-10 curated completion`).

### Check / test results
Prerequisite:
- Session 86 handoff `aae794733dbd57f9c19bfb516025035b510dc09b`: `validate` = `completed/success`; `qa` = `completed/success`.

Latest implementation/documentation descendant `e03ccdff4cf3b1aaa1ae330d17cc035b32e85b1d` at last inspection:
- `validate`: `queued` (run `34781060463`).
- `qa`: `queued` (run `34781060455`).

Resulting checks are not yet Green, so this session does not make a new deploy-safe claim. If a real story/type/player-count failure appears, it must be fixed before any new objective; do not delete a case or weaken the critic/coverage contract merely to turn CI Green.

### Newly discovered bugs / risks
- No new gameplay P0 was discovered.
- The 4–10 curated breadth gap is now closed in repository content: every exact count has three cases; 6–10 cover all three packs.
- The three new cases still require resulting CI/Game QA to prove syntax/type/story-critic/runtime compatibility; checks are currently pending.
- Production migration parity and guarded live smoke remain unproven because authorized workflow dispatch is unavailable from this surface.
- Dependency security remains at the reviewed bounded baseline (13 moderate, 0 high, 0 critical as last audited); observability remains privacy-safe/log-based. Neither justified unrelated work in this content session.

### Deploy safety
- No Production deploy, restore, migration, database write, provider mutation, or release workflow dispatch was performed.
- This session is **not deploy-safe yet** because resulting `validate`/`qa` are still pending and production release evidence remains unavailable.
- Do not apply production changes without the repository release safety gate and explicit Green handoff evidence.

### Roadmap impact
- Milestone A / Core Stable: unchanged and Green locally/CI through the prerequisite.
- Milestone B / Identity & Story Contract Stable: unchanged.
- Milestone C / Story Quality: expanded human semantic/fairness review to all 21 current cases.
- Milestone D / Curated Case Library: the targeted 4–10 launch breadth is now complete in repository content. Every exact count 4–10 has three reviewed cases; 6–10 span all three theme packs. 11–15 remain deliberately deferred.
- Launch readiness: production exact-SHA parity/live-smoke evidence remains the highest external blocker. New gameplay features and LLM discussion expansion remain deferred.

## Exact next-session priority
First resolve exact-SHA `validate` and `qa` for the Session 87 implementation/handoff descendant. If any real failure exists, fix exactly the first meaningful story/type/player-count/runtime regression without weakening tests or removing the new cases. If Green and an authorized release workflow dispatch becomes available, execute one guarded exact-SHA release-preflight + live-smoke session only. If Green and dispatch remains unavailable, perform one bounded launch-readiness checkpoint: reassess production-evidence blockers, the now-complete 4–10 curated milestone, dependency/observability debt, and choose the next evidence-backed objective without opening 11–15 or unrelated gameplay features.
