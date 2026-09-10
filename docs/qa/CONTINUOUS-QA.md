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
- [ ] gender-aware role/bio install contract: implemented على `21003ba17f107e019d469c97a855951b7e5f7b6c` باستخدام optional `roleByGender` / `bioByGender`; full checks ما زالت running عند إغلاق Session 14.
- [ ] الـAI generator لا ينتج `roleByGender` / `bioByGender` بعد؛ لذلك الـbackend contract الجديد غير مستخدم في live generated cases حتى جلسة لاحقة.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields، والقضايا الجاهزة ما زالت legacy names.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract.
- standalone join gender contract.
- player card identity contract.
- generated case role identity contract للمسارين.
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
- Session 13: AI routes تحولت من fictional `name` إلى `role + bio`، مع guard يغطي `app/api/generate-case+api.ts` و`api/case-start.ts`. checks على `3b25ae4d700eddae2949ba96564636016a2d55aa` أصبحت `validate` ✅ و`qa` ✅. القضايا الجاهزة بقيت legacy عمدًا.

## Session 14 — 2026-09-10 — Gender-aware case wording without changing mafia assignment
### نقطة البداية
- قُرئ هذا handoff من default branch أولًا وتعاملنا معه كمصدر الحقيقة.
- أحدث main وقت البداية كان `96152a2915b46a082db58180c2f03b74cc90c251`، والـgenerator implementation المستهدف كان `3b25ae4d700eddae2949ba96564636016a2d55aa`.
- فُحصت checks للـcommit `3b25ae4d...`: `validate` ✅ و`qa` ✅، لذلك Session 13 أُغلقت قبل بدء بند جديد.
- Production parity بقي blocked ولم يُلمس.

### Reproduction / design finding
- `install_case` كان يختار player order بـ`order by random()` ثم يربط character index باللاعب النهائي.
- ربط character كامل بجنس محدد ثم اختيار mafia من `mafiaCharacterIndexes` كان ممكن يخلق اعتمادًا غير مقصود بين gender واحتمال المافيا.
- لذلك لم نغيّر mapping أو player shuffle أو mafia indexes. بدل ذلك عرّفنا optional wording variants داخل **نفس character**: `roleByGender.{male,female}` و`bioByGender.{male,female}`. بعد الإسناد العشوائي الموجود أصلًا، `install_case` يختار الصياغة المطابقة لـ`player.gender` فقط.
- legacy `role` و`bio` يظلان fallback، وبالتالي القضايا الحالية لا تتكسر.

### ما تم
- [x] migration `20260910233000_gender_case_text_variants.sql` يعيد تعريف `install_case` لاختيار role/bio variant حسب gender بعد الإسناد العشوائي.
- [x] منطق `order by random()` لم يتغير.
- [x] منطق `mafiaCharacterIndexes -> player_roles.role` لم يتغير.
- [x] أضيف `scripts/qa/gender-case-text-install-e2e.mjs`: روم mixed gender، كل character يحمل male/female variants، ويثبت أن كل لاعب يستقبل الصياغة المناسبة وأن mafia count يظل المتوقع.
- [x] أضيف `Gender-aware case wording install contract` إلى Game QA بعد local Supabase startup.
- [x] لم يُحذف أو يُضعف أي اختبار.
- [x] لم يحدث Production deploy أو migration أو DB write.

### Commits
- `22168281984f21564a524dab4fb434c07eff2dde` — gender-aware wording selection in `install_case`.
- `49470b9d537d704d026f1c82a482bd53fbb333f5` — local Supabase regression for gender-specific role/bio wording.
- `21003ba17f107e019d469c97a855951b7e5f7b6c` — run regression in Game QA.

### Evidence / checks
- prerequisite `3b25ae4d700eddae2949ba96564636016a2d55aa`: `validate` ✅ و`qa` ✅.
- checks على `21003ba17f107e019d469c97a855951b7e5f7b6c` عند آخر فحص: `validate` in_progress، `qa` in_progress، ولا يوجد failure ظاهر بعد.
- لذلك التغيير **ليس deploy-safe بعد** ولا يوجد أي Production deploy.

### Newly discovered risks / bugs
- الـbackend الآن يقدر يحافظ على mafia randomness ويختار الصياغة حسب gender، لكن AI schemas/prompts الحالية لا تنتج `roleByGender` / `bioByGender`؛ live AI cases ستستمر باستخدام `role` / `bio` المحايدين حتى تحديث generator في جلسة منفصلة.
- `character_bio` ما زال اسم column legacy رغم أنه الآن قد يحمل bio صحيحًا حسب gender؛ إزالة/إعادة تسمية legacy schema ليست ضمن هذه الجلسة.
- regression يثبت عدم تغير **mafia count** ويعتمد على بقاء shuffle/index logic نفسها structurally؛ لا يوجد statistical probability test لأنه سيكون flaky وغير مناسب للـCI.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في كل create/join UI وربطه بالعقد الجديد.
- [x] جعل nickname الاسم الأساسي الظاهر دائمًا في PlayerCard.
- [x] backend `caseRole` install support.
- [x] تحديث case generator إلى roles/bios بدون fictional names.
- [ ] إغلاق gender-aware install بعد Green CI، ثم تحديث generator ليولد male/female wording variants لنفس الدور بدون ربط mafia probability بالجنس.
- [ ] إزالة legacy `character_name` بعد تحويل القضايا الجاهزة واختبارات compatibility في جلسة منفصلة.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `21003ba17f107e019d469c97a855951b7e5f7b6c` أولًا.
2. لو ظهر failure: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `validate` و`qa` Green: أغلق gender-aware install contract، ثم نفّذ **بندًا واحدًا فقط**: حدّث AI generator contract في المسارين ليولد `roleByGender` و`bioByGender` لنفس الدور الدلالي مع fallback compatibility، وأضف regression يثبت schema/prompt/install handoff. لا تغيّر mafia assignment ولا تبدأ story rewrite شامل.
4. لو generator variants تحتاج إعادة تصميم أكبر أو تسبب schema incompatibility: وثّق blocker ولا تخمن.
5. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
