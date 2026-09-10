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
- [ ] `caseRole` population في `install_case` مطبق على `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` لكن **pending final CI**.
- [ ] generator/story payload ما زال لا يولد `role`؛ لذلك الحالات الحالية ستستمر مؤقتًا بـ`caseRole = null` حتى يتغير generator/schema في جلسة منفصلة.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields في schema/install path.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract.
- standalone join gender contract.
- player card identity contract.
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
- checks على `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` وقت تحديث handoff: `CI` = `in_progress` و`Game QA` = `in_progress`، بدون failure ظاهر في أول فحص.
- لذلك **لا تعتبر caseRole install population مغلقًا أو deploy-safe حتى تصبح checks Green**.
- لم يتم deploy إلى Production.

### Newly discovered risks
- الـAI generator الحالي وJSON schema الحاليان يعرفان `characters[{name,bio}]` فقط ولا ينتجان `role`; لذلك migration وحده لا يملأ caseRole في gameplay الحالي. هذا مقصود لتقليل نطاق الجلسة، والخطوة التالية بعد Green CI هي تحديث generator/schema فقط.
- ما زال `character_name` legacy field يُملأ إذا وصل `name`; regression الجديد يثبت فقط أن backend لا يحتاجه عندما يرسل payload حديث `role` بدون `name`.
- ترتيب إسناد الشخصيات للاعبين داخل `install_case` عشوائي كما كان؛ الاختبار يثبت completeness/identity preservation وليس mapping ثابتًا إلى nickname معين.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في كل create/join UI وربطه بالعقد الجديد.
- [x] جعل nickname الاسم الأساسي الظاهر دائمًا في PlayerCard.
- [ ] تحويل story character إلى `caseRole` مرتبط باللاعب بدل fictional name — **backend install support مطبق، pending final CI؛ generator ما زال legacy**.
- [ ] تحديث case generator/install schema إلى roles/bios بدون fictional names.
- [ ] صياغة role/bio بحسب gender بدون تغيير mechanics.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` ثم حدّث handoff.
2. لو ظهر failure: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `CI` و`Game QA` Green: اعتبر backend `caseRole` install support مغلقًا، ونفّذ **بندًا واحدًا فقط**: حدّث AI case generator + validation/JSON schema ليولد `characters[{role,bio}]` بدل الاعتماد على fictional `name`، مع regression يثبت أن generated payload يقبل install path الجديد ويحافظ على nickname كهوية. لا تبدأ gender-aware prose أو story rewrite شامل في نفس الجلسة.
4. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
