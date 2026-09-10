# آخر خيط — Continuous QA Handoff

> هذا الملف هو مصدر الحقيقة لكل جلسة QA متتابعة. كل جلسة تقرأه أولًا، تنفذ أعلى أولوية قابلة للتنفيذ، ثم تحدّثه قبل أن تنتهي.

## الهدف
نوصل للعبة كاملة قابلة للعب من أول إنشاء الروم حتى إعلان الفائز، بدون deadlocks أو حالات واجهة غامضة، وبقصص مصرية طبيعية وممتعة وصعبة بالاستنتاج لا بالتعقيد اللغوي.

## قواعد الجودة غير القابلة للتفاوض
1. أي مسار أساسي لازم يتجرب end-to-end: إنشاء روم → دخول كل اللاعبين → توزيع الأدوار → عرض القضية → الأدلة → التصويت → التعادل → السجن → الجولة التالية → النهاية.
2. أسماء اللاعبين الحقيقية هي الهوية الظاهرة في اللعبة. شخصية القضية تكون دور/وصف مرتبط باللاعب، مش اسم خيالي يحل محل اسمه.
3. نجمع جنس اللاعب (ذكر/أنثى) ونستخدمه فقط لضبط صياغة الدور والوصف لغويًا؛ لا يؤثر على الدور السري أو فرص الفوز.
4. اللغة مصرية بسيطة تُقال بصوت عالٍ بسهولة. ممنوع مصطلحات تقنية غير ضرورية أو جمل تحقيقية متكلفة.
5. صعوبة القضية تأتي من ربط أدلة متعددة واحتمالات حقيقية، لا من معلومات ناقصة أو مصطلحات غامضة أو twist بلا تمهيد.
6. لا يوجد clue واحد يكشف المافيا منفردًا قبل المرحلة الأخيرة، وحتى الدليل الأخير يحتاج ربطًا بما قبله.
7. الـBoss لاعب كامل ولا يرى الحل أو أدوار الآخرين، ويظل قادرًا على إدارة الجولة حتى لو خرج من اللعب.
8. كل bug متكرر يتحول إلى automated regression test قبل اعتبار الإصلاح منتهيًا.
9. لا ننشر Production من QA loop لمجرد أن TypeScript أخضر؛ لازم الاختبار الخاص بالمسار المتغير يعدي.
10. ممنوع تخفيف اختبار فاشل لمجرد الحصول على CI أخضر؛ إما نصلح المنتج أو نصلح اختبارًا ثبت أنه نفسه غير صحيح مع توثيق السبب.

## ملاحظات المستخدم المؤكدة
- التصويت كان يدخل في حالة يتوقف فيها اللعب ولا يستطيع اللاعبون التصويت.
- اللعبة تعرض أسماء شخصيات القصة بدل أن تجعل أسماء اللاعبين أنفسهم مركز التجربة.
- لا يوجد جنس للاعب، وبالتالي الصياغة قد تكون غير مناسبة للشخص.
- القصص الجاهزة لغتها أصعب من اللازم وبعض تفاصيلها غير طبيعية للمصري العادي.
- الحبكات والأدلة تحتاج إعادة تقييم نقدية، وليس مجرد زيادة صعوبة.
- نحتاج محاكاة آلية للجيم الكامل وCritic مستقل للقصص.

## ما اتقفل لحد الآن
### Session 1 — QA foundation
- Hotfix دفاعي للتصويت — `36e81b221d05bb36374390d231a236940759e629`.
- 60 محاكاة state كاملة لـ5/6/7 لاعبين.
- إصلاح bug في اختبار tie نفسه — `196b1c8f86ae1cfa0fdbaa0abe010600ad5bfac4`.
- Story critic scaffold.
- Game QA workflow: TypeScript + Expo Doctor + simulations + critic + local Supabase RPC E2E + artifacts.
- Local Supabase config + full-game RPC E2E.
- مزامنة جزء من DB/repo drift عبر `20260910074600_sync_case_mode_and_snapshot.sql`.
- Expo Doctor drift fix — `a50800e757c517ce8631b3b23b5f0adf48dc0aa5`.

### Session 2 — server-authoritative vote state
- أضيف `phase` + `canVote` إلى `room_snapshot` عبر `20260910083000_server_authoritative_vote_phase.sql`.
- أضيف TypeScript contract وRPC regression coverage.
- الـlocal Supabase RPC E2E أصبح Green.

### Session 3 — authoritative vote UI
- واجهة التصويت أصبحت تعتمد على `snapshot.phase` و`snapshot.canVote` بدل counters محلية.
- أضيف `scripts/qa/vote-ui-contract.mjs` كـregression guard.
- CI للـwiring أصبح Green.

### Session 4 — reconnect vote state
- أضيف reconnect regression باستخدام fresh Supabase client لنفس anonymous session.
- يغطي قبل cast، بعد cast، بعد tie reset، بعد resolve، وبعد next round.
- `d9fc187c3854961bfd575c0c4da025a09c631ddb` أصبح `validate` ✅ و`qa` ✅.

