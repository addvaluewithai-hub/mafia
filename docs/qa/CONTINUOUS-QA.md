# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف بين الجلسات. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

## الهدف
لعبة كاملة قابلة للعب من إنشاء الروم حتى إعلان الفائز، بدون deadlocks، بهوية اللاعب الحقيقية، وقصص مصرية طبيعية وعادلة، مع automated confidence للمسارات الحرجة.

## قواعد غير قابلة للتفاوض
- full-game path: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ caseRole وصف مرتبط باللاعب وليس اسم شخصية خيالية بديلة.
- gender للصياغة فقط ولا يؤثر على mafia assignment أو فرص الفوز.
- الـBoss لاعب كامل ويظل قادرًا على الإدارة حتى لو اتسجن.
- كل bug مهم أو متكرر يتحول إلى regression عندما يكون ذلك عمليًا.
- ممنوع إضعاف/حذف test لمجرد جعل CI أخضر.
- لا Production deploy أو migration إلا بعد E2E مناسب وقرار deploy-safe صريح هنا.
- الجلسة العادية تنفذ vertical slice واحدًا كاملًا عندما يكون ذلك آمنًا.

## P0 — Functionality / Deadlocks
- [x] vote gating defensive hotfix.
- [x] server-authoritative `phase` + `canVote` + UI contract.
- [x] reconnect regression: before cast → after cast → tie reset → resolve → next round.
- [x] eliminated Boss لا يصوت لكنه يحتفظ بـresolve/reveal admin controls.
- [x] 60 deterministic full-game simulations لـ5/6/7 كانت Green قبل Session 20.
- [x] local Supabase full-game RPC E2E لـ5/6/7 كان Green قبل Session 20.
- [ ] Session 20 وسّع deterministic simulations إلى 80 لعبة لـ4/5/6/7 وRPC E2E إلى 4/5/6/7؛ لا تعتبر 4-player support مغلقًا حتى full CI على `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` يقفل Green.
- [ ] Production DB parity **blocked** حتى Production Supabase يكون active أو restore يتصرح به صراحة. لا migration قبل read-only parity + smoke-test plan.

## Production drift المعروف
Production كان فيها `case_mode` / `story_template_id` / `create_room_v2` قبل تسجيل كل ذلك في versioned migrations. parity لم تثبت لأن Production Supabase كان `INACTIVE`. لا تدّعِ أن migration حديث مطبق على Production بدون تحقق read-only.

## Identity / story contract — الحالة الحالية
- [x] `gender + caseRole` schema + snapshot/types regression.
- [x] gender-aware create/join backend + UI + mixed-gender E2E.
- [x] nickname-only PlayerCard identity.
- [x] `install_case` يملأ `caseRole` ويختار optional `roleByGender` / `bioByGender` بعد player shuffle بدون تغيير `order by random()` أو `mafiaCharacterIndexes`.
- [x] AI generators تطلب semantic `role + bio + roleByGender + bioByGender` مع semantic-equivalence rule واستقلال mafia assignment عن gender.
- [x] shared TypeScript contract: `GenderedCaseText`, `GeneratedCaseCharacter`, `GeneratedAiCase`.
- [x] الست curated presets الأصلية migrated من fictional `name` إلى semantic role + complete male/female wording في Session 19.
- [x] Session 20 أضاف قصتين curated مخصصتين لـ4 لاعبين بنفس identity/gender contract.
- [ ] DB/snapshot legacy `character_name` و`character_bio` fields ما زالت موجودة للتوافق؛ لا تحذفها قبل compatibility audit منفصل.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC + standalone join contract.
- player-card identity contract.
- generated-case schema/prompt/type/install contract للمسارين.
- caseRole + gender-aware install E2E.
- deterministic story critic + machine-readable fairness baseline.
- curated-preset identity regression داخل `story-critic.mjs`.
- new `curated-player-count-contract.mjs`: يفرض exact curated coverage لعدد 4/5/6/7، قصتين لكل عدد، ويرفض advertising/fallback غير مقصود لـ8–12.
- deterministic full-game simulations مرشحة الآن لـ80 لعبة على 4/5/6/7.
- local Supabase full-game RPC E2E مرشح الآن لـ4/5/6/7.
- eliminated Boss admin-controls E2E.

