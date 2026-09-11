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
- [x] same-room rematch E2E Green: finish → Boss-only reset → preserved players → clean lobby → fresh second case.
- [ ] Production DB parity blocked: Supabase project `bwxgzcppxdrfcaorobpm` was rechecked read-only in Session 28 and is still `INACTIVE`; no restore/write/migration بدون تصريح صريح، وبعد restore المطلوب أولًا read-only schema/RPC/migration parity + smoke plan.

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
- same-room rematch E2E Green ويغطي finish → Boss-only reset → lobby state cleanup → preserved players → fresh second case.
- Known QA/docs drift: اسم خطوة `Full-game RPC E2E (4/5/6/7 players)` في `.github/workflows/game-qa.yml` قديم رغم أن script يغطي 4–10؛ cleanup مطلوب لكن ليس product blocker.

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
- Session 27 — Same-room Rematch: code/QA commit `51183f896368d0a568dd22b569c4c5a520811269`; `validate` ✅ and `qa` ✅. Handoff commit `d33dadd40ddd81f2d4174108a534e9b96bfdc8ec` also `validate` ✅ and `qa` ✅.

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
- Finished-room UI gives the Boss a clear "العبوا قضية جديدة بنفس الروم" action; non-host players are told the Boss can reopen the same room.
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

### Checks / evidence
- `51183f896368d0a568dd22b569c4c5a520811269`: `validate` completed/success and `qa` completed/success on 2026-09-11.
- Handoff commit `d33dadd40ddd81f2d4174108a534e9b96bfdc8ec`: `validate` completed/success and `qa` completed/success.
- The new local Supabase rematch E2E is therefore inside the Green Game QA gate.

### Newly discovered bugs / risks
- Production DB parity remains blocked independently. The new RPC is a migration and must not be applied to Production while that blocker remains or before a read-only parity/smoke plan.
- Rematch intentionally retains room settings (`max_players`, difficulty, theme, case mode/template) and existing members. Changing settings/roster between matches is a separate product decision and was not added to this objective.
- Existing `README.md` roadmap is partially stale because timer, QR, and now rematch are already implemented.

### Deploy-safety status
**Locally/CI deploy-gate Green, but Production deployment remains blocked by unknown Production DB parity / inactive Production Supabase.** No production deployment, restore, migration, or production-data write occurred.

### Roadmap impact
This is the first bounded Milestone E gameplay/product feature after Core + Identity/Story + Story Quality + Curated Library foundations. The safety gate remains the existing full-game suite plus rematch E2E.

## Session 28 — 2026-09-11 — Checkpoint / Planning after Rematch
### Session type
Checkpoint/Planning only. No gameplay/product feature, schema change, migration, or production mutation was implemented.

### Starting evidence
- Mandatory read order completed from default branch: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- `main` at start: `d33dadd40ddd81f2d4174108a534e9b96bfdc8ec` (`docs: hand off same-room rematch session`).
- Prerequisite code/QA commit `51183f896368d0a568dd22b569c4c5a520811269`: `validate` ✅ and `qa` ✅.
- Latest handoff commit `d33dadd40ddd81f2d4174108a534e9b96bfdc8ec`: `validate` ✅ and `qa` ✅.
- Checkpoint is due: last checkpoint was Session 22, followed by Sessions 23–27 (five implementation/repair/delivery sessions), and Milestone E has now started.

### Exact objective
Audit what is genuinely Green after rematch, what remains risky or blocked, and set the next 3–4 substantial objectives without starting another implementation slice.