### Session 5 — eliminated Boss retains admin control
- أضيف `scripts/qa/boss-eliminated-e2e.mjs`.
- السيناريو يجبر الـBoss على السجن، يثبت `isEliminated=true`, `isHost=true`, `canVote=false`، ويرفض `cast_vote` منه.
- يثبت أن الـBoss المسجون ما زال يقدر يعمل `reveal_next_round` و`resolve_vote`.
- commits: `2fdd8462cf88f1c68ceaa7468cd63e50484739d3` و`6cab1c56de726ddf0f97059d35883a0d046fb807`.

## Session 6 — 2026-09-10 — Production DB parity read-only audit
### نقطة البداية
- تم فحص checks للـcommit `6cab1c56de726ddf0f97059d35883a0d046fb807`.
- `validate` ✅ و`qa` ✅؛ بالتالي Boss-eliminated admin P0 مغلق رسميًا.
- أعلى أولوية بعده حسب handoff كانت Production DB/versioned migration parity كـread-only audit فقط.

### ما تم في هذه الجلسة
- [x] تم اكتشاف مشروع Supabase المتصل باسم `mafia`.
- [x] حالة المشروع وقت الفحص كانت `INACTIVE`.
- [x] تم إجراء محاولة قراءة فقط من `supabase_migrations.schema_migrations` لمقارنة applied versions مع migrations الموجودة في GitHub.
- [x] القراءة فشلت بـconnection timeout بسبب حالة المشروع غير النشطة.
- [x] لم يتم عمل restore/wake للمشروع تلقائيًا، لأنه تغيير operational في Production وقد يكون له أثر تكلفة/availability.
- [x] لم يتم تطبيق أي migration أو deploy أو schema/data write.
- [x] تم توثيق نتيجة التدقيق في `docs/qa/production-db-parity-audit-2026-09-10.md` — commit `c4fae02639f5500fd0ad9913fcf6747379dc4086`.

### ما ثبت
- eliminated-Boss P0 Green بالكامل على CI.
- GitHub يحتوي versioned migrations مرتبة حتى `20260910083000_server_authoritative_vote_phase.sql`.
- Production parity نفسها **غير مثبتة** لأن migration history لم يمكن قراءتها أثناء inactivity.

### ما لم يثبت بعد
- هل `20260910074600_sync_case_mode_and_snapshot.sql` مسجل/مطبق في Production.
- هل `20260910083000_server_authoritative_vote_phase.sql` مطبق في Production.
- هل Production `room_snapshot` يرجع فعليًا `phase` + `canVote` مثل local QA.

### Blocker
Production Supabase كان `INACTIVE` وread-only SQL probe انتهى connection timeout. لا تعمل restore من QA loop بدون تصريح واضح أو بدون أن يكون المشروع active أصلًا.

## تشخيص التصويت الحالي
المشكلة الأصلية كانت أن العميل يعيد استنتاج فتح التصويت من counters. السيرفر أصبح المصدر الصريح للحقيقة عبر `phase/canVote`، والواجهة تستهلكهما مباشرة. reconnect regression وBoss-eliminated regression أصبحا Green.

## تشخيص القصص
مثال «آخر بروفة» يحتوي على كلمات وتراكيب مثل: ريلاي، لسان قفل، تحليل الغبار، بصمة دخول للوحة الإضاءة. الهدف: **المعلومة تتفهم فورًا، معناها في اللغز هو الصعب.**

## Drift معروف
Production كانت تحتوي على تغييرات `case_mode` / `story_template_id` / `create_room_v2` لم تكن موجودة في migrations داخل GitHub. تم توثيقها في versioned migration، لكن لا تدّعِ أن Production migrated بدون قراءة migration history + smoke test. Migration الـphase كذلك لا تعتبر Production-applied حتى يثبت العكس.

## Backlog مرتب بالأولوية
### P0 — Functionality / Deadlocks
- [x] Hotfix دفاعي لـvote gating.
- [x] State-model full-game simulator لـ5/6/7 و60 تشغيلًا.
- [x] Real RPC E2E runner ضد local Supabase.
- [x] Server-authoritative `phase` + `canVote` + regression tests.
- [x] UI wiring إلى `phase/canVote` + CI guard.
- [x] refresh/reconnect vote-state regression Green.
- [x] eliminated-Boss admin regression Green على `6cab1c56de726ddf0f97059d35883a0d046fb807`.
- [ ] Production DB parity: **blocked until Production Supabase is active or restore is explicitly authorized**. لا تطبق migration قبل read-only parity + smoke-test plan.

### P1 — Player identity
- [ ] **أعلى أولوية قابلة للتنفيذ حاليًا:** تصميم `gender` + `caseRole` schema مع regression tests قبل UI.
- [ ] إضافة `gender` إلى player profile عند إنشاء/دخول الروم.
- [ ] جعل `nickname` هو الاسم الأساسي الظاهر دائمًا.
- [ ] تحويل شخصية القضية إلى `caseRole` بدل اسم خيالي يحل محل اسم اللاعب.
- [ ] توليد/اختيار صياغة role/bio مناسبة للجنس بدون تغيير ميكانيك اللعبة.
- [ ] منع أي clue من الاعتماد على اسم شخصية خيالي؛ الدليل يشير إلى اسم اللاعب الفعلي أو دوره بوضوح.
- [ ] تحديث AI schema بحيث ينتج roles/bios لا fictional names، ثم يركبهم السيرفر على اللاعبين بعد معرفة أسمائهم وجنسهم.

