# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

## الهدف والقواعد الثابتة
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو هوية اللاعب الظاهرة؛ caseRole وصف وليس اسم شخصية بديلة.
- gender للصياغة فقط، ولا يؤثر على mafia assignment أو الفوز.
- Boss لاعب كامل ويحتفظ بإدارة اللعبة بعد elimination.
- bug مهم → regression عندما يكون عمليًا؛ ممنوع إضعاف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد كامل؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## P0 / Core status
- [x] vote gating + server-authoritative `phase/canVote` + UI guard.
- [x] reconnect: before/after cast → tie reset → resolve → next round.
- [x] eliminated Boss admin controls + eliminated-player vote rejection.
- [x] deterministic + local Supabase full-game RPC coverage لـ4–10 لاعبين.
- [ ] Production DB parity blocked لأن Production Supabase كان `INACTIVE`; لا write/migration قبل read-only parity + smoke plan أو تصريح restore صريح.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity.
- [x] gender-aware `install_case` بعد player shuffle، بدون تغيير mafia selection.
- [x] AI generator + shared TypeScript contract للـsemantic role/bio + male/female variants.
- [x] curated presets 4–10 تستخدم semantic roles + gender-aware wording.
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`؛ تم إصلاح defectين في `garden-locker` و`midnight-menu`.
- [x] server preset/AI-reference path يستخدم shared `lib/server-stories` registry بدل duplicate `CASES` داخل `api/case-start.ts`.
- [x] legacy identity audit موثق في `docs/qa/LEGACY-IDENTITY-COMPATIBILITY-AUDIT.md`: `character_name` compatibility-only، و`character_bio` ما زال runtime-required حتى replacement contract صريح؛ لا destructive migration قبل Production parity/data evidence.

## Current curated library
- 4: `last-tray`, `balcony-key`.
- 5: `clock-1117`, `room-312`.
- 6: `last-rehearsal`, `blue-notebook`.
- 7: `fourth-floor`, `silent-auction`.
- 8: `rooftop-envelope`, `backstage-pass`.
- 9: `gallery-ledger`, `garden-locker`.
- 10: `midnight-menu`, `archive-seal`.
- 11–12: AI-only؛ لا curated support معلن.
- 13–15: غير مستهدفة حاليًا؛ لا توسع بدون gameplay/UX evidence.

## QA coverage
- vote/gender/join/player-card/generated-case contracts.
- legacy identity compatibility contract: characterName لا يظهر كهوية، characterBio يظل install/snapshot/UI-required، وnickname/caseRole هما canonical identity semantics.
- caseRole + gender-aware install E2E.
- story critic + machine-readable lexical fairness baseline + curated identity integrity guard.
- story critic يوقع QA لو pre-final clue ذكر mafia role(s) فقط بلا explicit non-mafia alternative، أو final clue لم يرجّع كل mafia roles لسلسلة الأدلة.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، catalog/shared-registry/API/Expo path contract، no duplicate API registry، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10.
- eliminated Boss admin E2E + six-player tie/reconnect regression ضمن suite.
- same-room rematch E2E مضاف في Session 27 ويغطي finish → Boss-only reset → lobby state cleanup → preserved players → fresh second case؛ نتيجة CI ما زالت pending وقت handoff.

## Recent milestones
- Session 18 — Story Quality Baseline: `f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; Green.
- Session 19 — Rewrite/Migrate six presets: `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; Green.
- Session 20 — Curated 4–7 coverage: `b34067d54f4febb7a0dedab74e20d38fc8c9cf08`; Green.
- Session 21 — Curated 8–10 expansion: `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`; Green.
- Session 22 — Checkpoint/Planning: `226322c62e1a5db421c47a5912f31d16707be72e`; Green.
- Session 23 — Deep Curated Story Fairness Review: `a206c06d797827c2830e025c3e28d3427a64d064`; Green.
- Session 24 — Single Source of Truth for Curated Registry; runtime refactor Green after Session 25 repaired one stale QA shape assertion.
- Session 25 — QA repair: `70efab2a87a9ba27b3548845e7748ee0d8db5d21`; `validate` ✅ and `qa` ✅.
- Session 26 — Legacy DB Identity Compatibility Audit: code/QA commit `28fe8870accaa1f33a6a17c11cb56d393a65e1eb`; `validate` ✅ and `qa` ✅.

## Session 27 — 2026-09-11 — Same-room Rematch
### Session type
Delivery — exactly one New Gameplay Feature vertical slice: let a finished group play a fresh case in the same room without rejoining. No second feature or destructive identity cleanup started.

### Starting evidence
- Mandatory read order completed from default branch: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest main at start: `5b162d9e5f0fc775633210220796b016862bdd1b`.
- Prerequisite `28fe8870accaa1f33a6a17c11cb56d393a65e1eb`: `validate` completed/success and `qa` completed/success.
- Repository product evidence in `README.md` lists discussion timer, QR join, then "Rematch in the same room". Timer + QR were already implemented in current code, while finished-room UI only displayed the winner/solution and had no next-game action.

### Exact objective
Implement **Rematch in the same room** end-to-end while preserving real player identity/membership and guaranteeing no per-case state leaks into the next game.

### Reproduction / design finding
- A finished room was terminal from the product UI even though the same group commonly wants another case.
- Reusing the same room is safe only if every case-scoped object is reset atomically: votes, eliminations, secret roles, rounds, case secret, character/case role text, winner/solution, timer, and elimination state.
- Player rows themselves must remain so nickname/gender/user identity and room membership survive; `install_case` already re-randomizes player→character/mafia assignment for the next case.

### Code / database / UI changes
- Added migration `supabase/migrations/20260911123500_rematch_same_room.sql` with `reset_room_for_rematch(text)`:
  - Boss-only and only when room status is `finished`.
  - deletes votes, eliminations, player_roles, rounds, case_secrets.
  - clears `character_name`, `character_bio`, `case_role`, and `is_eliminated` while retaining player rows.
  - resets room to lobby: title/premise/round/winner/solution/timer state cleared.
  - emits `room_rematched` so connected clients refresh through existing realtime flow.
- Added `rematchRoom()` to `lib/game.ts`.
- Finished-room UI now gives the Boss a clear "العبوا قضية جديدة بنفس الروم" action; non-host players are told the Boss can reopen the same room.
- Client resets local role/vote reveal state on rematch and then uses the existing lobby/start-case path.

### Regression / E2E
- Added `scripts/qa/rematch-e2e.mjs` and wired it into Game QA.
- E2E creates a 4-player room, installs/finishes case 1, proves non-host reset is rejected, performs Boss reset, verifies preserved player ids/nicknames plus complete old-case cleanup, then installs case 2 and verifies every preserved player gets a fresh role/story assignment.

### Commits
- `55538c0705f2c855d7acedd0c9cbe9420a8013ad` — `feat: add safe same-room rematch RPC`.
- `bf2942f8c2efb41217f7e08d35dba87e916aea08` — `feat: expose same-room rematch action`.
- `40ce808e22f379825a4efd324a0105fd041108f5` — `feat: let Boss rematch in the same room`.
- `5060ecd7f0c41a86fb70b92f8f57ec4baa4ec803` — `qa: cover same-room rematch end to end`.
- `51183f896368d0a568dd22b569c4c5a520811269` — `qa: run same-room rematch E2E`.

### Checks / evidence at handoff
- Checks for `51183f896368d0a568dd22b569c4c5a520811269` were created successfully.
- At last inspection: `validate` in progress; `qa` in progress. Game QA had started dependency installation; no failing step was available yet.
- Because the relevant CI + the new local Supabase rematch E2E have not completed yet, Session 27 is **not deploy-safe**.

### Newly discovered bugs / risks
- Production DB parity remains blocked independently. The new RPC is a migration and must not be applied to Production while that blocker remains or before this session's full E2E is Green and deploy-safe is explicitly recorded.
- Rematch intentionally retains room settings (`max_players`, difficulty, theme, case mode/template) and existing members. Changing settings/roster between matches is a separate product decision and was not added to this objective.
- Existing `README.md` roadmap is partially stale because timer and QR are already implemented; that documentation cleanup is not required to make rematch function and should be handled as ordinary docs polish, not mixed into this feature session.

### Deploy-safety status
**Not deploy-safe yet.** No production deployment, restore, migration, or production-data write occurred.

### Roadmap impact
This is the first bounded Milestone E gameplay/product feature after Core + Identity/Story + Story Quality + Curated Library foundations. The safety gate remains the existing full-game suite plus the new rematch E2E.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review for all 14 curated cases.
- [x] Remove duplicated server/API curated registry.
- [x] Legacy DB identity compatibility audit + regression guard; Session 26 prerequisite Green.
- [ ] Session 27 same-room rematch checks Green on `51183f896368d0a568dd22b569c4c5a520811269` (pending at handoff).
- [ ] Production parity remains separately blocked.
- [ ] Future destructive identity cleanup only after read-only Production parity/data evidence; `character_bio` additionally requires a replacement contract first.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص `validate` و`qa` لـ`51183f896368d0a568dd22b569c4c5a520811269` أولًا. لو failure حقيقي ظهر، أصلح أول failure فقط. لو الاتنين Green: اعمل **Checkpoint/Planning session فقط** لأن آخر checkpoint كان Session 22 وتلاه Sessions 23–27؛ راجع full-game/rematch evidence، Production blocker، story/library status، technical debt، وأعلى 3–4 milestones/features التالية قبل أي implementation جديد.
