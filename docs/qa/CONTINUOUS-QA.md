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
- [x] قبل Session 20: deterministic/full-game RPC coverage لـ5/6/7 Green.
- [ ] Session 20 يوسّع full-game confidence لـ4/5/6/7؛ deterministic layer Green في CI، والـlocal Supabase layer ما زال running عند آخر فحص.
- [ ] Production DB parity blocked لأن Production Supabase كان `INACTIVE`; لا write/migration قبل read-only parity + smoke plan أو تصريح restore صريح.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity.
- [x] gender-aware `install_case` بعد player shuffle، بدون تغيير mafia selection.
- [x] AI generator + shared TypeScript contract للـsemantic role/bio + male/female variants.
- [x] الست presets الأصلية (5/6/7) migrated من fictional names في Session 19.
- [x] قصتان جديدتان لـ4 لاعبين في Session 20 بنفس semantic/gender contract.
- [ ] legacy DB/snapshot `character_name`/`character_bio` موجودة للتوافق؛ لا حذف بدون compatibility audit.

## Current curated library
- 4 لاعبين: `last-tray`, `balcony-key`.
- 5 لاعبين: `clock-1117`, `room-312`.
- 6 لاعبين: `last-rehearsal`, `blue-notebook`.
- 7 لاعبين: `fourth-floor`, `silent-auction`.
- 8–12: لا curated support معلن حاليًا؛ AI-only حتى content + matching E2E.

## QA coverage
- vote/gender/join/player-card/generated-case contracts.
- caseRole + gender-aware install E2E.
- story critic + machine-readable lexical fairness baseline.
- curated identity integrity guard في story critic.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4/5/6/7، catalog/server/API synchronization، no unrelated-count fallback، no 8–12 advertising قبل E2E.
- deterministic full-game simulations الآن 80: 20 لكل 4/5/6/7.
- local Supabase full-game RPC E2E الآن يستهدف 4/5/6/7.
- eliminated Boss admin E2E.

## Recent sessions
### Session 18 — Story Quality Baseline
`f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`; النتيجة النهائية `validate` ✅ `qa` ✅.

### Session 19 — Rewrite/Migrate six presets
final code `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`; الست 5/6/7 presets أصبحت semantic roles + gender-aware wording + simpler Egyptian Arabic، مع الحفاظ على mafia indexes. **Session 20 أثبتت أن `validate` ✅ و`qa` ✅.**

## Session 20 — 2026-09-11 — Curated 4–5 & 6–7 coverage
### Session type
Delivery — vertical slice واحد: جعل curated 4–7 coverage مقصودة ومثبتة بدل 4-player AI fallback.

### Starting evidence
- قرأنا `AGENTS.md` → `QA-OPERATING-MODE.md` → هذا handoff من default branch.
- main وقت البداية: `8697a69f2d8b7cd38c3765ac05fcfbab26cb192f`.
- prerequisite Session 19 `8bb4e2b...`: `validate` ✅ `qa` ✅.
- Production parity blocker لم يُلمس.

### Reproduction / design finding
- catalog/server/API كان فيها 5/6/7 فقط؛ create UI كان يحول 4 لاعبين تلقائيًا إلى AI.
- server reference helper كان يرجع كل القصص إذا لم يجد exact count، و`api/case-start.ts` كان يعمل fallback لـ5 أو 7؛ AI reference content كان ممكن يأتي من عدد مختلف.
- deterministic simulator وlocal RPC E2E لم يختبرا 4 لاعبين.