## Story Quality baseline
Session 18 أضاف baseline deterministic: player/mafia counts، role coverage، clue-by-clue mention matrix، early-exclusive/decisive warnings، jargon/read-aloud burden، وplayer-count coverage. الـfairness signal lexical evidence فقط وليس semantic guilt verdict.

## Session 18 — Story Quality Baseline & Fairness Matrix
- code: `f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`.
- handoff: `c0dcf1d6f2cd57b13b4714db50611b971edaad90`.
- النتيجة النهائية المؤكدة لاحقًا: `validate` ✅ و`qa` ✅.
- لا Production deploy/migration.

## Session 19 — Rewrite/Migrate existing six curated presets
- الست قصص 5/6/7 اتحولت إلى semantic roles + neutral fallback bio + male/female variants، مع مصري أبسط وتقليل jargon والحفاظ على نفس `mafiaCharacterIndexes`.
- story critic أصبح يمنع fictional `name` أو نقص role/bio/gender variants.
- final code commit: `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`.
- **النتيجة النهائية التي تأكدت في Session 20:** `validate` ✅ و`qa` ✅.
- لا Production deploy/migration.

## Session 20 — 2026-09-11 — Curated 4–5 & 6–7 coverage
### Session type
Delivery — vertical slice واحد: جعل curated library تدعم 4–7 بشكل مقصود end-to-end بدل إن 4 لاعبين يتحولوا للـAI أو references من عدد مختلف.

### Starting evidence
- قُرئت `AGENTS.md` ثم `QA-OPERATING-MODE.md` ثم هذا handoff من default branch.
- أحدث `main` عند البداية كان `8697a69f2d8b7cd38c3765ac05fcfbab26cb192f`.
- prerequisite `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0`: `validate` ✅ و`qa` ✅، لذلك Session 19 أُغلقت قبل بدء التوسعة.
- Production parity ظل blocker خارجيًا ولم يُلمس.

### Exact objective
Curated 4–5 & 6–7 library coverage فقط: أضف محتوى 4 لاعبين، اجعل selection/reference logic exact حسب player count، خلّي UI تعلن النطاق الصحيح، وأثبت full-game correctness للـ4 قبل وصفه supported. لا 8–10 في هذه الجلسة.

### Reproduction / design finding
- `STORY_CATALOG` وserver/API registries كانت تحتوي فقط 5/6/7.
- create UI عند اختيار 4 لاعبين كان يجد `availableStories.length === 0` ويحوّل `caseMode` تلقائيًا إلى AI.
- `referenceCasesFor` في server stories كان يرجع **كل** القصص عند عدم وجود match، و`api/case-start.ts` كان يعمل fallback لعدد 5 أو 7؛ ده كان يعني AI reference content من player count مختلف.
- deterministic simulator وlocal Supabase RPC full-game E2E كانا يبدأان من 5 لاعبين، لذلك 4-player gameplay لم يكن مثبتًا آليًا.

### What changed
- أضيفت قضيتان curated مخصصتان لـ4 لاعبين:
  - `last-tray.ts` — «آخر صينية».
  - `balcony-key.ts` — «مفتاح البلكونة».
- كل قضية فيها 4 semantic roles، neutral bios، complete `roleByGender`/`bioByGender`، 4 clues، ومافيوزو واحد مستقل عن gender.
- `lib/server-stories/index.ts` أصبح يحتوي exact 4/5/6/7 registry: قصتان لكل عدد، و`referenceCasesFor` لا يعمل unrelated-count fallback.
- `api/case-start.ts` أصبح يعرف قضايا الـ4 ويستخدم exact-count references فقط.
- `lib/story-catalog.ts` وcreate UI أصبحا يعرضان قضايا 4 لاعبين، والcopy تقول إن curated availability حاليًا من 4 لـ7.
- أضيف `scripts/qa/curated-player-count-contract.mjs` ليثبت 2 cases لكل 4/5/6/7، تزامن catalog/server/API، غياب 8–12 قبل E2E الخاص بها، وغياب fallback القديم.
- `game-state-sim.mjs` توسع من 60 إلى 80 deterministic full games: 20 لكل عدد 4/5/6/7.
- `supabase-e2e.mjs` توسع إلى full-game RPC E2E لـ4/5/6/7.
- Game QA workflow يشغل player-count contract ويسمي الـRPC E2E صراحة 4/5/6/7.

