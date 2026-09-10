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
- [x] gender create/join UI في create + room join + standalone `/join`.
- [x] nickname-only PlayerCard identity.
- [x] `caseRole` population في `install_case`.
- [x] AI generator contract تحول إلى `characters[{role,bio}]` في المسارين؛ checks على `3b25ae4d700eddae2949ba96564636016a2d55aa`: `validate` ✅ و`qa` ✅.
- [x] gender-aware role/bio install contract على `21003ba17f107e019d469c97a855951b7e5f7b6c`; checks أصبحت `validate` ✅ و`qa` ✅.
- [ ] AI generator gender variants implementation على `6d7ea4db2dc9df164d06bd77d9afaa8611b34124`; checks ما زالت running عند إغلاق Session 15.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields، والقضايا الجاهزة ما زالت legacy names.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract.
- standalone join gender contract.
- player card identity contract.
- generated case schema/prompt/install handoff contract للمسارين.
- case role install E2E contract.
- gender-aware case wording install E2E contract.
- 60 deterministic full-game state simulations.
- story critic report mode.
- local Supabase player identity schema E2E.
- local Supabase gender RPC E2E.
- local Supabase full-game RPC E2E لـ5/6/7 لاعبين.
- eliminated Boss admin-controls E2E.

## Sessions المغلقة المختصرة
- Session 12: أضيف `caseRole` إلى `install_case` مع local Supabase regression؛ checks على `0e5d5ad5039d6196ebbb89ec74d8bc520c37ac89` Green.
- Session 13: AI routes تحولت من fictional `name` إلى `role + bio`، مع guard يغطي المسارين؛ checks على `3b25ae4d700eddae2949ba96564636016a2d55aa` Green.
- Session 14: `install_case` أصبح يختار optional `roleByGender` / `bioByGender` بعد player shuffle، بدون تغيير `order by random()` أو `mafiaCharacterIndexes`; checks على `21003ba17f107e019d469c97a855951b7e5f7b6c` Green.

## Session 15 — 2026-09-11 — AI generator gender wording variants
### نقطة البداية
- قُرئ هذا handoff من default branch أولًا وتعاملنا معه كمصدر الحقيقة.
- أحدث main وقت البداية كان `19fc2109eb3e14f540bd5cad5e2818504b087cb3`.
- فُحصت checks للـcommit `21003ba17f107e019d469c97a855951b7e5f7b6c`: `validate` ✅ و`qa` ✅، لذلك gender-aware install contract أُغلق قبل بدء بند جديد.
- Production parity بقي blocked ولم يُلمس.

### Reproduction / design finding
- generator schemas في `app/api/generate-case+api.ts` و`api/case-start.ts` كانت ما زالت تطلب `characters[{role,bio}]` فقط، لذلك live AI cases لا تنتج `roleByGender` / `bioByGender` رغم أن `install_case` يقدر يستهلكهم.
- `api/case-start.ts` يستخدم نفس `validateCase` للـpreset ولـAI؛ جعل gender variants إلزامية بلا تمييز كان سيكسر القضايا الجاهزة legacy.

### ما تم
- [x] كلا AI JSON schemas يطلبان الآن `role`, `bio`, `roleByGender.{male,female}`, `bioByGender.{male,female}`.
- [x] Expo route Zod validator يفرض وجود male/female variants.
- [x] server route يفرض gender variants على AI generation فقط (`requireGenderVariants=true`) ويبقي preset compatibility كما هي.
- [x] prompts في المسارين تنص بوضوح أن male/female لنفس character يجب أن يحافظا على نفس الدور الدلالي ونفس الحقائق والدافع والفرصة ودرجة الاشتباه، ويختلفا لغويًا فقط.
- [x] prompts تمنع استخدام gender في اختيار `mafiaCharacterIndexes`.
- [x] تم توسيع `scripts/qa/generated-case-role-contract.mjs` بدل إضافة اختبار مكرر: يثبت schema + prompt + direct `p_case: generated` handoff، ويتحقق أن migration `20260910233000_gender_case_text_variants.sql` يستهلك variants مع بقاء `order by random()` و`mafiaCharacterIndexes`.
- [x] لم يُحذف أو يُضعف أي اختبار.
- [x] لم يحدث Production deploy أو migration أو DB write.

### Commit
- `6d7ea4db2dc9df164d06bd77d9afaa8611b34124` — generate gender-aware case wording variants and extend regression contract.

### Evidence / checks
- prerequisite `21003ba17f107e019d469c97a855951b7e5f7b6c`: `validate` ✅ و`qa` ✅.
- checks على `6d7ea4db2dc9df164d06bd77d9afaa8611b34124` عند آخر فحص: `validate` in_progress و`qa` in_progress، ولا يوجد failure ظاهر بعد.
- لذلك التغيير **ليس deploy-safe بعد** ولا يوجد أي Production deploy.

### Newly discovered risks / bugs
- لا يوجد semantic equivalence test فعلي على نص AI الناتج؛ regression الحالي يثبت العقد والـprompt، وليس جودة كل generation. إضافة model-dependent CI ستكون flaky ومكلفة، لذلك لم تُضف في هذه الجلسة.
- القضايا الجاهزة ما زالت legacy ولا تحتوي gender variants؛ هذا مقصود للحفاظ على compatibility، وتحويلها بند منفصل.
- `GeneratedCase` TypeScript type ما زال لا يصرّح بالـvariant fields صراحة، لكن server validator يعيد payload كـ`GeneratedCase` من `any` والـruntime/install handoff يعمل. تحديث النوع ممكن كتحسين contract لاحق، وليس blocker للـruntime الحالي.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في كل create/join UI وربطه بالعقد الجديد.
- [x] جعل nickname الاسم الأساسي الظاهر دائمًا في PlayerCard.
- [x] backend `caseRole` install support.
- [x] تحديث case generator إلى roles/bios بدون fictional names.
- [x] gender-aware install contract Green.
- [ ] إغلاق AI gender variants بعد Green CI.
- [ ] إزالة legacy `character_name` بعد تحويل القضايا الجاهزة واختبارات compatibility في جلسة منفصلة.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `6d7ea4db2dc9df164d06bd77d9afaa8611b34124` أولًا.
2. لو ظهر failure: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `validate` و`qa` Green: أغلق AI gender variants، ثم نفّذ **بندًا واحدًا فقط**: أضف `roleByGender` و`bioByGender` إلى `GeneratedCase` TypeScript contract مع regression compile/static يثبت التوافق، من غير UI أو story rewrite أو تغيير mafia assignment.
4. بعد إغلاق type contract في جلسة لاحقة، ارجع لأول بند Story Quality قابل للقياس بدل توسيع identity بلا داعٍ.
5. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
