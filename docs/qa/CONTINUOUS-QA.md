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

## Session 7 — 2026-09-10 — Player identity schema contract
### نقطة البداية
- قرأت هذا handoff أولًا.
- آخر main قبل الجلسة: `c59a2133d3db42563a32a33ae74e28980968d8d1`.
- checks عليه: `validate` ✅ و`qa` ✅.
- Production parity ما زالت blocked؛ أعلى أولوية قابلة للتنفيذ كانت تصميم `gender + caseRole` schema مع regression tests قبل UI.

### ما تم
- [x] أضيف versioned migration: `supabase/migrations/20260910130000_player_identity_schema.sql`.
- [x] أضيف `players.gender` nullable مع constraint يسمح فقط `male | female | null`.
- [x] أضيف `players.case_role` nullable.
- [x] الحقول nullable عمدًا للحفاظ على backward compatibility مع create/join الحالية قبل UI wiring.
- [x] `room_snapshot.me` و`room_snapshot.players` يرجعان `gender` و`caseRole` صراحة.
- [x] TypeScript أضيف له `PlayerGender = 'male' | 'female'` والعقد الجديد في `PlayerState` و`RoomSnapshot.me`.
- [x] أضيف `scripts/qa/player-identity-schema-e2e.mjs`.
- [x] الاختبار ينشئ Boss ولاعب عبر الـRPCs القديمة ويثبت أن الجيم تظل متوافقة وأن الحقول الجديدة موجودة بقيمة null قبل wiring.
- [x] الاختبار يعمل أيضًا direct member read لـ`gender, case_role` عبر RLS الحالية لإثبات وجود الأعمدة فعليًا.
- [x] Game QA workflow يشغل Player identity schema contract على Supabase محلي نظيف قبل full-game E2E.
- [x] أثناء المراجعة تم اكتشاف syntax bug في أول نسخة من migration (قوس ناقص في eliminations aggregate) وتم إصلاحه فورًا بدل انتظار CI.

### Commits
- `6bbc470e828d988a4a67e3df3830736b7b15a7e3` — أول migration draft.
- `7644fd0ccec236fbed426b668be2cba141695759` — إصلاح syntax قبل الاعتماد.
- `62e330076d67ee7763a491b402e920ade3af3fad` — TypeScript identity contract.
- `2b1c1cbd181c8f49b94bb1636107f8e4128afcd9` — identity schema E2E.
- `3c3e8768fa5476f6b18e30c3ea458459e50fe508` — تشغيل regression في Game QA.

### Evidence / checks
- baseline `c59a2133...`: `validate` ✅ و`qa` ✅.
- `3c3e8768...`: `validate` ✅ و`qa` ✅؛ identity schema contract مقفول Green.
- لم يتم أي Production migration أو deploy أو schema/data write.

### Newly discovered risks
- `character_name` و`character_bio` ما زالا legacy fields ويستمران في تمثيل القصة القديمة.
- `caseRole` موجود في snapshot لكنه لا يُملأ بعد؛ تعبئته يجب أن تأتي مع تحويل case generation/install contract وليس بقيمة مشتقة عشوائيًا.

## Session 8 — 2026-09-10 — Gender-aware backend RPC contract
### نقطة البداية
- قرأت هذا handoff أولًا وتعاملت معه كمصدر الحقيقة.
- آخر main وقت البداية كان handoff commit `f0346062a978c864df15bdce4851e8564b5b030f`، والـidentity contract المطلوب فحصه `3c3e8768...` صار `validate` ✅ و`qa` ✅.
- Production parity ما زالت blocked ولم تُلمس.
- أعلى أولوية قابلة للتنفيذ كانت backend create/join gender contract فقط، بدون UI.

### ما تم
- [x] أضيف migration جديد: `supabase/migrations/20260910141500_gender_rpc_contract.sql`.
- [x] أضيف `create_room_v3` الذي يستقبل `p_boss_gender` ويحفظه على player row الخاصة بالـBoss.
- [x] أضيف `join_room_v2` الذي يستقبل `p_gender` ويحفظه على اللاعب المنضم.
- [x] يتم قبول `male | female` فقط؛ أي قيمة أخرى تُرفض على مستوى RPC، بالإضافة إلى constraint الجدول الموجود بالفعل.
- [x] تم الحفاظ على `create_room`, `create_room_v2`, `join_room` بدون تغيير لتجنب كسر العملاء الحاليين أو خلق overload ambiguities في PostgREST.
- [x] أضيف `scripts/qa/player-gender-rpc-e2e.mjs`.
- [x] الـE2E يثبت حفظ gender في `room_snapshot.me` و`room_snapshot.players` قبل وبعد `install_case`.
- [x] الـE2E يرفض unsupported gender.
- [x] الـE2E يشغل ثلاث غرف 4 لاعبين: all-male وall-female وmixed، ويثبت أن كل واحدة تحصل على mafia واحدة فقط كما تحدد mechanics بعدد اللاعبين، وأن gender لا يتغير بعد role assignment.
- [x] Game QA workflow يشغل `Player gender RPC contract` على Supabase محلي نظيف قبل full-game RPC E2E.

### Commits
- `342b0d1c816e8ddbd197b0f935466679d40c62ff` — gender-aware RPC migration.
- `df714ed303dec1ceb0888d9a40f1e5809e4d0790` — gender RPC E2E.
- `08d7a7ace8ed44202354da83a0148b1a0ab1bb35` — تشغيل regression في Game QA.

### Evidence / checks
- prerequisite `3c3e8768...`: `validate` ✅ و`qa` ✅.
- checks على `08d7a7ac...` وقت إغلاق الجلسة: `validate` in_progress و`qa` in_progress، ولا يوجد failure ظاهر حتى آخر فحص.
- لذلك **لا تعتبر gender RPC contract مغلقًا أو deploy-safe حتى تصبح checks Green**.
- لم يتم أي Production migration أو deploy أو schema/data write.

### Newly discovered risks
- الـUI ما زالت تستعمل `create_room_v2` و`join_room`، لذلك gender لن يدخل من المنتج قبل UI wiring؛ هذا مقصود لأن هذه الجلسة backend-only.
- اختبار role independence يثبت invariance للعدد المتوقع للمافيا عبر all-male/all-female/mixed rooms ويثبت بقاء gender ثابتًا بعد `install_case`; لا يعتمد على randomness لتقرير أي لاعب بعينه يصبح mafia.
- `caseRole` ما زال nullable وغير مُعبأ؛ لم يُخلط مع هذه الجلسة حتى لا تتوسع عن بند واحد.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests — **pending final CI result for `08d7a7ac...`**.
- [ ] إضافة اختيار gender في create/join UI بعد ثبات backend contract.
- [ ] جعل nickname الاسم الأساسي الظاهر دائمًا.
- [ ] تحويل story character إلى caseRole مرتبط باللاعب بدل fictional name.
- [ ] تحديث case generator/install schema إلى roles/bios بدون fictional names.
- [ ] صياغة role/bio بحسب gender بدون تغيير mechanics.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `08d7a7ace8ed44202354da83a0148b1a0ab1bb35`.
2. لو أي check فشل: أصلح **أول failure فقط** مع regression مناسب، ثم حدّث هذا الملف.
3. لو `validate` و`qa` Green: اعتبر gender backend contract مغلقًا، ونفّذ **بندًا واحدًا فقط**: wiring اختيار gender في create/join UI إلى `create_room_v3` و`join_room_v2` مع regression contract يمنع الرجوع للـRPCs القديمة في المسار الجديد. لا تبدأ caseRole/story rewrite في نفس الجلسة.
4. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
