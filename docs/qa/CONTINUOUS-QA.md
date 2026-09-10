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
- التصويت يدخل في حالة يتوقف فيها اللعب ولا يستطيع اللاعبون التصويت.
- اللعبة تعرض أسماء شخصيات القصة بدل أن تجعل أسماء اللاعبين أنفسهم مركز التجربة.
- لا يوجد جنس للاعب، وبالتالي الصياغة قد تكون غير مناسبة للشخص.
- القصص الجاهزة لغتها أصعب من اللازم وبعض تفاصيلها غير طبيعية للمصري العادي.
- الحبكات والأدلة تحتاج إعادة تقييم نقدية، وليس مجرد زيادة صعوبة.
- نحتاج محاكاة آلية للجيم الكامل وCritic مستقل للقصص.

## Session 1 — 2026-09-10
- [x] Hotfix دفاعي للتصويت — commit `36e81b221d05bb36374390d231a236940759e629`.
- [x] 60 محاكاة state كاملة لـ5/6/7 لاعبين.
- [x] إصلاح bug في اختبار tie نفسه بدل تخفيفه — commit `196b1c8f86ae1cfa0fdbaa0abe010600ad5bfac4`.
- [x] Story critic أولي في `scripts/qa/story-critic.mjs`.
- [x] Game QA workflow على push/PR: TypeScript + Expo Doctor + simulations + critic + local Supabase RPC E2E + artifacts.
- [x] Local Supabase config مع anonymous auth للاختبارات.
- [x] Full-game RPC E2E في `scripts/qa/supabase-e2e.mjs`.
- [x] DB/repo drift جزئي اتقفل عبر `20260910074600_sync_case_mode_and_snapshot.sql`.
- [x] Expo Doctor كشف RN patch drift واتصلح — commit `a50800e757c517ce8631b3b23b5f0adf48dc0aa5`.

## Session 2 — 2026-09-10 — server-authoritative vote phase
### نقطة البداية
- أحدث main عند بداية الجلسة كان `3ffdc0af2736914bca8609074d9f9fe244fb37bd`.
- `validate` ✅ و`qa` ✅ على هذا commit، وبالتالي الـlocal Supabase RPC E2E الذي كان pending في Session 1 أصبح مؤكد Green.
- لذلك انتقلت الأولوية تلقائيًا من انتظار E2E إلى إزالة استنتاج مرحلة التصويت من counters في العميل.

### ما تم في هذه الجلسة
- [x] أضيف migration `20260910083000_server_authoritative_vote_phase.sql` ليجعل `room_snapshot` يرجع:
  - `phase`: `lobby | voting | round_resolved | finished`.
  - `canVote`: صلاحية فعلية خاصة باللاعب الحالي، وتكون false لو خرج من اللعب أو صوّت بالفعل أو الجولة ليست في التصويت.
- [x] أضيف `GamePhase` و`phase` و`canVote` إلى `RoomSnapshot` في `lib/types.ts`.
- [x] تم توسيع `scripts/qa/supabase-e2e.mjs` ليختبر contract الجديد عبر الجيم الكامل.
- [x] لم يتم تعطيل أو تخفيف أي اختبار قائم.

### Commits المهمة في Session 2
- `e96da6df9f1da7a51ddb5676fb3461c7cbfc6bc1` — إضافة migration الأولى.
- `60c241cee4b54065bde2c72b4e9f27f10b69ebfd` — تصحيح syntax في نفس migration قبل اعتبارها صالحة.
- `dd48994f216f45df1563d750df4eb5d41568c1cb` — TypeScript contract.
- `89788b429a3135097f35ad7eaa6787794f6fdfe1` — regression coverage للـphase/canVote في RPC E2E.

## Session 3 — 2026-09-10 — authoritative vote UI wiring
### نقطة البداية
- handoff طلب أولًا فحص `89788b429a3135097f35ad7eaa6787794f6fdfe1`.
- تم التأكد أن `validate` ✅ و`qa` ✅ على هذا commit، بما في ذلك الـlocal Supabase RPC E2E للـphase/canVote.
- لذلك تم اختيار بند واحد فقط: توصيل واجهة التصويت بالعقد authoritative الموجود بالفعل على السيرفر.

### ما تم في هذه الجلسة
- [x] تحديث `app/room/[code].tsx` لإزالة اشتقاق `voteOpen` من `lastResolvedRound < roundIndex`.
- [x] الواجهة الآن تستخدم `snapshot.phase === 'voting'` لإظهار timer وبطاقة التصويت وتحديد زر Boss.
- [x] `submitVote` نفسه أصبح يرفض التنفيذ محليًا لو `snapshot.canVote=false`.
- [x] targets وزر تثبيت الصوت يتعطلوا من `snapshot.canVote`، وليس من counters محلية.
- [x] بطاقة التصويت تظل ظاهرة بعد submission داخل `phase=voting` وتعرض «صوتك اتحسب» كما هو مطلوب.
- [x] زر Boss يعرض «اكشف الدليل اللي بعده» فقط عندما `phase === 'round_resolved'`.
- [x] أضيف regression guard جديد `scripts/qa/vote-ui-contract.mjs` يمنع إعادة `safeLastResolvedRound`/`voteOpen` المشتق محليًا ويؤكد وجود `phase/canVote` wiring.
- [x] أضيف guard إلى `Game QA` workflow قبل simulations وSupabase E2E.
- [x] لم يتم تخفيف أو حذف أي اختبار.

