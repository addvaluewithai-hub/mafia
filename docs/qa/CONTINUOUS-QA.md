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
- [x] backend contract CI على `08d7a7ace8ed44202354da83a0148b1a0ab1bb35`: `validate` ✅ و`qa` ✅.
- [ ] `caseRole` ما زال nullable وغير مُعبأ.
- [ ] `character_name` و`character_bio` ما زالا legacy story identity fields.

## Session 9 — 2026-09-10 — Gender create/join UI wiring
### نقطة البداية
- قُرئ هذا handoff أولًا وتعاملنا معه كمصدر الحقيقة.
- تم فحص `08d7a7ace8ed44202354da83a0148b1a0ab1bb35`: `validate` ✅ و`qa` ✅، لذلك backend gender contract اعتُبر مغلقًا.
- Production parity ما زالت blocked ولم تُلمس.
- أعلى بند قابل للتنفيذ كان wiring اختيار gender في create/join UI فقط.

### ما تم
- [x] أضيف reusable `components/gender-picker.tsx` بقيم `male | female` وعرض مصري بسيط `ذكر / أنثى`.
- [x] create UI يطلب gender قبل إنشاء الروم ويشرح صراحة أنه للصياغة فقط ولا يغير الدور أو فرص الفوز.
- [x] create UI انتقل من `create_room_v2` إلى `create_room_v3` ويرسل `p_boss_gender`.
- [x] join UI يطلب gender قبل الدخول ويشرح أنه للصياغة فقط.
- [x] `joinRoom` أصبح يتطلب `PlayerGender` ويستعمل `join_room_v2` ويرسل `p_gender`.
- [x] أضيف `scripts/qa/gender-ui-contract.mjs` كـregression guard يمنع رجوع create إلى `create_room_v2` أو join إلى `join_room` ويثبت وجود الـpicker وتمرير gender.
- [x] Game QA workflow أصبح يشغل `Gender UI RPC contract` قبل محاكاة الجيم وSupabase E2E.
- [x] لم يتم أي Production deploy أو migration أو schema/data write.

### Commits
- `2b5c967d57ef544a3a288668f2759ccf5fd45168` — reusable gender picker.
- `21411f4fd3e65904533ccafbca5b288d24ce89be` — create UI → `create_room_v3`.
- `dad4bc69cde4f9dd45e8605529b50c9b48924b57` — join client → `join_room_v2`.
- `7f3a7db623c590354cc4b576d749514d85234b3e` — join UI gender selection.
- `26e8bee64ab9de7ae0eb473968291b4edfe62c97` — gender UI regression guard.
- `ab515a700cbc6855439d8a1000c91a922580684b` — run gender UI guard in Game QA.

### Evidence / checks
- prerequisite backend commit `08d7a7ac...`: `validate` ✅ و`qa` ✅.
- checks على `ab515a70...` وقت إغلاق الجلسة: `validate` queued و`qa` queued؛ لا يوجد failure ظاهر بعد، لكن **لا تعتبر UI wiring مغلقًا أو deploy-safe حتى تصبح checks Green**.
- لم يتم deploy إلى Production.

### Newly discovered risks
- الـUI regression الحالي static contract guard؛ الـbackend gender behavior نفسه مغطى بالفعل بـSupabase E2E من Session 8. لو ظهر UI runtime-specific bug لاحقًا، أضف interaction-level regression بدل توسيع static guard بلا داعٍ.
- `caseRole` ما زال غير مُعبأ، لذلك nickname ما زال يظهر بجانب legacy fictional character name في بعض أجزاء اللعبة.
- Production parity blocker ما زال قائمًا ومستقلًا عن هذا التغيير.

## P1 — Player identity backlog
- [x] تصميم `gender + caseRole` schema + snapshot/types/regression.
- [x] إضافة gender إلى backend create/join contract مع regression tests.
- [x] إضافة اختيار gender في create/join UI وربطه بالعقد الجديد — **pending final CI result for `ab515a70...`**.
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
1. افحص checks للـcommit `ab515a700cbc6855439d8a1000c91a922580684b` ثم أحدث handoff commit.
2. لو أول failure ظهر: أصلح **أول failure فقط** مع regression مناسب، ولا تبدأ بندًا جديدًا.
3. لو `validate` و`qa` Green: اعتبر gender UI wiring مغلقًا، ونفّذ **بندًا واحدًا فقط**: اجعل nickname هو الاسم الأساسي الظاهر دائمًا في player cards، مع regression يثبت أن fictional `characterName` لا يظهر كهوية اللاعب. لا تبدأ caseRole schema population أو story rewrite في نفس الجلسة.
4. لا تلمس Production parity blocker إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
