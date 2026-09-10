# آخر خيط — Continuous QA Handoff

> هذا الملف هو مصدر الحقيقة لكل جلسة QA متتابعة. كل جلسة تقرأه أولًا، تنفذ أعلى أولوية قابلة للتنفيذ، ثم تحدّثه قبل أن تنتهي.

## الهدف
نوصل للعبة كاملة قابلة للعب من أول إنشاء الروم حتى إعلان الفائز، بدون deadlocks أو حالات واجهة غامضة، وبقصص مصرية طبيعية وممتعة وصعبة بالاستنتاج لا بالتعقيد اللغوي.

## قواعد الجودة غير القابلة للتفاوض
1. المسار الأساسي يتجرب end-to-end: إنشاء روم → دخول اللاعبين → توزيع الأدوار → القضية → الأدلة → التصويت → التعادل → السجن → الجولة التالية → النهاية.
2. nickname الحقيقي هو هوية اللاعب الظاهرة؛ دور القضية وصف مرتبط باللاعب وليس اسمًا خياليًا بديلًا.
3. gender يستخدم فقط لضبط الصياغة اللغوية، ولا يؤثر على المافيا أو فرص الفوز.
4. اللغة مصرية بسيطة قابلة للقراءة بصوت عالٍ؛ الصعوبة في الاستنتاج لا المصطلحات.
5. كل bug متكرر يتحول إلى regression test.
6. الـBoss لاعب كامل ويظل قادرًا على الإدارة حتى لو اتسجن.
7. لا Production deploy من QA loop إلا بعد E2E خاص بالمسار المتغير وقرار deploy-safe صريح.
8. ممنوع إضعاف اختبار فاشل لمجرد جعل CI أخضر.

## ملاحظات المستخدم المؤكدة
- التصويت سبق ودخل deadlock يمنع اللاعبين من التصويت.
- أسماء شخصيات القصة كانت تطغى على أسماء اللاعبين الحقيقية.
- نحتاج جنس اللاعب لضبط الصياغة فقط.
- القصص الحالية أعقد لغويًا وأقل طبيعية مما ينبغي.
- الحبكة والأدلة تحتاج نقد fairness/clarity مستقل.

## P0 — Functionality / Deadlocks
- [x] vote gating defensive hotfix.
- [x] 60 full-game state simulations لـ5/6/7 لاعبين.
- [x] local Supabase full-game RPC E2E.
- [x] server-authoritative `phase` + `canVote`.
- [x] UI تعتمد على `phase/canVote` مع regression guard.
- [x] reconnect regression: before cast → after cast → tie reset → resolve → next round.
- [x] eliminated Boss لا يصوت لكنه يحتفظ بـresolve/reveal admin controls.
- [ ] Production DB parity **blocked** حتى Production Supabase يكون active أو restore يتصرح به صراحة. لا تطبق migration قبل read-only parity + smoke-test plan.

## Production drift المعروف
Production كان فيها `case_mode` / `story_template_id` / `create_room_v2` قبل تسجيل كل ذلك في versioned migrations. parity لم تثبت لأن Production Supabase كان `INACTIVE` ومحاولة قراءة migration history انتهت connection timeout. لا تدّعِ أن أي migration حديث مطبق على Production بدون تحقق read-only.

## Player identity progress
- [x] `gender + caseRole` schema + snapshot/types regression.
- [x] gender-aware backend RPC contract: `create_room_v3` و`join_room_v2`.
- [x] backend gender E2E: all-male / all-female / mixed، مع إثبات أن mafia count يعتمد على عدد اللاعبين فقط.
- [x] gender create/join UI في create + room join + standalone `/join`، والـCI على `0278179096419e2fadbe06d4f3ef3362f405a189` أصبح `validate` ✅ و`qa` ✅.
- [x] nickname-only PlayerCard identity؛ الـCI على `37978b63c6ba558b436c5079c62d70548459204c` أصبح `CI` ✅ و`Game QA` ✅.
- [x] `caseRole` population في `install_case`؛ الـchecks على `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` أصبحت `validate` ✅ و`qa` ✅.
- [ ] AI generator contract تحول إلى `characters[{role,bio}]` في المسارين، مع regression guard على `3b25ae4d700eddae2949ba96564636016a2d55aa`، لكن **pending final CI**.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields في schema/install path والقضايا الجاهزة ما زالت تستخدم أسماءها القديمة.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract.
- standalone join gender contract.
- player card identity contract.
- generated case role identity contract للمسارين.
- case role install E2E contract.
- 60 deterministic full-game state simulations.
- story critic report mode.
- local Supabase player identity schema E2E.
- local Supabase gender RPC E2E.
- local Supabase full-game RPC E2E لـ5/6/7 لاعبين.
- eliminated Boss admin-controls E2E.