### Audit / design findings
- **Core/full-game:** no known P0 deadlock is open. Deterministic coverage remains 140 complete games across 4–10, with local RPC E2E across 4–10 plus tie/reconnect, eliminated Boss admin behavior, identity/story install, and now same-room rematch.
- **Rematch:** fully Green in CI/QA; no evidence of a current regression after Session 27.
- **Identity/story:** current runtime contract is stable. Destructive `character_name` cleanup remains intentionally deferred; `character_bio` is still runtime-required.
- **Story/library:** 14 curated cases cover exactly 4–10 (two per count), all went through semantic fairness review plus automated lexical/identity/player-count guards. There is no quality evidence justifying 11–15 expansion yet.
- **Production/DB:** read-only project status was rechecked in this checkpoint; Supabase project `bwxgzcppxdrfcaorobpm` (`mafia`) is still `INACTIVE`. Therefore production schema/RPC/data parity cannot be proven safely now. Best next action remains: explicit restore authorization first, then read-only parity + smoke plan before any production migration/deploy. No restore was attempted.
- **Technical debt:** `README.md` "Next" is stale (timer, QR, rematch already exist). `.github/workflows/game-qa.yml` still labels the full-game RPC step as `4/5/6/7 players` even though the current suite covers 4–10. These are documentation/label drift, not gameplay blockers.
- **Product direction:** current create flow already has a theme field for AI cases and a curated selector by player count, while README's next unimplemented product direction is case packs/custom themes. That is a stronger coherent next product slice than adding more player counts or superficial animation-only polish.

### Code / database / test / doc changes
- No runtime code, schema, migration, story, or test behavior changed in this checkpoint.
- This handoff was updated to close Session 27 as Green, record the still-inactive Production DB blocker, document QA/docs drift, and set the next ordered objectives.

### Checks / evidence
- `51183f896368d0a568dd22b569c4c5a520811269`: `validate` ✅, `qa` ✅.
- `d33dadd40ddd81f2d4174108a534e9b96bfdc8ec`: `validate` ✅, `qa` ✅.
- No failing check tied to an active objective was found at checkpoint start.

### Newly discovered bugs / risks
- No new P0/P1 gameplay bug was found from current evidence.
- Production remains the main release blocker because DB parity is unknowable while the project is inactive.
- README/workflow labels can mislead future operators about what is already shipped/tested if left stale.
- A future case-pack/custom-theme feature must preserve exact-count curated fairness and must not turn theme choice into hidden mafia-assignment bias.

### Deploy-safety status
No production deploy, restore, migration, or data write occurred. Current `main` is Green in CI/QA, but **Production deployment is not considered safe while Production Supabase parity remains unverified/inactive**.

### Roadmap impact — next 4 substantial objectives
1. **Curated Case Packs / Theme Browsing end-to-end**: add explicit pack/theme metadata to the shared curated source of truth, expose a player-count-safe browse/filter UX, keep exact-count fairness, and add catalog/API/UI regression coverage. Do not change mafia assignment semantics.
2. **Production parity + smoke-readiness gate once restore is explicitly authorized**: after Production Supabase is available, perform read-only migration/schema/RPC/version parity, identify drift, define a bounded smoke plan, and only then decide whether any migration/deploy can be marked deploy-safe.
3. **Abuse / public-launch protection vertical slice**: rate-limit or otherwise bound room creation/join/generation abuse using server-authoritative controls appropriate to the deployed architecture, with regressions that do not break normal multiplayer flows.
4. **Polish/launch readiness pass**: clean stale README/QA labels, tighten error/observability paths, then add focused audiovisual/haptic polish only where it improves gameplay clarity rather than hiding state.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review for all 14 curated cases.
- [x] Remove duplicated server/API curated registry.
- [x] Legacy DB identity compatibility audit + regression guard; Session 26 prerequisite Green.
- [x] Session 27 same-room rematch: `validate` ✅ and `qa` ✅ including rematch E2E.
- [ ] Curated case packs / theme browsing feature.
- [ ] Production parity remains blocked while Supabase project is `INACTIVE`.
- [ ] Future destructive identity cleanup only after read-only Production parity/data evidence; `character_bio` additionally requires a replacement contract first.
- [ ] Abuse/public-launch protection.
- [ ] Polish/observability/docs drift cleanup.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
إذا ظل `main` Green ولم يظهر P0 جديد: نفّذ **Curated Case Packs / Theme Browsing end-to-end** كـvertical slice واحد فقط، باستخدام shared curated registry كمصدر الحقيقة، مع pack/theme metadata + player-count-safe filtering/browsing + API/UI/contracts/tests/docs. لا توسّع 11–15، ولا تغيّر mafia assignment أو gender fairness، ولا تبدأ Production restore/migration داخل نفس الجلسة.