### Commits
- `e003287317f90672e4f7b9fef073dd8dbf63afbc` — add Last Tray 4-player case.
- `8a6b72fa21e9591fc1bc4b47d66b7e7f1a82b59c` — add Balcony Key 4-player case.
- `0cc34a9d4402f157b143353eee5ac884f2d364d3` — exact server registry/reference selection.
- `6c278751a409ce4c0ddc4388f7b36a56c6656e6a` — expose 4-player cases in story catalog.
- `be0e8d77b96b4d48ef8a1b089189f091bd722dfc` — wire 4-player presets into case-start and remove reference fallback.
- `98167b93457b2045e6fba6ac366082c69037bbca` — create UI curated range/copy.
- `b982f6546628701fabe03faccc68dab6367394c4` — curated player-count regression.
- `fe018bfb21afd31e34e85a471fd883b51e0a8c4e` — 4-player local RPC full-game E2E.
- `c33a9eb9dfd8d8f4a9715a7bfd828567ac2c8bdd` — 80 deterministic full-game simulations for 4–7.
- `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` — CI gates new player-count contract and 4/5/6/7 RPC E2E.

### Evidence / checks
- prerequisite Session 19 code `8bb4e2b...`: `validate` ✅ و`qa` ✅.
- على latest code commit `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` عند آخر فحص: `validate` in_progress و`qa` in_progress؛ لا failure ظاهر بعد.
- الـQA job شايف steps الجديدة `Curated player-count contract` و`Full-game RPC E2E (4/5/6/7 players)` لكنه لم يصل لهما بعد وقت handoff.
- لذلك 4-player curated support **ليس deploy-safe بعد** حتى full CI يقفل Green.

### Newly discovered bugs / risks
- duplication ما زال موجودًا بين curated registry في `lib/server-stories/index.ts` و`api/case-start.ts`; regression الجديد يمنع drift في ids/counts لكنه لا يزيل duplication. توحيد registry ممكن لاحقًا لو build/runtime boundaries تسمح من غير مخاطرة.
- القضايا الجديدة اجتازت static story contract بحكم نفس story critic عند تشغيل CI، لكن semantic fairness النهائي يحتاج human/content review بجانب lexical matrix.
- 8–12 يظل AI-only حاليًا، وده مقصود؛ regression يمنعنا من الإعلان عن curated support قبل matching content + E2E.

### Deploy safety
- لا Production deploy، restore، migration، أو DB write حدث.
- Production parity blocker مستقل ولم يُلمس.
- لا deploy-safe حتى `validate` وfull `qa` على `b34067d...` يصبحا Green.

## P1 — Story / library backlog
- [x] deterministic Story Quality Baseline & Fairness Matrix.
- [x] migrate/rewrite الست curated presets الأصلية إلى semantic roles + gender-aware wording.
- [ ] close Session 20 only after Green CI; fix first real failure if any.
- [ ] curated 8–10 expansion + matching deterministic/full-game RPC E2E لـ8/9/10 قبل إعلان الدعم.
- [ ] بعد 8–10: Checkpoint/Planning لأن Sessions 18–21 تمثل أربع implementation slices بعد Checkpoint 17.
- [ ] لاحقًا: semantic/human story review أعمق للـfairness/plausibility بعد اتساع المكتبة.
- [ ] لاحقًا: compatibility audit قبل إزالة legacy DB `character_name`/`character_bio`.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

الـAI generation جزء من المنتج، لكن الهدف مكتبة curated قوية + AI generation تحت نفس قواعد الهوية والـfairness.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `b34067d54f4febb7a0dedab74e20d38fc8c9cf08` أولًا.
2. إذا ظهر failure حقيقي: أصلح **أول failure فقط** داخل 4–7 coverage objective مع regression مناسب، ولا تبدأ 8–10.
3. إذا `validate` و`qa` Green: أغلق Session 20 ثم نفّذ vertical slice واحدًا **Curated 8–10 expansion**: محتوى/selection واضح لـ8 و9 و10 + matching deterministic simulations + local full-game RPC E2E لكل عدد قبل وصفه supported.
4. لا تبدأ 11–15 أو unrelated features في نفس الجلسة.
5. بعد إغلاق 8–10 اعمل Checkpoint/Planning session قبل features الجديدة.
6. لا تغيّر mafia assignment بسبب gender.
7. Production parity يظل blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