## Session 12 — 2026-09-10 — Populate caseRole during install_case
### نقطة البداية
- قُرئ هذا handoff أولًا وتعاملنا معه كمصدر الحقيقة الوحيد.
- تم فحص `37978b63c6ba558b436c5079c62d70548459204c`: `CI` و`Game QA` مكتملان بنجاح، لذلك nickname-only PlayerCard identity أصبح مغلقًا.
- Production parity بقي blocked ولم يُلمس.
- تم اختيار البند المحدد التالي فقط: بدء `caseRole` population في backend/install path، بدون generator rewrite أو UI أو story rewrite.

### Reproduction
- `players.case_role` موجود في schema و`room_snapshot` لكنه لا يُملأ عند `install_case`.
- `install_case` كان ينسخ فقط `character.name -> character_name` و`character.bio -> character_bio`، لذلك حتى case payload فيه role وصفي لا توجد له قناة تخزين.
- أضيف `scripts/qa/case-role-install-e2e.mjs` لاختبار case payload يحتوي `role` و`bio` فقط بدون fictional `name`، ثم يتأكد أن nickname الحقيقي لم يتغير وأن `caseRole` اتخزن وظهر في snapshot بينما `characterName` يظل null.

### ما تم
- [x] أضيف migration `20260910203000_populate_case_role_on_install.sql` يعيد تعريف `install_case` بأقل تغيير: `case_role = nullif(trim(v_character->>'role'), '')`.
- [x] أبقينا `character_name` و`character_bio` legacy-compatible؛ لم نحذف schema أو payload fields في هذه الجلسة.
- [x] دعم `role` اختياري، لذلك الحالات القديمة التي لا ترسله لا تتكسر وتظل `caseRole = null` مؤقتًا.
- [x] أضيف E2E يثبت أن أربعة nicknames حقيقية تظل كما هي، وأن أربعة roles وصفية تُملأ مرة واحدة لكل لاعب، وأن install ينجح بدون fictional characterName.
- [x] أضيف `Case role install contract` إلى Game QA بعد local Supabase startup وقبل full-game RPC E2E.
- [x] لم يتم حذف أو إضعاف أي اختبار موجود.
- [x] لم يتم أي Production deploy أو migration أو DB write.

### Commits
- `c929619dd79aafa6f7e66d87b4d5048f759beb5d` — populate optional case role in `install_case`.
- `1f79d31beea9f08080436c45b449816682c87138` — case-role install regression E2E.
- `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` — run case-role install regression in Game QA.

### Evidence / checks
- prerequisite `37978b63...`: `CI` ✅ و`Game QA` ✅.
- checks على `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` أصبحت `validate` ✅ و`qa` ✅؛ backend caseRole install support مغلق.
- لم يتم deploy إلى Production.

### Newly discovered risks
- الـAI generator وJSON schema كانا يعرفان `characters[{name,bio}]` فقط ولا ينتجان `role`.
- ما زال `character_name` legacy field يُملأ إذا وصل `name`.
- ترتيب إسناد الشخصيات للاعبين داخل `install_case` عشوائي كما كان؛ الاختبار يثبت completeness/identity preservation وليس mapping ثابتًا إلى nickname معين.

## Session 13 — 2026-09-10 — Generate caseRole instead of fictional names
### نقطة البداية
- قُرئ هذا handoff من default branch أولًا ولم يُستخدم chat memory كمصدر قرار.
- تم فحص أحدث main والـchecks للـcommit `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89`: `validate` ✅ و`qa` ✅، لذلك backend install prerequisite مغلق.
- Production parity ما زال blocked ولم يُلمس.
- تم اختيار بند واحد فقط من الأولوية الدقيقة: تحديث AI generator + validation/JSON schema إلى `role,bio` بدل fictional `name`.

### Reproduction
- `app/api/generate-case+api.ts` كان Zod validator وJSON schema فيهما `characters[{name,bio}]`، والـprompt يطلب أسماء شخصيات مصرية.
- `api/case-start.ts` كان JSON schema فيه `name,bio` أيضًا، ومرجع القصص المرسل للموديل يحتوي الأسماء القديمة.
- بالتالي حتى مع دعم `install_case` لـ`case_role`، مسار AI الطبيعي كان سيستمر في إنتاج `character_name` ويترك `caseRole` فارغًا.

