# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 73 is a bounded checkpoint/planning session. Latest `main` at session start was `db5a311d4b2f4b0793c1dd4bb965b7c401dc3d70` (`docs: record session 72 finished-state locator fix`). The prerequisite implementation SHA `575b418caf25435d8808b1f14978605d7309dc29` is now fully Green: exact-SHA CI run `34740777771` completed successfully and Game QA run `34740777812` completed successfully. The handoff commit `db5a311d...` also has CI run `34740797182` and Game QA run `34740797138` completed successfully.

The Solo browser milestone is therefore closed locally/CI: Chromium now completes Solo creation → 1 human + 3 AI → case install → AI discussion → human voting → elimination → next round → refresh/reconnect → final mafia elimination → finished winner UI → authoritative winner snapshot. The successful browser run completed in about 4 seconds after the web app was ready.

Core/full-game confidence is strong for supported counts 4–10. The same successful Game QA run reports:
- 140 complete deterministic game simulations passed.
- Full-game Supabase RPC E2E passed for each player count 4, 5, 6, 7, 8, 9, and 10.
- Boss-eliminated admin behavior passed: eliminated Boss cannot vote but retains reveal/resolve authority.
- Same-room rematch E2E passed.
- Player identity, gender wording, case-role install, abuse/rate-limit perimeter, AI Players identity/voting, authoritative vote UI, and legacy-identity compatibility contracts all passed.
- Story critic passed all 14 curated Egyptian-Arabic cases across counts 4–10 with average 9.9/10, zero early-fairness warnings, zero enforced-fairness errors, and exact player-count coverage.

Production/release safety remains intentionally gated. Repository truth contains a manual `Vercel Release Package` workflow with a required exact 40-character `release_sha`; it performs a read-only production preflight before packaging exact source. The currently connected GitHub tool surface exposes workflow reads/re-runs but no authorized workflow-dispatch action, so no guarded package/release was triggered. Do not substitute an unpinned release or direct Production mutation.

## Session 73 — 2026-09-13 — Checkpoint

### Starting evidence
- Read, in order, `AGENTS.md`, `docs/qa/QA-OPERATING-MODE.md`, and this handoff from default branch.
- `main` started at `db5a311d4b2f4b0793c1dd4bb965b7c401dc3d70`.
- Prerequisite `575b418caf25435d8808b1f14978605d7309dc29`:
  - CI run `34740777771`: `completed/success`.
  - Game QA run `34740777812`: `completed/success`.
- Current handoff SHA `db5a311d...`:
  - CI run `34740797182`: `completed/success`.
  - Game QA run `34740797138`: `completed/success`.
- Successful Game QA job confirms every listed step Green through browser E2E and all downstream RPC suites.
- Browser log milestones reached `winner-ui-verified`, `winner-snapshot-verified`, then `completed`; Playwright result: `1 passed`.
- Story critic: 14/14 pass, average 9.9/10, counts 4/5/6/7/8/9/10, zero early-fairness warnings.
- Full-game simulator: 140 complete games passed.
- Exact 4–10 Supabase full-game RPC E2E passed.

### Objective
Audit the just-closed browser/full-game milestone and re-rank the next launch-readiness work instead of forcing another implementation slice immediately after five closely related implementation/fix sessions.

### Reproduction / design finding
No active P0/P1 gameplay failure was found at checkpoint start. The prior browser failure chain is closed: the final exact-SHA browser suite is Green and all downstream checks are Green.

The most important remaining confidence gap is now browser breadth rather than core state correctness. Current real-browser coverage proves the Solo AI path, but it does not yet prove the normal multi-client human path end-to-end through two separate browser identities: Boss create, another human join, nickname/gender presentation, Boss reveal controls, player voting, refresh/reconnect, elimination, and winner. RPC tests cover these state transitions deeply, but a launch-readiness browser slice should verify the actual human join/UI integration before adding product scope.

Release/live evidence also remains blocked by tooling authorization, not by a known product failure: `.github/workflows/package-vercel-source.yml` requires `workflow_dispatch` with exact `release_sha` and executes read-only production preflight, but the connected GitHub action surface in this session has no dispatch operation.

### Code / database / test / doc changes
- Checkpoint only: no runtime code, schema, migration, story, gameplay, test assertion, provider, Production DB, or release change.
- Updated this handoff with audited Green evidence, remaining risks, milestone status, and the next ordered objectives.

### Commits
- `03cd6fd020a042902d7f182ca9c098c206e8e0bb` — `docs: checkpoint after browser E2E milestone`.
- Follow-up documentation-only commit records the first exact-SHA check observation for the checkpoint commit.

