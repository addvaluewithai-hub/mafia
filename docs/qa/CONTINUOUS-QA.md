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
- [x] Session 20 أثبت deterministic + local Supabase full-game RPC coverage لـ4/5/6/7؛ prerequisite `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` انتهى `validate` ✅ و`qa` ✅.
- [ ] Session 21 يوسّع نفس full-game confidence لـ4–10؛ checks على آخر code commit `c3eb880e8a158545e71080dd5e91dc7a6f55ac12` كانت بدأت وما زالت غير مكتملة عند تحديث هذا الملف.
- [ ] Production DB parity blocked لأن Production Supabase كان `INACTIVE`; لا write/migration قبل read-only parity + smoke plan أو تصريح restore صريح.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity.
- [x] gender-aware `install_case` بعد player shuffle، بدون تغيير mafia selection.
- [x] AI generator + shared TypeScript contract للـsemantic role/bio + male/female variants.
- [x] curated presets 4–10 تستخدم semantic roles + gender-aware wording.
- [ ] legacy DB/snapshot `character_name`/`character_bio` موجودة للتوافق؛ لا حذف بدون compatibility audit.

## Current curated library
- 4: `last-tray`, `balcony-key`.
- 5: `clock-1117`, `room-312`.
- 6: `last-rehearsal`, `blue-notebook`.
- 7: `fourth-floor`, `silent-auction`.
- 8: `rooftop-envelope`, `backstage-pass`.
- 9: `gallery-ledger`, `garden-locker`.
- 10: `midnight-menu`, `archive-seal`.
- 11–12: لا curated support معلن؛ AI-only حتى content + matching E2E في milestone لاحق إذا تقرر دعمهما.

## QA coverage
- vote/gender/join/player-card/generated-case contracts.
- caseRole + gender-aware install E2E.
- story critic + machine-readable lexical fairness baseline + curated identity integrity guard.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، catalog/server/API sync، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations في Session 21 أصبحت 140: 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E في Session 21 يستهدف 4/5/6/7/8/9/10.
- eliminated Boss admin E2E + six-player tie/reconnect regression يظلان ضمن suite.

## Recent sessions
### Session 18 — Story Quality Baseline
`f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; `validate` ✅ `qa` ✅.

### Session 19 — Rewrite/Migrate six presets
`8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; presets 5/6/7 migrated إلى semantic/gender-aware contract؛ `validate` ✅ `qa` ✅.

### Session 20 — Curated 4–7 coverage
Final code `b34067d54f4febb7a0dedab74e20d38fc8c9cf08`; أضاف قصتين لـ4، exact-count registry/reference behavior، 80 deterministic simulations، وlocal RPC E2E لـ4/5/6/7. **Session 21 أثبت prerequisite: `validate` ✅ `qa` ✅.**

## Session 21 — 2026-09-11 — Curated 8–10 expansion
### Session type
Delivery — vertical slice واحد: curated content + selection + matching automated full-game coverage لـ8/9/10 قبل اعتبارهم supported.

### Starting evidence
- قرأنا `AGENTS.md` → `QA-OPERATING-MODE.md` → هذا handoff من default branch.
- main وقت البداية: `bd3ea0ea94d9c92911c07e81760b40ea4ca0ef32`.
- prerequisite Session 20 `b34067d...`: `validate` ✅ و`qa` ✅.
- Production parity blocker لم يُلمس.

### Reproduction / design finding
- قبل الجلسة catalog/server/API فيها curated 4–7 فقط، والـcreate UI تحول 8–12 تلقائيًا إلى AI.
- deterministic simulator وlocal RPC full-game suite يقفان عند 7 لاعبين.
- mafia count contract الحالي هو 2 للـ8/9 و3 للـ10، فالمحتوى الجديد لازم يطابق ذلك.

### What changed
- أضيفت 6 قضايا curated جديدة، قصتان لكل 8 و9 و10 لاعبين:
  - 8: `rooftop-envelope`, `backstage-pass`.
  - 9: `gallery-ledger`, `garden-locker`.
  - 10: `midnight-menu`, `archive-seal`.