### ما تم
- [x] `app/api/generate-case+api.ts`: Zod validator وJSON schema أصبحا يطلبان `role + bio`، uniqueness أصبح على roles، والـprompt يمنع اسم شخصية بديل ويثبت أن nickname هو الهوية.
- [x] `api/case-start.ts`: AI JSON schema أصبح `role + bio`، والـprompt يطلب role وصفيًا فقط؛ أسماء الشخصيات القديمة تُحذف من reference payload قبل إرسالها للموديل.
- [x] أبقينا preset/curated compatibility: `GeneratedCase` يسمح مؤقتًا بـ`role?` و`name?`، وserver validator يقبل واحدًا منهما حتى لا نكسر القصص الجاهزة في نفس الجلسة.
- [x] المساران يمران generated payload مباشرة إلى `install_case` بعد validation كما كانا؛ لا تغيير في mafia mechanics أو voting/game state.
- [x] أضيف `scripts/qa/generated-case-role-contract.mjs` ليثبت أن كلا المسارين يطلب `role,bio`، لا يطلب `name,bio`، يمرر generated payload إلى `install_case`، وأن Expo validator نفسه لا يحتوي fictional name.
- [x] أضيف regression الجديد إلى Game QA.
- [x] لم يتم حذف أو إضعاف أي اختبار.
- [x] لم يتم أي Production deploy أو migration أو DB write.

### Commits
- `3754e3d8af410e8113d3c1861a363e264a759584` — GeneratedCase compatibility for role payloads.
- `31156c09988568b0134090d04268266b63b6cf88` — Expo AI route generates roles instead of names.
- `6958a288a4b0e05199b36c01d338bf545235065a` — server AI route aligns with role payload and strips legacy names from references.
- `8c0e9ea866fa2c9343181db927810b45b2fb0fe9` — generated case role regression guard.
- `3b25ae4d700eddae2949ba96564636016a2d55aa` — run generated case role guard in Game QA.

### Evidence / checks
- prerequisite `0e5d5ad5...`: `validate` ✅ و`qa` ✅.
- على `3b25ae4d700eddae2949ba96564636016a2d55aa` وقت handoff: `validate` = `in_progress` و`qa` = `in_progress`، ولم يظهر failure بعد.
- Game QA workflow يعرض خطوة مستقلة باسم `Generated case role identity contract` قبل full-game simulations وSupabase E2E.
- لذلك **لا تعتبر AI role generator deploy-safe أو مغلقًا حتى تصبح checks Green**.
- لم يتم deploy إلى Production.

### Newly discovered risks / bugs
- يوجد مساران متوازيان لتوليد القضية (`app/api/generate-case+api.ts` و`api/case-start.ts`)؛ divergence بينهما ممكن، لذلك regression الجديد يغطي الاثنين معًا.
- القضايا الجاهزة الست ما زالت legacy `name + bio`، ولم تُحوّل في هذه الجلسة عمدًا.
- `install_case` يوزع character payloads عشوائيًا على اللاعبين. هذا لا يضر nickname identity، لكنه يعني أن **gender-aware role/bio لا يمكن ضمان مطابقته لجنس اللاعب** بمجرد تعديل prompt؛ نحتاج contract يربط payload باللاعب النهائي قبل صياغة gender-aware prose.
- لا يوجد live Gemini generation في CI؛ regression الحالي يثبت contract/schema/install handoff، وليس جودة مخرجات موديل حقيقية. Story critic يبقى طبقة منفصلة لجودة النص.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في كل create/join UI وربطه بالعقد الجديد.
- [x] جعل nickname الاسم الأساسي الظاهر دائمًا في PlayerCard.
- [x] backend `caseRole` install support.
- [ ] تحديث case generator إلى roles/bios بدون fictional names — **implemented on `3b25ae4d...`, pending final CI**.
- [ ] صياغة role/bio بحسب gender بدون تغيير mechanics؛ blocked منطقيًا على تثبيت mapping بين generated character payload واللاعب النهائي.
- [ ] إزالة legacy `character_name` بعد تحويل القضايا الجاهزة واختبارات compatibility في جلسة منفصلة.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `3b25ae4d700eddae2949ba96564636016a2d55aa` ثم حدّث handoff.
2. لو ظهر failure: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `validate` و`qa` Green: اعتبر AI `role,bio` generator contract مغلقًا، ونفّذ **بندًا واحدًا فقط**: أضف regression يثبت أن role/bio المخصصين لغويًا حسب gender يصلان للاعب الصحيح، ثم اعمل أصغر mapping change يلزم لذلك بدون تغيير mafia assignment/probability. لا تبدأ story rewrite شامل في نفس الجلسة.
4. لو اتضح أن mapping الآمن يحتاج redesign أكبر: وثّق blocker واقترح contract واضح بدل التخمين.
5. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