### P1 — Story quality
- [x] Critic heuristic scaffold موجود ويخرج تقريرًا آليًا.
- [ ] إعادة نقد الست قصص واحدة واحدة: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة premise/bio/clue بلغة مصرية محكية بسيطة قابلة للقراءة بصوت عالي.
- [ ] لكل قصة: suspects × clues review يوضح من يظل مشتبهًا بعد كل دليل ولماذا.
- [ ] اختبار: هل لاعب ذكي يقدر يحلها من clue واحد؟ لو نعم تفشل.
- [ ] اختبار: هل الحل يحتاج معلومة لم تظهر؟ لو نعم تفشل.
- [ ] Critic score من 10 لكل محور، والحد الأدنى للنشر 8/10 بدون أي محور أقل من 7.
- [ ] بعد إعادة الكتابة، حوّل story critic من report-only إلى strict gate.

### P2 — UX / Mobile
- [ ] شريط phase واضح: نقاش / تصويت / دفاع / انتظار Boss / نهاية.
- [ ] CTA واحد واضح في كل مرحلة، مع سبب مفهوم لو disabled.
- [ ] اختبارات mobile viewport لشاشات 360×800 و390×844 و430×932.
- [ ] رسائل الخطأ تعرض المشكلة والحل، لا `[object Object]` ولا صمت.

## QA automation الحالي
GitHub Action `Game QA` يعمل على push/PR ويستهدف:
1. TypeScript.
2. Expo Doctor.
3. Vote UI authoritative contract guard.
4. 60 full-game state simulations.
5. Story critic report.
6. Supabase CLI + clean local DB from migrations.
7. Full-game RPC E2E لـ5/6/7 لاعبين + reconnect coverage.
8. Deterministic eliminated-Boss admin E2E.
9. JSON artifacts تحت `qa/reports/`.

يوجد أيضًا ChatGPT hourly QA loop. كل تشغيل يبدأ من هذا الملف، يختار عنصرًا واحدًا فقط من أعلى أولوية، ينفذه/يختبره، ثم يحدث هذا الملف قبل أن ينتهي.

## تعريف Done للنسخة المستقرة القادمة
- 20 محاكاة متتالية على الأقل للجيم الكامل تمر بلا deadlock ومعها RPC E2E حقيقي.
- 5/6/7 لاعبين يمروا بكل مسارات اللعب الأساسية.
- tie vote يعيد التصويت ولا يعلق الجولة.
- كل لاعب حي يستطيع التصويت مرة، والمسجون لا يستطيع.
- refresh/reconnect لا يفقد حق التصويت أو المرحلة.
- Boss يمكن أن يخرج من اللعب ويستمر كمدير فقط.
- player name/gender/caseRole يظهروا بشكل صحيح ومتسق.
- كل قصة جاهزة تعدي Critic threshold.
- كل شاشة أساسية تعدي mobile QA.

## خطة Session 7
1. اقرأ هذا الملف أولًا.
2. لا تحاول restore لـProduction Supabase من نفسك. لو وجدته active وقتها، يمكن إعادة read-only parity audit؛ غير ذلك اترك blocker كما هو.
3. نفّذ بندًا واحدًا فقط: **P1 Player Identity schema design + regression coverage لـ`gender` و`caseRole` قبل أي UI**.
4. ابدأ باختبار schema/RPC يثبت أن الاسم الحقيقي يظل الهوية الأساسية، وأن `caseRole` منفصل، وأن gender لا يؤثر إطلاقًا على role assignment أو الفوز.
5. اعمل أصغر migration/type/test changes اللازمة فقط؛ لا تعيد كتابة القصص ولا تعمل UI في نفس الجلسة.
6. افحص CI للتغيير الجديد، ثم حدّث هذا الملف بالنتيجة وأولوية Session 8.

## سجل الجلسات
- **2026-09-10 Session 1:** تأسيس QA المستمر، hotfix للتصويت، simulations، critic، local RPC E2E، ومزامنة migrations.
- **2026-09-10 Session 2:** server-authoritative `phase/canVote` + regression coverage.
- **2026-09-10 Session 3:** توصيل UI بالكامل إلى `phase/canVote` + CI guard.
- **2026-09-10 Session 4:** reconnect/session-restore vote-state regression.
- **2026-09-10 Session 5:** deterministic eliminated-Boss admin E2E.
- **2026-09-10 Session 6:** تأكد أن Boss-eliminated P0 Green، ثم نفذ read-only Production parity audit؛ المشروع كان inactive والقراءة timeout، فتم توثيق blocker ولم يحدث أي Production change. الأولوية التالية: Player Identity schema + regression tests.