### What changed
- أضيفت `last-tray.ts` و`balcony-key.ts` كقضيتين curated من 4 roles، مافيوزو واحد، 4 clues، semantic roles، neutral bios، وcomplete male/female variants.
- `lib/server-stories/index.ts`: exact 4/5/6/7 registry، قصتان لكل عدد، و`referenceCasesFor` exact match فقط.
- `api/case-start.ts`: 4-player preset registry + exact-count references فقط.
- `lib/story-catalog.ts` + `app/create.tsx`: 4-player preset selection متاح والcopy تعلن curated range من 4 لـ7.
- `curated-player-count-contract.mjs`: regression يمنع registry drift أو unrelated fallback أو إعلان 8–12 مبكرًا.
- `game-state-sim.mjs`: 80 deterministic complete games لـ4/5/6/7.
- `supabase-e2e.mjs`: full-game RPC target أصبح 4/5/6/7.
- Game QA workflow يشغل regression الجديد والـ4/5/6/7 RPC E2E.

### Commits
- `e003287317f90672e4f7b9fef073dd8dbf63afbc` — Last Tray.
- `8a6b72fa21e9591fc1bc4b47d66b7e7f1a82b59c` — Balcony Key.
- `0cc34a9d4402f157b143353eee5ac884f2d364d3` — exact server registry/reference.
- `6c278751a409ce4c0ddc4388f7b36a56c6656e6a` — story catalog.
- `be0e8d77b96b4d48ef8a1b089189f091bd722dfc` — case-start 4-player support/exact references.
- `98167b93457b2045e6fba6ac366082c69037bbca` — create UI.
- `b982f6546628701fabe03faccc68dab6367394c4` — player-count regression.
- `fe018bfb21afd31e34e85a471fd883b51e0a8c4e` — 4-player RPC full-game target.
- `c33a9eb9dfd8d8f4a9715a7bfd828567ac2c8bdd` — 80 deterministic simulations.
- `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` — CI gates.

### Evidence / checks — latest inspected state
On `b34067d54f4febb7a0dedab74e20d38fc8c9cf08`:
- `validate` ✅ success.
- Game QA: TypeScript ✅, Expo Doctor ✅, existing contracts ✅, **Curated player-count contract ✅**, **80 Full-game state simulations ✅**, Story critic ✅.
- Game QA was still `in_progress` at `Start clean local Supabase`; local schema/install/RPC tests including **Full-game RPC E2E (4/5/6/7 players)** had not completed yet at session close.
- therefore Session 20 is **not deploy-safe yet**.

### Newly discovered risks
- registry definition is duplicated between `lib/server-stories/index.ts` and `api/case-start.ts`; regression now prevents ids/count drift but does not remove duplication.
- new 4-player stories pass deterministic/static quality contracts, but lexical fairness is not a substitute for deeper human semantic review.
- 8–12 remains intentionally AI-only until separate curated + E2E slice.

### Production safety
No Production deploy, restore, migration, or DB write. Production parity remains blocked.

## Backlog / roadmap
- [ ] Close Session 20 only when full `qa` on `b34067d...` is Green; if failure appears, fix first real failure only.
- [ ] Curated 8–10 expansion as one vertical slice: intentional content/selection for 8, 9, 10 + deterministic and local full-game RPC E2E for each before advertising support.
- [ ] Then Checkpoint/Planning: Sessions 18–21 form four implementation slices after Checkpoint 17.
- [ ] Later: deeper human/semantic fairness review of expanded library.
- [ ] Later: legacy DB identity compatibility audit.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
1. افحص full checks لـ`b34067d54f4febb7a0dedab74e20d38fc8c9cf08`.
2. إذا failure: أصلح أول failure حقيقي فقط داخل 4–7 objective مع regression، ولا تبدأ 8–10.
3. إذا `validate` و`qa` Green: أغلق Session 20 ثم نفّذ **Curated 8–10 expansion** كـvertical slice واحد: content/selection واضح لـ8/9/10 + deterministic simulations + local full-game RPC E2E لكل عدد قبل وصفه supported.
4. لا تبدأ 11–15 أو unrelated features في نفس الجلسة.
5. بعد 8–10 Green: Checkpoint/Planning قبل features الجديدة.
6. لا تغيّر mafia assignment بسبب gender.
7. Production parity blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
