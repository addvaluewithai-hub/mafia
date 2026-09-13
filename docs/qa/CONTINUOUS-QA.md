# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 70 is a delivery session constrained to the still-failing `Solo AI browser E2E` prerequisite. At session start, latest `main` was `0d5da8f68721029ec49b7d31a7581a21bf224932`. The prerequisite implementation SHA `0c03838e0687ecb77097e01d28326cfc5b3426ca` had exact-SHA CI `completed/success` and Game QA `completed/failure` specifically in the browser E2E path.

The new durable artifact from Session 69 successfully exposed the first actionable browser failure. `solo-browser-e2e.json` showed the journey reached `first-innocent-target-selected` for `AI ملك` within about two seconds, then timed out at 75 seconds without reaching `human-vote-submitted`. The captured page body showed that the same nickname appeared in the AI discussion card, the suspect list, and the voting choices. The test used `getByText(firstTarget.nickname).first().click()`, so it clicked the first non-voting occurrence in the AI discussion section. The subsequent `ثبّت صوتي` button stayed disabled because `selectedVote` was never set, and Playwright waited until the test timeout. This is a browser-test selector defect, not evidence of a gameplay voting deadlock.

Session 70 fixes only that evidenced failure. The browser test now targets the last exact nickname occurrence, which is the actual vote choice in the current rendered order, records a `human-vote-target-clicked` milestone, and asserts the visible `اختيارك` state before submitting the vote. No gameplay assertion, server behavior, timeout safety gate, schema, migration, Production path, or downstream acceptance step was removed or weakened.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 70 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `0d5da8f68721029ec49b7d31a7581a21bf224932` (`docs: record session 69 browser evidence hardening`).
- Prerequisite implementation `0c03838e0687ecb77097e01d28326cfc5b3426ca`:
  - CI run 34733255098: `completed/success`.
  - Game QA run 34733255112: `completed/failure`.
- Game QA artifact `game-qa-reports` artifact id 10309524452 contained the new `solo-browser-e2e.json` evidence.
- Browser evidence:
  - `ok: false`.
  - last stage: `first-innocent-target-selected`.
  - selected target: `AI ملك` in that run.
  - Playwright error: `Test timeout of 75000ms exceeded.`
  - diagnostics still showed the voting UI, `ثبّت صوتي`, and `0/4 أصوات`; no vote had been selected or submitted.
- The rendered body contained the target nickname first in `كلام لاعيبة الـAI`, then in the suspect list, then in the vote-choice list.

### Objective
Fix the first durable, evidenced browser acceptance failure by making the Solo E2E select the actual voting choice for the intended innocent Bot and prove the UI selection state before submitting the human vote, without changing gameplay behavior or weakening coverage.

### Reproduction / design finding
The failing test used `page.getByText(firstTarget.nickname, { exact: true }).first().click()`. Because AI discussion cues are rendered above the suspect and voting sections and repeat each Bot nickname, `.first()` resolved to a non-interactive discussion nickname. The click therefore did not call the voting `PlayerCard` `onPress`, `selectedVote` remained null, and the `ثبّت صوتي` button remained disabled by the product's intended guard (`disabled={!selectedVote || !snapshot.canVote}`). Playwright then waited for the disabled button until the 75-second test timeout.

The product voting UI itself still exposed the correct target, vote button, Boss controls, and `0/4 أصوات`; the failure evidence does not support changing product voting logic.

### Changes
- Updated `scripts/qa/solo-browser-e2e.spec.mjs`.
- Replaced the ambiguous first nickname click with the last exact nickname occurrence, which corresponds to the vote-choice card in the current layout.
- Added `human-vote-target-clicked` evidence immediately after the target click.
- Added an explicit assertion that the `اختيارك` pill becomes visible before clicking `ثبّت صوتي`.
- Kept the complete path unchanged after that point: human vote → deterministic local vote completion → first elimination → next clue → refresh/reconnect → mafia vote → winner UI → authoritative finished snapshot.
- No app runtime, schema, migration, Production database, provider, release, or deployed service was changed.

### Commits
- `6268ed29728dea9985c6481e50f559dc0044fbed` — target the actual Solo vote choice and verify selection state.

### Checks
- Baseline `0c03838e...`: CI success; Game QA failure at `Solo AI browser E2E` with durable evidence described above.
- Post-change exact-SHA checks for `6268ed29728dea9985c6481e50f559dc0044fbed` at final inspection:
  - CI run 34735731510: `in_progress`.
  - Game QA run 34735731511: `in_progress`.
- Therefore this session does **not** claim the browser check is Green or deploy-safe.

### Newly discovered bugs / risks
- The new artifact proved the previous repeated timeout was caused by an ambiguous browser selector selecting duplicated display text, not by the voting state machine itself.
- The selector still depends on current vertical render order (`last()` means the vote-choice occurrence). The added `اختيارك` assertion makes any future layout drift fail immediately at the selection boundary instead of hanging later at vote submission.
- If Game QA fails later in the journey, use the persisted stage/error/diagnostics to fix only the next first evidenced failure; do not infer downstream correctness from this selector fix.
- Browser/live Production evidence remains weaker than local evidence until the complete browser suite is Green and an authorized guarded exact-SHA release can run.

### Deploy safety
Not deploy-safe from this session because exact-SHA CI and Game QA for `6268ed29728dea9985c6481e50f559dc0044fbed` were still in progress at final inspection. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session remains inside the same full-game/browser-confidence objective. It converts the newly durable diagnostic evidence into a precise acceptance-test repair without changing product semantics. No new gameplay, LLM discussion, 11–15 expansion, or unrelated polish was started.

## Prior handoff
Session 69 added durable browser milestones and failure diagnostics to the standard Game QA artifact after repeated `Solo AI browser E2E` failures could not be diagnosed from GitHub step status alone. Session 68 had already corrected Solo room creation to use the canonical hardened room-creation helper; that change was real but did not close the browser test because the later vote selector was still ambiguous.

## Exact next-session priority
Resolve exact-SHA CI and Game QA for `6268ed29728dea9985c6481e50f559dc0044fbed` first. If `Solo AI browser E2E` fails again, download `game-qa-reports`, read `solo-browser-e2e.json`, and fix the first newly evidenced assertion/navigation/product failure only, without weakening coverage or starting new scope. If browser and all downstream Game QA steps are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch remains unavailable, perform one bounded launch-readiness hardening objective driven by combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
