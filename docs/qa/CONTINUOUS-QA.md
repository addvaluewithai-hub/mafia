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
- [x] Session 21 code `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`: `validate` ✅ و`qa` ✅.
- [x] Checkpoint 22 `226322c62e1a5db421c47a5912f31d16707be72e`: `validate` ✅ و`qa` ✅.
- [ ] Production DB parity blocked لأن Production Supabase كان `INACTIVE`; لا write/migration قبل read-only parity + smoke plan أو تصريح restore صريح.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity.
- [x] gender-aware `install_case` بعد player shuffle، بدون تغيير mafia selection.
- [x] AI generator + shared TypeScript contract للـsemantic role/bio + male/female variants.
- [x] curated presets 4–10 تستخدم semantic roles + gender-aware wording.
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`; تم إصلاح defectين في `garden-locker` و`midnight-menu`.
- [x] server preset/AI-reference path يستخدم الآن shared `lib/server-stories` registry بدل duplicate `CASES` داخل `api/case-start.ts`.
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
- Session 23 — Deep Curated Story Fairness Review: `a206c06d797827c2830e025c3e28d3427a64d064`; `validate` ✅ و`qa` ✅. Human review artifact محفوظ، مع fixes في `garden-locker` و`midnight-menu` وdeterministic fairness regression.

## Session 24 — 2026-09-11 — Single Source of Truth for Curated Registry
### Session type
Delivery — vertical slice واحد: إزالة duplicated curated registry من server API، جعل registry المشتركة قابلة للاستخدام في Expo/server runtimes، وتقوية contract regression ضد عودة drift.

### Starting evidence
- قُرئ `AGENTS.md` → `QA-OPERATING-MODE.md` → هذا handoff من default branch.
- main عند البداية كان `31d58081b4a18f66e4a3e4a025c646d2962e2e75`.
- prerequisite Session 23 code/docs على `a206c06d797827c2830e025c3e28d3427a64d064`: CI workflow وGame QA كلاهما completed/success.
- لا P0 جديد؛ الأولوية الصحيحة حسب handoff كانت technical drift cleanup للcurated registry.

### Design finding
كان عندنا registry كاملة في `lib/server-stories/index.ts` ونسخة ثانية مستقلة `CASES` داخل `api/case-start.ts` مع 14 import منفصل. هذا يجعل إضافة/تعديل curated case قابلة للانحراف بين Expo/server API رغم وجود contract يفحص النسختين.

### Changes
1. `lib/server-stories/index.ts`
   - imports أصبحت relative بدل `@/` حتى تكون portable للـExpo/server TypeScript paths.
   - `CURATED_CASES` بقي المصدر الوحيد لربط id → playerCount → case.
   - أضيف `CuratedCaseId` مع الحفاظ على `getCuratedCase` و`referenceCasesFor`.
2. `api/case-start.ts`
   - حذف الـ14 story imports والـ`CASES` duplicate registry بالكامل.
   - preset lookup يمر عبر `getCuratedCase`.
   - AI reference examples تمر عبر `referenceCasesFor(playerCount)` وبالتالي exact-count behavior يأتي من نفس المصدر.
   - mafia count، validation، generation/install behavior لم تتغير دلاليًا.
3. `scripts/qa/curated-player-count-contract.mjs`
   - ما زال يفرض قصتين لكل count من 4–10 وعدم إعلان 11–12.
   - يفرض أن API يستورد shared registry ويستخدم `getCuratedCase` و`referenceCasesFor`.
   - يفشل لو رجع `const CASES = {` داخل server API.
   - يحافظ على Expo player-count-aware selection وعدم fallback لأعداد غير مرتبطة.

### Commits
- `acdf4833c0c0a700767cf5b321e15ec380ba3a1c` — make shared curated registry portable across runtimes.
- `8f3ddcfc1b24537f906c45d4ad1ca05bdc8b8324` — use shared curated registry in server API.
- `d29c6e2fdccb8f455210526178c57610da69df52` — guard shared registry across Expo/server paths.

### Checks / evidence
- Session 23 prerequisite `a206c06d...`: CI ✅ وGame QA ✅.
- checks على `d29c6e2f...` بدأت: CI queued وGame QA in_progress عند آخر فحص؛ لا failure ظاهر وقت الإغلاق.
- لذلك Session 24 **ليست deploy-safe بعد** حتى تقفل `validate`/Game QA Green.

### Newly discovered risks
- `lib/story-catalog.ts` ما زال metadata catalog منفصلًا عن runtime case registry؛ contract يثبت sync للأعداد والids، لكنه ليس runtime duplicate للcase payload. يمكن دمجه لاحقًا فقط لو ظهر drift فعلي؛ لا نوسع scope الآن.
- Production parity blocker مستقل ولم يُلمس.

### Roadmap impact
Technical drift بين server preset path والshared curated payload registry أُزيل. بعد Green، أعلى debt متبقٍ قبل New Features هو legacy DB identity compatibility audit.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable في deterministic + local RPC suites.
- [x] Identity/story contract stable للruntime الحالي.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review للـ14 curated cases + regression hardening.
- [x] Session 23 full CI Green.
- [x] Remove duplicated server/API curated registry — implementation complete; awaiting Session 24 CI.
- [ ] Session 24 full CI/Game QA Green.
- [ ] Legacy DB identity compatibility audit (`character_name`/`character_bio`) + migration-safe recommendation; لا حذف في نفس audit إلا لو evidence يثبت أنه آمن ومطلوب.
- [ ] بعدها New Gameplay Feature milestone يبدأ feature واحدة ذات قيمة واضحة end-to-end.
- [ ] Production parity remains separately blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
أولًا افحص checks لـ`d29c6e2fdccb8f455210526178c57610da69df52`. لو failure حقيقي سببه shared-registry refactor، أصلح أول failure فقط مع regression مناسب. لو CI/Game QA Green: نفّذ **Legacy DB Identity Compatibility Audit** كـvertical slice واحد — تتبع `character_name`/`character_bio` عبر migrations/RPC snapshots/types/UI/tests، صنّف كل usage إلى runtime-required أو compatibility-only أو dead، واخرج migration-safe recommendation + regression/cleanup الضروري فقط. لا تبدأ New Gameplay Feature في نفس الجلسة.
