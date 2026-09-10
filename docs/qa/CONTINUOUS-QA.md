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
- [ ] nickname-only player-card identity change مطبق على `37978b63c6ba558b436c5079c62d70548459204c` لكن **pending final CI**.
- [ ] `caseRole` ما زال nullable وغير مُعبأ.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields في schema/install path، حتى لو `characterName` لم يعد ظاهرًا كاسم ثانٍ في PlayerCard.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract.
- standalone join gender contract.
- player card identity contract.
- 60 deterministic full-game state simulations.
- story critic report mode.
- local Supabase player identity schema E2E.
- local Supabase gender RPC E2E.
- local Supabase full-game RPC E2E لـ5/6/7 لاعبين.
- eliminated Boss admin-controls E2E.

## Session 11 — 2026-09-10 — Nickname-only player identity in PlayerCard
### نقطة البداية
- قُرئ هذا handoff أولًا وتعاملنا معه كمصدر الحقيقة الوحيد.
- تم فحص `0278179096419e2fadbe06d4f3ef3362f405a189`: كل check runs الظاهرة مكتملة بنجاح؛ `validate` ✅ و`qa` ✅.
- لذلك تم إغلاق gender UI wiring والانتقال للبند المحدد التالي فقط: nickname كهوية اللاعب الظاهرة في PlayerCard.
- Production parity بقي blocked ولم يُلمس.

### Reproduction
- `app/room/[code].tsx` كان يعرض `{player.nickname}` كاسم رئيسي ثم يعرض `{player.characterName}` تحته بلون مميز في الـnon-compact PlayerCard.
- هذا يخلق اسم هوية ثانٍ ويخالف قاعدة أن nickname الحقيقي هو الهوية الظاهرة.
- أضيف `scripts/qa/player-card-identity-contract.mjs` قبل الإصلاح؛ الاختبار يثبت أن PlayerCard يعرض nickname ويرفض أي render لـ`{player.characterName}` داخل component boundary.

### ما تم
- [x] أزيل عرض `player.characterName` من PlayerCard فقط.
- [x] nickname بقي الاسم الوحيد المعروض كهوية اللاعب في البطاقة.
- [x] `characterBio` بقي ظاهرًا مؤقتًا كما كان؛ لم نحوله إلى `caseRole` ولم نغير story schema لأن ذلك خارج نطاق هذه الجلسة.
- [x] أضيف `Player card identity contract` إلى `.github/workflows/game-qa.yml` قبل full-game simulations.
- [x] لم يتم حذف أو إضعاف أي اختبار موجود.
- [x] لم يتم أي Production deploy أو migration أو DB write.

### Commits
- `87aab97d715dacc99f07efc45ddd94fa4781aed5` — regression reproducer/guard for PlayerCard identity.
- `37a22d382059b5d475ebc906e9fa2960e43470d4` — remove fictional `characterName` render from PlayerCard.
- `37978b63c6ba558b436c5079c62d70548459204c` — run PlayerCard identity contract in Game QA.

### Evidence / checks
- prerequisite `02781790...`: `validate` ✅ و`qa` ✅.
- checks على `37978b63c6ba558b436c5079c62d70548459204c` وقت إغلاق الجلسة: `validate` = `in_progress` و`qa` = `in_progress`، ولا يوجد failure ظاهر في أول فحص.
- لذلك **لا تعتبر nickname identity change مغلقًا أو deploy-safe حتى تصبح checks Green**.
- لم يتم deploy إلى Production.

### Newly discovered risks
- إزالة fictional name من PlayerCard لا تعني أن legacy `character_name` انتهى من النظام؛ ما زال يُملأ في install/story path وقد يظهر مستقبلًا في surface أخرى إذا لم توجد guards.
- `characterBio` حاليًا وصف مرتبط بالاسم الخيالي القديم في بعض القصص؛ إبقاؤه يمنع توسيع نطاق الجلسة لكنه يجعل `caseRole` migration هو الخطوة الطبيعية التالية بعد ثبوت CI.
- الـstatic identity guard يحمي الـPlayerCard الحالي فقط؛ أي player identity component جديد يجب أن يتبع نفس القاعدة أو يدخل regression coverage.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في كل create/join UI وربطه بالعقد الجديد.
- [ ] جعل nickname الاسم الأساسي الظاهر دائمًا — **التغيير مطبق، pending final CI على `37978b63...`**.
- [ ] تحويل story character إلى `caseRole` مرتبط باللاعب بدل fictional name.
- [ ] تحديث case generator/install schema إلى roles/bios بدون fictional names.
- [ ] صياغة role/bio بحسب gender بدون تغيير mechanics.

## P1 — Story quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clues بمصري بسيط.
- [ ] suspects × clues matrix لكل قصة.
- [ ] منع clue واحد من كشف المافيا قبل المرحلة الأخيرة، وحتى الأخير يحتاج ربطًا بما قبله.

## الأولوية الدقيقة للجلسة التالية
1. افحص checks للـcommit `37978b63c6ba558b436c5079c62d70548459204c` ثم أحدث handoff.
2. لو ظهر failure: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `validate` و`qa` Green: اعتبر nickname PlayerCard identity مغلقًا، ونفّذ **بندًا واحدًا فقط**: ابدأ `caseRole` population في backend/install path مع regression يثبت أن الدور الوصفي مرتبط بالـnickname ولا يحتاج fictional `characterName`. لا تبدأ story rewrite شامل في نفس الجلسة.
4. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
