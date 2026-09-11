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
- Final checks for `70efab2a...`: `validate` ✅ and `qa` ✅.

### Newly discovered risks
- This failure shows structural regex contracts can drift when safe internal DTO shapes change. Keep assertions focused on semantic guarantees where possible while still catching identity regressions.
- Production DB parity remains independently blocked and untouched.

### Roadmap impact
No roadmap expansion. The session repaired the QA gate created by the shared-registry refactor.

## Session 26 — 2026-09-11 — Legacy DB Identity Compatibility Audit
### Session type
Delivery/audit — exactly one objective: classify and harden the `character_name` / `character_bio` compatibility boundary end-to-end. No New Gameplay Feature was started.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Latest main at start: `09fcd75de660876b23d915330224ef9ef6623328`.
- Prerequisite `70efab2a87a9ba27b3548845e7748ee0d8db5d21`: `validate` completed/success and `qa` completed/success.
- Initial schema still has nullable `players.character_name` and `players.character_bio`.
- Current `room_snapshot` still exposes both as `characterName` / `characterBio`.
- Current gender-aware `install_case` writes optional legacy `name` to `character_name`, writes resolved gender-aware bio to `character_bio`, and writes semantic role to `case_role`.
- PlayerCard renders `nickname` and descriptive `characterBio`, but deliberately does not render `characterName`.

### Reproduction / design finding
- `character_name`: **compatibility-only**. Current identity UX does not need it; legacy snapshots/types preserve it for old persisted rooms/data. Destructive removal is not safe while Production parity/data contents are unknown.
- `character_bio`: **runtime-required**. It is populated by the current install RPC, returned by snapshot, typed in `PlayerState`, and displayed in PlayerCard. It cannot be removed without a replacement schema/RPC/snapshot/UI contract.
- Canonical identity remains `nickname`; `case_role` is semantic story role; gender remains wording-only.

### Changes
- Added `docs/qa/LEGACY-IDENTITY-COMPATIBILITY-AUDIT.md` with usage classification and migration-safe recommendation.
- Added `scripts/qa/legacy-identity-contract.mjs` to guard the compatibility boundary.
- Wired the new contract into Game QA immediately after the PlayerCard identity guard.
- No DB migration, runtime gameplay behavior, story content, mafia logic, production service, or production data was changed.

### Commits
- `034eebfccb7574009aa221156eed151bc39e0aeb` — legacy identity compatibility regression guard.
- `0db3aec9e8945cd92fafcc3144eb9336139d39a6` — compatibility audit artifact.
- `28fe8870accaa1f33a6a17c11cb56d393a65e1eb` — run the new contract in Game QA.

### Checks / evidence
- Checks on `28fe8870...` were created successfully; at last inspection both `validate` and `qa` were queued, with no failure available yet.
- Session 26 is **not deploy-safe yet** until the relevant checks close Green.

### Newly discovered risks
- `character_name` is dead for current visible identity but still externally observable through snapshot/type compatibility; deleting it without production data evidence could break old rooms or unknown clients.
- `character_bio` has a misleading legacy name but remains active product data. A future cleanup should introduce a deliberately named replacement end-to-end before considering column removal.
- Production DB parity remains blocked independently; no destructive recommendation should advance until read-only parity/data inspection is possible.

### Deploy-safety status
Not deploy-safe yet: checks for the audit/guard commit are still pending. No production deployment or migration occurred.

### Roadmap impact
Technical Drift Cleanup is now evidence-backed rather than ambiguous. The identity contract itself is stable; remaining destructive cleanup is gated by Production parity and is not a reason to delay product work once this session is Green.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review for all 14 curated cases.
- [x] Remove duplicated server/API curated registry.
- [x] Session 25 repair Green on `70efab2a87a9ba27b3548845e7748ee0d8db5d21`.
- [x] Legacy DB identity compatibility audit + migration-safe recommendation + regression guard.
- [ ] Session 26 checks Green on `28fe8870accaa1f33a6a17c11cb56d393a65e1eb`.
- [ ] Then begin one clear New Gameplay Feature end-to-end, selected from repository/product evidence rather than speculative scope.
- [ ] Production parity remains separately blocked.
- [ ] Future destructive identity cleanup only after read-only Production parity/data evidence; `character_bio` additionally requires a replacement contract first.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص checks لـ`28fe8870accaa1f33a6a17c11cb56d393a65e1eb` أولًا. لو failure حقيقي ظهر، أصلح أول failure فقط. لو `validate` و`qa` Green: ابدأ **New Gameplay Feature واحد end-to-end** فقط، لكن اختَر الـfeature من أعلى قيمة مثبتة في repository evidence الحالية، وحافظ على full-game suite كحاجز أمان. لا تعمل destructive identity migration طالما Production parity محجوبة.
