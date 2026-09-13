# Akher Kheit — Continuous QA Handoff

Read `AGENTS.md` and `docs/qa/QA-OPERATING-MODE.md` first. Git history contains earlier session detail.

## Current state
Session 68 is a delivery session constrained to the first meaningful prerequisite failure from Session 67. At session start, latest `main` was `bb5adee3e2079e2baffb5ff84ce03f2175919e1b`. Exact-SHA CI run 34728158940 was `completed/success`, while Game QA run 34728158948 was `completed/failure` specifically at `Solo AI browser E2E`. Every preceding step was Green: dependencies, TypeScript, Expo doctor, all static identity/story/AI contracts, full-game state simulations, story critic, clean local Supabase startup, and browser runtime installation. Downstream schema/RPC E2E steps were skipped because the browser step failed.

Repository inspection identified a concrete product-path contract drift in `app/solo.tsx`: the Solo screen still called `create_room_v3` directly, while the canonical room creation helper in `lib/game.ts` now uses `create_room_v4` and supplies the abuse installation key required by the hardened room-creation contract. The browser acceptance journey starts through `/solo`, so keeping a stale direct RPC there can prevent room creation/navigation even while lower-level RPC suites remain Green.

Session 68 fixes only that product-path drift. The Solo screen now calls the canonical `createRoomV3` helper, preserving the same 4-player preset configuration and then adding exactly three AI players. No browser assertion was weakened or removed.

Core full-game coverage for 4–10 remains previously Green across deterministic and local RPC suites, including ties, elimination, reconnect, next rounds, Boss authority, winner, rematch, and AI Players identity/voting. The curated library remains 14 reviewed Egyptian-Arabic cases covering 4–10, and database migration parity remains closed.

The connected GitHub surface still has no authorized exact-SHA dispatch action for the guarded Vercel release workflow, so do not substitute an unpinned release. LLM discussion and 11–15 expansion remain deferred until gameplay/UX evidence justifies them.

## Session 68 — 2026-09-13 — Delivery

### Starting evidence
- `main` started at `bb5adee3e2079e2baffb5ff84ce03f2175919e1b` (`docs: record current session 67 checks`).
- Exact-SHA CI run 34728158940: `completed/success`.
- Exact-SHA Game QA run 34728158948: `completed/failure`.
- Game QA job 103645928828 shows every step through `Install browser QA runtime` Green, then `Solo AI browser E2E` failed; downstream schema/RPC E2E steps were skipped.
- The browser step ran from 00:34:05Z to 00:36:48Z. The connected logs endpoint still does not expose the detailed Playwright step body, so no unsupported selector assertion was invented.
- Repository truth exposed a concrete mismatch: `app/solo.tsx` called `create_room_v3` directly, while `lib/game.ts#createRoomV3` uses `create_room_v4` plus `getAbuseInstallationKey()`.

### Objective
Fix the first concrete product-path contract drift on the failing Solo browser journey by routing Solo room creation through the canonical hardened room-creation helper, without weakening the existing full browser acceptance coverage.

### Reproduction / design finding
The browser journey begins at `/solo` and expects the UI to create a room then navigate to `/room/<code>`. The Solo screen had its own direct Supabase call to `create_room_v3`, bypassing the shared `createRoomV3` helper. The shared helper is the current room-creation contract: it calls `create_room_v4`, includes gender/case-mode/story-template inputs, and passes the abuse installation key. This made the Solo path stale relative to the hardened create-room contract and provided a concrete explanation for a browser-only failure before later RPC assertions.

The fix is to remove the duplicate direct RPC from the Solo screen and use the canonical helper. This also reduces future contract drift between regular room creation and Solo creation.

### Changes
- Updated `app/solo.tsx` only for product code.
- Replaced direct `ensureAnonymousSession()` + `supabase.rpc('create_room_v3', ...)` with `createRoomV3(...)` from `lib/game.ts`.
- Preserved the same Solo configuration: Boss nickname/gender, maxPlayers 4, hard difficulty, preset case mode, `last-tray` story template, and three AI players.
- Removed now-unused direct Supabase/session imports from the Solo screen.
- Kept the existing browser E2E unchanged, including room creation through the real UI, 1 human + 3 AI, case install, AI discussion visibility, human voting, deterministic local vote seeding, innocent elimination, next clue, refresh/reconnect, mafia elimination, winner UI, and final server snapshot.
- No schema, migration, Production database, provider, or deployed service was changed.

### Commits
- `5b95775e67034528c66b299288d33c31e7188292` — use canonical hardened room creation in Solo flow.

### Checks
- Baseline `bb5adee3...`: CI success; Game QA failure at `Solo AI browser E2E`.
- Post-change exact-SHA checks for `5b95775e67034528c66b299288d33c31e7188292` at final inspection:
  - CI run 34730830821: `queued`.
  - Game QA run 34730830780: `queued`.
- Therefore this session does **not** claim the browser check is Green or deploy-safe yet.

### Newly discovered bugs / risks
- Confirmed product-path drift: Solo room creation bypassed the canonical hardened create-room helper and still targeted `create_room_v3` directly.
- The exact downstream Playwright assertion that failed previously remains unexposed by the connected GitHub logs surface; the next exact-SHA run must determine whether this contract drift was the complete browser failure or whether a second failure remains.
- `Promise.all` is still used to add the three AI players after room creation. No evidence currently proves that concurrency is faulty; do not change it unless the next run exposes a related failure.
- Browser/live Production evidence remains weaker than local evidence until an authorized guarded exact-SHA release can run.

### Deploy safety
Not deploy-safe from this session because exact-SHA CI/Game QA for `5b95775e67034528c66b299288d33c31e7188292` have not completed. No Production deploy, restore, migration, DB write, or provider mutation was performed.

### Roadmap impact
This session remains inside the same browser/full-game confidence objective. It fixes a real Solo path contract drift rather than adding new gameplay. LLM discussion, 11–15 expansion, and unrelated launch polish remain deferred.

## Prior handoff
Session 67 bounded failure diagnostics so browser teardown could not mask the primary Playwright failure. Its resulting `main` still had CI Green but Game QA failing specifically at `Solo AI browser E2E`.

## Exact next-session priority
Resolve exact-SHA CI/Game QA for `5b95775e67034528c66b299288d33c31e7188292` first. If `Solo AI browser E2E` fails again, fix the first newly evidenced assertion/navigation/product failure only, without weakening coverage or starting new scope. If both checks are Green and authorized exact-SHA Vercel release dispatch is available, execute one guarded release plus live smoke/playtest covering create/Solo, AI discussion, elimination, refresh/reconnect, voting, and winner. If dispatch is still unavailable, perform one bounded launch-readiness hardening objective driven by combined browser/RPC evidence; do not add LLM discussion or expand to 11–15 without new evidence.