### Commits المهمة في Session 3
- `5a46ee5f15f5c9993029c506376ec4577245876d` — توصيل UI بـ`phase/canVote`.
- `f43d1e166461739a0a1d617268dd712629d5751e` — regression guard للـvote UI contract.
- `5287931ae0345e704a3d89c2008888c8bf330724` — تشغيل guard ضمن Game QA workflow.

### نتيجة CI عند إغلاق Session 3
- checks على `5287931ae0345e704a3d89c2008888c8bf330724` بدأت بنجاح.
- `validate` و`qa` كانا **in_progress** عند آخر فحص في هذه الجلسة، لذلك لا يوجد ادعاء Green للتغيير الجديد بعد.
- التغيير **ليس deploy-safe بعد**، ولم يتم تطبيق migration أو deploy على Production.

### Bugs/مخاطر جديدة
- لا يوجد bug جديد مثبت حتى الآن من هذه الجلسة.
- الخطر المتبقي الأعلى هو refresh/reconnect أثناء تبدل `canVote` و`phase`: نحتاج regression يثبت أن snapshot جديد قبل/بعد cast وبعد tie لا يعيد حالة UI قديمة أو يفقد حق التصويت.

## تشخيص التصويت الحالي
المشكلة الأصلية كانت أن العميل يعيد استنتاج فتح التصويت من counters. السيرفر أصبح المصدر الصريح للحقيقة عبر `phase/canVote`، والواجهة أصبحت تستهلكهما مباشرة في Session 3. لا تعتبر هذا المسار مغلقًا نهائيًا حتى يمر CI الجديد ثم refresh/reconnect regression.

## تشخيص القصص
مثال «آخر بروفة» يحتوي على كلمات وتراكيب مثل: ريلاي، لسان قفل، تحليل الغبار، بصمة دخول للوحة الإضاءة. الهدف: **المعلومة تتفهم فورًا، معناها في اللغز هو الصعب.**

## Drift مكتشف
Production كانت تحتوي على تغييرات `case_mode` / `story_template_id` / `create_room_v2` لم تكن موجودة في migrations داخل GitHub. تم توثيقها في versioned migration، لكن لا تدّعِ أن Production migrated بدون تطبيق موثق وsmoke test. Migration الـphase الجديدة لم تُطبق على Production حتى نهاية Session 3.

## Backlog مرتب بالأولوية

### P0 — Functionality / Deadlocks
- [x] Hotfix دفاعي لـvote gating في الواجهة.
- [x] State-model full-game simulator لـ5/6/7 و60 تشغيلًا.
- [x] Real RPC E2E runner ضد local Supabase.
- [x] تأكيد Green للـRPC E2E الأساسي على main قبل Session 2.
- [x] Server contract صريح `phase` + `canVote` في `room_snapshot` + regression tests.
- [x] توصيل UI إلى `snapshot.phase` و`snapshot.canVote` بدل counters المحلية + CI guard.
- [ ] **أعلى أولوية حالية:** افحص checks للـcommit `5287931ae0345e704a3d89c2008888c8bf330724`. لو فشل `validate` أو `qa` أصلح أول failure فقط. لو Green، أضف refresh/reconnect regression في كل مرحلة، خصوصًا قبل/بعد cast vote وبعد tie.
- [ ] ثبّت سيناريو Boss نفسه يُسجن ثم يظل قادرًا على resolve/reveal بينما لا يقدر يصوت بصورة مستقلة وواضحة في التقرير.
- [ ] طابق Production DB مع versioned migrations فقط بعد Green E2E + smoke test.

### P1 — Player identity
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
7. Full-game RPC E2E لـ5/6/7 لاعبين.
8. JSON artifacts تحت `qa/reports/`.

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

## خطة Session 4
1. اقرأ هذا الملف وافحص checks للـcommit `5287931ae0345e704a3d89c2008888c8bf330724`.
2. لو أي check فشل: أصلح أول failure فقط ولا تبدأ بندًا جديدًا.
3. لو Green: نفّذ refresh/reconnect regression واحد مركز على vote state عبر: قبل cast → بعد cast → tie reset → round resolved → reveal next round.
4. أثبت أن snapshot الجديد هو المصدر الوحيد للحالة وأن اللاعب لا يفقد أو يستعيد `canVote` غلطًا بعد refresh.
5. افحص TypeScript + Game QA ثم حدّث هذا الملف.
6. لا تبدأ gender/caseRole أو إعادة كتابة القصص قبل إغلاق هذا الـP0.

## سجل الجلسات
- **2026-09-10 Session 1:** تأسيس نظام QA المستمر، hotfix للتصويت، simulations، critic، local RPC E2E، ومزامنة migrations.
- **2026-09-10 Session 2:** تأكد أن الـRPC E2E الأساسي Green، ثم أضيف server-authoritative `phase/canVote` مع regression coverage كاملة عبر lobby/vote/submit/tie/resolve/reveal/finish. checks الجديدة كانت queued عند الإغلاق؛ Production لم تتغير.
- **2026-09-10 Session 3:** تم التأكد أن عقد السيرفر Green، ثم توصيل واجهة التصويت بالكامل إلى `phase/canVote` مع regression guard في CI. checks الخاصة بالتغيير الجديد كانت in_progress عند الإغلاق؛ Production لم تتغير.
