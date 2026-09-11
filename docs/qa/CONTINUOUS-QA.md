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
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`؛ تم إصلاح defectين حقيقيين في `garden-locker` و`midnight-menu`.
- [ ] legacy DB/snapshot `character_name`/`character_bio` compatibility debt لم يُحسم بعد؛ لا حذف بدون audit ومmigration-safe plan.

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
- story critic الآن يوقع QA لو pre-final clue ذكر mafia role(s) فقط بلا explicit non-mafia alternative، أو final clue لم يرجّع كل mafia roles لسلسلة الأدلة.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، catalog/server/API sync، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10.
- eliminated Boss admin E2E + six-player tie/reconnect regression ضمن suite.

## Recent sessions
- Session 18 — Story Quality Baseline: `f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; `validate` ✅ `qa` ✅.
- Session 19 — Rewrite/Migrate six presets: `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; `validate` ✅ `qa` ✅.
- Session 20 — Curated 4–7 coverage: `b34067d54f4febb7a0dedab74e20d38fc8c9cf08`; `validate` ✅ `qa` ✅.
- Session 21 — Curated 8–10 expansion: `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`; `validate` ✅ `qa` ✅.
- Session 22 — Checkpoint/Planning: `226322c62e1a5db421c47a5912f31d16707be72e`; `validate` ✅ `qa` ✅.

## Session 23 — 2026-09-11 — Deep Curated Story Fairness Review
### Session type
Delivery — vertical slice واحد: semantic review للـ14 curated cases + content fixes للعيوب الحقيقية + deterministic regression hardening + durable review artifact.

### Starting evidence
- قُرئ `AGENTS.md` → `QA-OPERATING-MODE.md` → هذا handoff من default branch.
- main عند البداية كان `226322c62e1a5db421c47a5912f31d16707be72e`.
- Checkpoint 22 prerequisite: `validate` ✅ و`qa` ✅.
- لا P0 جديد ظهر؛ الأولوية الصحيحة كانت Story Quality Hardening حسب checkpoint.

### Semantic review result
تمت مراجعة كل 14 قصة يدويًا على: early reveal، plausible alternatives، clue escalation، motive/action/evidence coherence، multi-mafia independence، وطبيعية المصري. artifact كامل: `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.

النتيجة:
- 12 قصة PASS بدون تغيير محتوى.
- `garden-locker`: وجدنا gap حقيقي؛ الجريمة تشمل العبث بسجل المفاتيح لكن الدليل النهائي لم يكن يربط التعديل بفاعل محدد. تم ربط تعديل السجل بـ`إدارة النادي` في final evidence والsolution.
- `midnight-menu`: وجدنا gap حقيقي؛ `الحسابات` كان mafia مسؤولًا عن تبديل ورقة الحجز لكن bio/evidence كانا يركزان على هامش المنيو أكثر من الحجز. تم تقوية الدافع، إضافة purple-mark shared red herring، إبقاء alternatives في round 3، وربط ورقة الحجز بملف الحسابات فقط في final clue.
- mafia indexes/counts لم تتغير في أي قصة.

### Regression hardening
`scripts/qa/story-critic.mjs` أصبح يفرض deterministic fairness guard:
1. pre-final clue لا يجوز أن يذكر mafia role(s) فقط من غير explicit non-mafia role alternative.
2. final clue لازم يعيد ربط كل mafia role بالأدلة.
3. التقارير machine-readable تسجل `preFinalOnlyMafiaWarnings` و`finalMafiaRolesMissing`.

هذا guard مقصود يكون أضيق من الحكم semantic؛ لا يدعي إن lexical mentions وحدها تثبت guilt، لكنه يمنع regression هيكلي واضح.

### Commits
- `0282428ca82fd8bcd430ad4595c2cfb6960d375c` — close `garden-locker` log-tamper evidence gap.
- `5f704784e5bd4979b51bfe30c126da8967d0d683` — strengthen `midnight-menu` reservation motive/evidence chain.
- `3e1464d8e3606f7d35ce44ac4e1a1944deab73cd` — enforce pre-final ambiguity/final-mafia coverage in story critic.
- `a206c06d797827c2830e025c3e28d3427a64d064` — durable semantic fairness review artifact.

### Checks / evidence
- prerequisite `226322c...`: `validate` ✅ و`qa` ✅.
- checks على `a206c06d...` بدأت: `validate` in_progress و`qa` in_progress عند آخر فحص، ولا يوجد failure ظاهر حتى الآن.
- لذلك Session 23 **ليست deploy-safe بعد** حتى تقفل checks Green.

### Newly discovered risks
- deterministic fairness guard lexical بطبيعته؛ semantic quality لا يمكن اختزالها بالكامل في CI، لذلك review artifact يبقى مطلوبًا عند إضافة/إعادة كتابة curated content.
- multi-mafia stories 8–10 تعتمد نمط independent acts؛ النمط مقبول حاليًا لكنه يستحق playtest بشري لاحقًا للتأكد إن اللاعبين يفهموا إنهم مش لازم يفترضوا conspiracy واحدة.
- Production parity لا تزال blocker مستقلة ولم تُلمس.

### Roadmap impact
Story Quality Hardening للمكتبة الحالية 4–10 صار له human review + deterministic regression. لا يوجد مبرر لتوسيع counts فوق 10 الآن. ننتقل للtechnical debt التي تقلل drift قبل فتح New Features.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable في deterministic + local RPC suites.
- [x] Identity/story contract stable للruntime الحالي.
- [x] Curated library exact coverage 4–10.
- [x] Deep semantic/human fairness review للـ14 curated cases + artifact + regression hardening.
- [ ] Session 23 full `validate` + `qa` Green.
- [ ] Remove duplicated curated registry safely — single source of truth مع contract tests وعدم كسر Expo/server paths.
- [ ] Legacy DB identity compatibility audit (`character_name`/`character_bio`).
- [ ] بعدها New Gameplay Feature milestone يبدأ feature واحدة ذات قيمة واضحة end-to-end.
- [ ] Production parity remains separately blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → Technical Drift Cleanup → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
أولًا افحص checks لـ`a206c06d797827c2830e025c3e28d3427a64d064`. لو failure حقيقي من fairness guard أو content، أصلح أول failure فقط مع regression مناسب. لو `validate` و`qa` Green: نفّذ **Single Source of Truth for Curated Registry** كـvertical slice واحد — أزل duplication بين server/API curated registries، وحافظ على exact-count lookup 4–10 وAI-only 11–12، مع contract tests تغطي Expo/server paths. لا تبدأ legacy DB audit أو feature جديد في نفس الجلسة.