- كل قضية تستخدم semantic `role` + neutral `bio` + complete `roleByGender`/`bioByGender`، بدون fictional names، و4 clues.
- 8/9 تستخدم 2 mafia indexes؛ 10 تستخدم 3، مستقلين عن gender.
- `lib/server-stories/index.ts`, `lib/story-catalog.ts`, و`api/case-start.ts` أصبحت exact-count curated 4–10.
- create UI يعرض preset selection لـ8/9/10 ويصف curated range بدقة كـ4–10، بينما 11–12 يظلان AI-only.
- `curated-player-count-contract.mjs` يفرض 14 case بالضبط: قصتان لكل عدد 4–10، ويمنع إعلان 11/12 قبل E2E خاص بهما.
- deterministic simulator أصبح 140 complete games: 20 لكل عدد 4–10.
- local Supabase RPC E2E أصبح يشغّل full game لكل عدد 4–10 مع بقاء tie/reconnect special regression على 6 لاعبين.

### Commits
- `46bc72446cebdcea104e824a129343ec88975ecd` — 8-player Rooftop Envelope.
- `4f7a839271c6e67e1d5c9d0da5ebccda9942b25a` — 8-player Backstage Pass.
- `9b686b654958b56a707153d34d3148818325e06a` — 9-player Gallery Ledger.
- `8ab1d8a01b00efd47c1caeee5bdbcee9d1560660` — 9-player Garden Locker.
- `28516dad998da45958a7450d034bcd59da6537b9` — 10-player Midnight Menu.
- `f00a1a554640209d1042c6b6657f7972cef8d0aa` — 10-player Archive Seal.
- `a01f4a5b6969cb768f1416de0bc5b52826f9f18c` — server registry 4–10.
- `c5876198be57e4e3990498c4a07098c3abcf428a` — catalog 4–10.
- `32c7a10d102729b74700e4a26fff24ba1293d20f` — case-start API registry 4–10.
- `0426a3fc8e7e970238a8584c944afd748e04e24f` — player-count contract 4–10.
- `646e27a27d03c9464f4abdc5c6b2798fac7f5dd9` — 140 deterministic simulations.
- `3a3c9dd101b5e0e13b43328d6e5958d5a924118d` — create UI curated range 4–10.
- `c3eb880e8a158545e71080dd5e91dc7a6f55ac12` — local RPC E2E 4–10.

### Evidence / checks — latest inspected state
- prerequisite `b34067d...`: `validate` ✅ `qa` ✅.
- on `c3eb880e8a158545e71080dd5e91dc7a6f55ac12`, `validate` and `qa` were queued/starting at last inspection; no failure was visible yet.
- therefore Session 21 is **not deploy-safe yet** until both complete Green.

### Newly discovered risks / technical debt
- curated registry definition remains duplicated between `lib/server-stories/index.ts` and `api/case-start.ts`; regression prevents drift but does not remove duplication.
- story critic lexical fairness remains a deterministic baseline, not a substitute for deeper human semantic fairness review, especially with the six new larger-player stories.
- 11–12 remain supported by AI flow only; do not describe them as curated.

### Production safety
No Production deploy, restore, migration, or DB write. Production parity remains blocked.

## Backlog / roadmap
- [ ] Close Session 21 only when full `validate` + `qa` on `c3eb880...` are Green; if failure appears, fix the first real failure inside this objective only.
- [ ] Next session is **Checkpoint/Planning** if Session 21 closes Green: Sessions 18–21 are four implementation slices since Checkpoint 17.
- [ ] Checkpoint must audit Core Stable, 4–10 full-game confidence, story quality/fairness of the now 14-case library, production parity blocker, registry duplication, legacy DB identity compatibility debt, and decide the next 3–4 substantial objectives before new gameplay features.
- [ ] Later candidate: deeper semantic/human fairness review for 14 curated cases.
- [ ] Later candidate: remove duplicated curated registry safely.
- [ ] Later candidate: legacy DB identity compatibility audit.
- [ ] 11–15 only if gameplay/UX evidence justifies expansion; do not assume it.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
1. افحص full checks لـ`c3eb880e8a158545e71080dd5e91dc7a6f55ac12`.
2. إذا failure: أصلح أول failure حقيقي فقط داخل Curated 8–10 objective مع regression، ولا تبدأ checkpoint أو feature جديد.
3. إذا `validate` و`qa` Green: أغلق Session 21 ونفّذ **Checkpoint/Planning session فقط** وفق `QA-OPERATING-MODE.md`.
4. الـCheckpoint يحدد 3–4 vertical slices التالية؛ لا يضيف feature كبيرة بنفسه.
5. لا تغيّر mafia assignment بسبب gender.
6. Production parity blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
