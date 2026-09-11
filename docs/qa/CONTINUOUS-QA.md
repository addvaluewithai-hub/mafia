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
- [x] Session 21 code commit `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`: `validate` ✅ و`qa` ✅.
- [x] Session 21 handoff commit `4beafc3f0b96f9d7ceaf02c97013bdadb0f82d4c`: `validate` ✅ و`qa` ✅.
- [ ] Production DB parity blocked لأن Production Supabase كان `INACTIVE`; لا write/migration قبل read-only parity + smoke plan أو تصريح restore صريح.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity.
- [x] gender-aware `install_case` بعد player shuffle، بدون تغيير mafia selection.
- [x] AI generator + shared TypeScript contract للـsemantic role/bio + male/female variants.
- [x] curated presets 4–10 تستخدم semantic roles + gender-aware wording.
- [ ] legacy DB/snapshot `character_name`/`character_bio` compatibility debt لم يُحسم بعد؛ لا حذف بدون audit ومigration-safe plan.

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
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، catalog/server/API sync، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10.
- eliminated Boss admin E2E + six-player tie/reconnect regression ضمن suite.

## Recent sessions
### Session 18 — Story Quality Baseline
`f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; `validate` ✅ `qa` ✅.

### Session 19 — Rewrite/Migrate six presets
`8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; presets 5/6/7 migrated إلى semantic/gender-aware contract؛ `validate` ✅ `qa` ✅.

### Session 20 — Curated 4–7 coverage
`b34067d54f4febb7a0dedab74e20d38fc8c9cf08`; أضاف curated 4-player coverage و80 deterministic simulations وlocal RPC E2E لـ4–7؛ `validate` ✅ `qa` ✅.

### Session 21 — Curated 8–10 expansion
`c3eb880e8a158545e71080dd5e91dc7a6f55ac12`; أضاف 6 curated cases لـ8/9/10، catalog/server/API/UI support، 140 deterministic simulations، وlocal RPC E2E لـ4–10؛ `validate` ✅ `qa` ✅.

## Session 22 — 2026-09-11 — Checkpoint after Story/Curated milestone
### Session type
Checkpoint / Planning فقط — لا feature implementation.

### Starting evidence
- قُرئ `AGENTS.md` ثم `QA-OPERATING-MODE.md` ثم هذا handoff من default branch.
- main عند البداية كان `4beafc3f0b96f9d7ceaf02c97013bdadb0f82d4c`.
- Session 21 code commit `c3eb880...`: `validate` ✅ `qa` ✅.
- Session 21 handoff commit `4beafc3...`: `validate` ✅ `qa` ✅.
- لا P0 جديد ظهر في CI أو handoff.

### Checkpoint findings
1. **Core Stable confidence قوي حاليًا**: full-game deterministic + local RPC E2E يغطي 4–10، مع tie/reconnect/elimination/Boss/winner paths محمية.
2. **Identity & Story Contract milestone عمليًا مستقر** للruntime الحالي: nickname identity + semantic roles + gender-only wording موجودة في AI والcurated presets.
3. **Curated library milestone الأساسي تحقق لـ4–10** بواقع قصتين لكل عدد، لكن جودة القصص الكبيرة 8–10 لم تحصل بعد على semantic/human fairness review عميق مماثل لما نحتاجه قبل feature expansion.
4. **Story critic الحالي baseline deterministic وليس حكمًا semantic كاملًا**؛ لا يكفي وحده لاكتشاف clue منطقي يكشف المافيا مبكرًا أو ambiguity غير عادلة بدون explicit lexical signal.
5. **Registry duplication** بين curated server registry ومسار API ما زالت technical debt؛ regression يمنع drift لكنه لا يزيل المصدر المكرر.
6. **Legacy DB identity fields** (`character_name` / `character_bio`) ما زالت compatibility debt؛ حذفها يحتاج audit قبل أي migration.
7. **Production parity** ما زالت blocker منفصلة؛ لا ينبغي تعطيل roadmap المحلي بسببها، ولا ينبغي لمس Production بدون read-only verification/restore authorization.
8. لا يوجد دليل حالي يبرر curated expansion لـ11–15؛ الأفضل تثبيت جودة 4–10 ثم الانتقال لfeatures ذات قيمة أعلى.

### Next roadmap — ordered vertical slices
1. **Deep Curated Story Fairness Review (14 cases)** — أعلى أولوية تالية. اعمل semantic audit لكل القضايا 4–10: suspects×clues matrix، early-reveal risk، plausible alternative suspects، clue escalation، Egyptian naturalness، وعدّل القصص والcritic/regressions حيث يوجد defect حقيقي. الهدف ليس rewrite شكليًا بل إثبات أن المكتبة الحالية عادلة وممتعة قبل features جديدة.
2. **Single Source of Truth for Curated Registry** — أزل duplication بين server/API registries مع contract tests تضمن exact-count lookup وعدم كسر Expo/server paths.
3. **Legacy Identity Compatibility Audit** — تتبع `character_name`/`character_bio` عبر schema/migrations/snapshots/runtime، وحدد migration-safe path: إزالة، alias، أو إبقاء موثق. لا production migration ضمن هذا slice إلا إذا parity/authorization تسمح.
4. **First New Gameplay/Product Feature Slice** — بعد إغلاق 1–3 أو إثبات أن 2/3 غير blocking، اعمل product-value review سريع واختر feature واحدة end-to-end مبنية على core الحالي، مع full-game regressions وعدم توسيع player counts تلقائيًا.

### Roadmap decision
- لا نوسع curated counts فوق 10 الآن.
- Story Quality لم تعد مجرد "content cleanup"؛ المرحلة التالية تبدأ semantic fairness hardening للمكتبة كاملة، ثم technical debt التي تقلل drift، وبعدها نفتح New Features.
- Core/full-game suite تظل gate لأي feature جديد.

### Production safety
- لم يحدث deploy أو restore أو migration أو Production DB write.
- Production parity ما زالت blocked وغير متحققة.
- Session 21 runtime/content changes Green محليًا وCI، لكن هذا لا يثبت Production DB parity تلقائيًا.

## Backlog / roadmap
- [x] Session 21 full `validate` + `qa` Green.
- [x] Checkpoint 22 بعد أربع implementation sessions.
- [ ] Deep semantic/human fairness review للـ14 curated cases مع measurable artifact/regression improvements.
- [ ] Remove duplicated curated registry safely.
- [ ] Legacy DB identity compatibility audit.
- [ ] بعدها New Gameplay Feature milestone يبدأ feature واحدة ذات قيمة واضحة end-to-end.
- [ ] Production parity remains separately blocked.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality Hardening → Curated Library Stable (4–10) → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
نفّذ **Deep Curated Story Fairness Review** كـvertical slice واحد للـ14 curated cases: ابنِ/حدّث semantic suspects×clues evidence لكل قصة، راجع early reveal + plausible alternatives + escalation + Egyptian naturalness، أصلح defects الحقيقية في content والvalidator/critic/tests، وحافظ على mafia counts/assignment semantics وfull-game behavior. لا تبدأ registry cleanup أو legacy DB audit أو feature جديد في نفس الجلسة.
