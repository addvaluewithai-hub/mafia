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
- checks على `3c3e8768...` وقت إغلاق الجلسة: `validate` in_progress و`qa` in_progress، ولا يوجد failure ظاهر حتى آخر فحص.
- لذلك **لا تعتبر Player identity schema مغلقة أو deploy-safe حتى تصبح checks Green**.
- لم يتم أي Production migration أو deploy أو schema/data write.

### Newly discovered risks
- لا يوجد حتى الآن RPC يسمح بتسجيل gender؛ لذلك الحقل يظل null في مسار المنتج الحالي، وهذا مقصود في هذه الجلسة.
- `character_name` و`character_bio` ما زالا legacy fields ويستمران في تمثيل القصة القديمة؛ لم يتم تغيير سلوك القصص في هذه الجلسة.
- migration يعرض `caseRole` في snapshot لكنه لا يملؤه بعد؛ تعبئته يجب أن تأتي مع تحويل case generation/install contract وليس بقيمة مشتقة عشوائيًا.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression — **pending final CI result for `3c3e8768...`**.
- [ ] إضافة gender إلى create/join contract مع regression tests، بدون تأثير على secret role assignment.
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
1. افحص checks للـcommit `3c3e8768fa5476f6b18e30c3ea458459e50fe508`.
2. لو أي check فشل: أصلح **أول failure فقط** مع regression مناسب، ثم حدّث هذا الملف.
3. لو `validate` و`qa` Green: اعتبر identity schema contract مغلقًا، ونفّذ **بندًا واحدًا فقط**: إضافة gender إلى backend create/join RPC contract مع E2E يثبت حفظه واسترجاعه وأن توزيع secret roles لا يعتمد عليه. لا تعمل UI في نفس الجلسة.
4. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