### Check / test results
Green baseline at checkpoint:
- CI: success on `575b418c...` and `db5a311d...`.
- Game QA: success on `575b418c...` and `db5a311d...`.
- Solo Chromium E2E: pass through winner UI + authoritative winner snapshot.
- 140 deterministic full games: pass.
- Local Supabase full-game RPC E2E: pass for every supported count 4–10.
- Boss-eliminated admin E2E: pass.
- Rematch E2E: pass.
- Identity/gender/case-role/abuse/AI-player contracts and E2E: pass.
- Story critic: 14 curated cases pass, average 9.9/10.
- First post-commit inspection for checkpoint SHA `03cd6fd020a042902d7f182ca9c098c206e8e0bb` returned no workflow runs yet (`total_count: 0`), so this checkpoint does not claim its own documentation SHA Green; resolve it first next session.

### Audit: what is green vs. what remains risky
**Green / closed enough to move forward cautiously**
- Core full-game state correctness 4–10 under deterministic and local RPC suites.
- Solo AI browser full-game path including refresh/reconnect and winner rendering.
- Boss authority after elimination.
- AI Player identity and vote integration.
- Nickname-primary identity, gender-only wording contract, caseRole install contract.
- Curated-case exact 4–10 coverage and automated story fairness/clarity baseline.
- Local migration stack applies cleanly in Game QA; prior handoff records Production migration parity as closed.

**Remaining launch risks / gaps**
- No true multi-client human browser E2E yet; human join/Boss controls are covered by static/RPC evidence but not by a two-session browser journey.
- No fresh live Production smoke on the now-Green browser milestone because exact-SHA workflow dispatch is unavailable through the connected tool surface.
- `npm install` reports 13 moderate vulnerabilities; installing the Playwright QA runtime transiently reports 15 total vulnerabilities including 2 high. These need package-path triage before launch, not blind `npm audit fix --force`.
- GitHub Actions logs warn that several actions still target deprecated Node 20 runtimes while GitHub forces Node 24; this is technical debt, not a current failure.
- Supabase local startup warns `[inbucket]` config is deprecated in favor of `[local_smtp]`; lower priority but worth cleaning during launch hardening.
- LLM discussion and 11–15 expansion remain deliberately deferred; current evidence does not justify adding them before launch confidence improves.

### Deploy safety
No Production deploy, restore, migration, DB write, provider mutation, or release package was performed. The tested application SHA `575b418caf25435d8808b1f14978605d7309dc29` has Green CI + Game QA and is a valid candidate for the repository's guarded release preflight, but this checkpoint does not claim a Production deploy is safe until the exact-sha release preflight/package and live smoke are actually executed through an authorized path.

### Roadmap impact / next 4 substantial objectives
1. **Multi-client human browser E2E launch slice** — add one deterministic browser vertical slice using separate Boss and human-player sessions, covering create/join, nickname + gender-safe presentation, Boss reveal/control flow, human voting, elimination, refresh/reconnect, next round, and winner; use local Supabase and preserve existing RPC suites.
2. **Guarded exact-SHA release + live smoke when authorization exists** — dispatch `Vercel Release Package` only with a Green exact SHA, require read-only production preflight success, then perform the repository-approved deployment path and live smoke covering create/Solo/join/reveal/voting/reconnect/winner. Do not invent a workaround if dispatch remains unavailable.
3. **Dependency/runtime launch hardening** — triage npm vulnerabilities by actual production reachability, upgrade safe direct dependencies/actions, remove Node-runtime and Supabase-config deprecation debt where non-breaking, and keep full Game QA Green.
4. **Launch observability/error-path hardening** — after browser breadth and release smoke, improve actionable user/error diagnostics for room creation/join/game transitions and preserve regression evidence. LLM discussion and 11–15 remain after these launch-readiness gates unless new evidence reprioritizes them.

## Prior handoff
Sessions 68–72 formed one browser-confidence milestone: canonical Solo room creation, bounded diagnostics, durable browser evidence, corrected human-vote selector, winner UI contract alignment, and finished-state locator disambiguation. Session 72's implementation `575b418c...` is now proven Green by both CI and Game QA.

## Exact next-session priority
First resolve exact-SHA checks for the latest Session 73 checkpoint documentation commit. If they remain Green and no new P0 appears, implement exactly one substantial **multi-client human browser E2E launch slice** using separate Boss + human browser identities and local Supabase, covering create/join → reveal/Boss controls → voting/elimination → refresh/reconnect → next round → winner. If an authorized exact-SHA release dispatch becomes available before implementation begins, the guarded release + live smoke may supersede this only if repository safety gates explicitly remain satisfied. Do not add LLM discussion or expand to 11–15 in the next session.
