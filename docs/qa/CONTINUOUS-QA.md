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
- [ ] legacy DB/snapshot `character_name`/`character_bio` compatibility debt لم يُحسم بعد؛ لا حذف بدون audit وmigration-safe plan.

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
- caseRole + gender-aware install E2E.
- story critic + machine-readable lexical fairness baseline + curated identity integrity guard.
- story critic يوقع QA لو pre-final clue ذكر mafia role(s) فقط بلا explicit non-mafia alternative، أو final clue لم يرجّع كل mafia roles لسلسلة الأدلة.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، catalog/shared-registry/API/Expo path contract، no duplicate API registry، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10.
- eliminated Boss admin E2E + six-player tie/reconnect regression ضمن suite.

## Recent milestones
- Session 18 — Story Quality Baseline: `f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; Green.
- Session 19 — Rewrite/Migrate six presets: `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; Green.
- Session 20 — Curated 4–7 coverage: `b34067d54f4febb7a0dedab74e20d38fc8c9cf08`; Green.
- Session 21 — Curated 8–10 expansion: `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`; Green.
- Session 22 — Checkpoint/Planning: `226322c62e1a5db421c47a5912f31d16707be72e`; Green.
- Session 23 — Deep Curated Story Fairness Review: `a206c06d797827c2830e025c3e28d3427a64d064`; `validate` ✅ و`qa` ✅.

## Session 24 — Single Source of Truth for Curated Registry
Delivery slice أزال duplicated `CASES` registry من `api/case-start.ts`، وجعل `lib/server-stories` المصدر الوحيد للpreset lookup وAI reference selection.

Commits:
- `acdf4833c0c0a700767cf5b321e15ec380ba3a1c` — portable shared registry.
- `8f3ddcfc1b24537f906c45d4ad1ca05bdc8b8324` — server API uses shared registry.
- `d29c6e2fdccb8f455210526178c57610da69df52` — registry drift regression guard.

Final check result discovered in the next session:
- CI on `d29c6e2f...`: ✅ success.
- Game QA on `d29c6e2f...`: ❌ failed at `Generated case role identity contract` before curated/full-game steps ran.
- Failure was not runtime behavior: the contract still expected the pre-refactor wrapper shape `item.case.characters`, while `referenceCasesFor()` now intentionally returns reference DTOs with `item.characters`.

## Session 25 — 2026-09-11 — Repair Session 24 QA regression
### Session type
Delivery/repair — exactly one objective: resolve the first real failing check from Session 24. No legacy identity audit or new feature work started.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Latest main at start: `e067f837094e3b217cf29094230405022130faf5`.
- Actions for `d29c6e2fdccb8f455210526178c57610da69df52`: CI completed/success; Game QA completed/failure.
- Failed step: `Generated case role identity contract`.
- Exact assertion expected `characters: item.case.characters.map(...)`, but the refactor intentionally made `referenceCasesFor()` return `{ id, playerCount, title, premise, characters, rounds, solution }`, so the real server prompt now correctly uses `item.characters.map(...)`.

### Fix
Updated `scripts/qa/generated-case-role-contract.mjs` without weakening the underlying identity protection:
- contract now asserts the current shared-reference DTO shape: `characters: item.characters.map((character) => ({ bio: character.bio }))`.
- retained the key guarantee that AI reference payload strips identity fields before prompting.
- added an explicit negative assertion preventing `name:` from being reintroduced into the mapped reference characters.
- no production/runtime code, mafia logic, generation schema, story content, database code, or gameplay behavior changed.

### Commit
- `70efab2a87a9ba27b3548845e7748ee0d8db5d21` — `qa: align generated-case reference guard with shared registry`.

### Checks / evidence
- Previous `d29c6e2f...`: CI ✅; Game QA ❌ at generated-case contract.
- New checks for `70efab2a...` started successfully: CI `in_progress`, Game QA `in_progress` at last inspection; no new failure visible yet.
- Session 25 is **not deploy-safe yet** because the relevant full Game QA has not closed Green.

### Newly discovered risks
- This failure shows structural regex contracts can drift when safe internal DTO shapes change. Keep assertions focused on semantic guarantees where possible while still catching identity regressions.
- Production DB parity remains independently blocked and untouched.

### Roadmap impact
No roadmap expansion. The session repaired the QA gate created by the shared-registry refactor. Legacy DB identity compatibility remains the next planned technical debt slice only after this repair closes Green.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review for all 14 curated cases.
- [x] Remove duplicated server/API curated registry.
- [ ] Session 25 repair full CI/Game QA Green on `70efab2a87a9ba27b3548845e7748ee0d8db5d21`.
- [ ] Legacy DB identity compatibility audit (`character_name`/`character_bio`) + migration-safe recommendation; no deletion in the audit unless evidence proves it safe and required.
- [ ] Then begin one clear New Gameplay Feature end-to-end.
- [ ] Production parity remains separately blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص checks لـ`70efab2a87a9ba27b3548845e7748ee0d8db5d21` أولًا. لو failure حقيقي باقٍ، أصلح أول failure فقط مع regression مناسب. لو CI/Game QA Green: نفّذ **Legacy DB Identity Compatibility Audit** كـvertical slice واحد — تتبع `character_name`/`character_bio` عبر migrations/RPC snapshots/types/UI/tests، صنّف كل usage إلى runtime-required أو compatibility-only أو dead، واخرج migration-safe recommendation + regression/cleanup الضروري فقط. لا تبدأ New Gameplay Feature في نفس الجلسة.
