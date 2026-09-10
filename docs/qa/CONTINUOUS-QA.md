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

## Session 1 — 2026-09-10

### ملاحظات المستخدم المؤكدة
- التصويت يدخل في حالة يتوقف فيها اللعب ولا يستطيع اللاعبون التصويت.
- اللعبة تعرض أسماء شخصيات القصة بدل أن تجعل أسماء اللاعبين أنفسهم مركز التجربة.
- لا يوجد جنس للاعب، وبالتالي الصياغة قد تكون غير مناسبة للشخص.
- القصص الجاهزة لغتها أصعب من اللازم وبعض تفاصيلها غير طبيعية للمصري العادي.
- الحبكات والأدلة تحتاج إعادة تقييم نقدية، وليس مجرد زيادة صعوبة.
- نحتاج محاكاة آلية للجيم الكامل وCritic مستقل للقصص.

### ما تم في Session 1
- [x] **Hotfix دفاعي للتصويت** — commit `36e81b221d05bb36374390d231a236940759e629`. الواجهة لم تعد تعتمد مباشرة على مقارنة هشة مع `lastResolvedRound`; القيمة الناقصة تسقط إلى `-1` بدل أن تخفي التصويت وتعمل deadlock.
- [x] **60 محاكاة state كاملة** — `scripts/qa/game-state-sim.mjs`: 20 × (5، 6، 7 لاعبين). تغطي Boss كلاعب، التعادل، إعادة فتح نفس التصويت، منع المسجون، الجولة التالية، والوصول لفائز.
- [x] تم اكتشاف bug في اختبار التعادل نفسه (self-vote ممكن يفسد التعادل) وإصلاح الاختبار بدل تخفيفه — commit `196b1c8f86ae1cfa0fdbaa0abe010600ad5bfac4`.
- [x] **Story critic أولي** — `scripts/qa/story-critic.mjs`. يرصد jargon، اللغة الرسمية المتكلفة، الأدلة شديدة الكثافة، وطول الـbios، ويصدر `qa/reports/story-critic.json`.
- [x] **Game QA workflow** على كل push/PR — TypeScript + Expo Doctor + state simulator + story critic + local Supabase E2E + artifacts.
- [x] **Local Supabase config** أضيف في `supabase/config.toml` مع anonymous auth للاختبارات فقط.
- [x] **RPC full-game E2E** أضيف في `scripts/qa/supabase-e2e.mjs`: anonymous clients حقيقيين، create/join/install case، أدوار خاصة، tie في 6 لاعبين، cast/resolve، منع المسجون من التصويت، Boss control بعد الخروج، reveal next clue، winner/solution.
- [x] **DB/repo drift جزئي اتقفل** — migration `20260910074600_sync_case_mode_and_snapshot.sql` توثق `case_mode`, `story_template_id`, `create_room_v2` وsnapshot fields داخل GitHub بدل الاعتماد على Production state غير الموثق.
- [x] Expo Doctor كشف patch drift (`react-native 0.86.2` بينما SDK 57 يتوقع `0.86.3`) واتصلح بدل تجاهله — commit `a50800e757c517ce8631b3b23b5f0adf48dc0aa5`.
- [x] الـCI العادي على commit `9ae7432d839ef0ac303bfd645b7dc16f38eadf7b` أصبح أخضر: TypeScript وExpo validation نجحا.
- [ ] **Local Supabase RPC E2E النهائي ما زال جارياً وقت إغلاق Session 1**. آخر حالة مؤكدة: TypeScript ✅، Expo Doctor ✅، state simulations ✅، story critic ✅، Supabase CLI ✅، والخطوة الحالية `supabase start`; لا نعتبر المسار deploy-safe حتى نرى نتيجة الـRPC E2E نفسها.

### تشخيص التصويت
واجهة الروم كانت تفتح التصويت بشرط `room.lastResolvedRound < room.roundIndex`. هذا شرط هش: لو `lastResolvedRound` غاب من snapshot أو رجع null/undefined بسبب drift بين قاعدة البيانات والـrepo، تختفي واجهة التصويت بالكامل رغم أن `cast_vote` على السيرفر قد يكون صالحًا. الـhotfix يمنع اختفاء الواجهة بسبب قيمة ناقصة، لكن **الحل المعماري النهائي** هو أن يرجع السيرفر `phase` و`canVote` صريحين بدل إعادة استنتاج المرحلة في الواجهة.

### تشخيص القصص
مثال «آخر بروفة» يحتوي على كلمات وتراكيب مثل: ريلاي، لسان قفل، تحليل الغبار، بصمة دخول للوحة الإضاءة. هذه التفاصيل قد تكون منطقية تقنيًا لكنها ترفع عبء الفهم بدل عبء الاستنتاج. الهدف في إعادة الكتابة: **«المعلومة تتفهم فورًا، معناها في اللغز هو الصعب.»**

### Drift مكتشف
Production كانت تحتوي على تغييرات `case_mode` / `story_template_id` / `create_room_v2` لم تكن موجودة في migrations داخل GitHub. تم إضافة migration reconciliation في Session 1، لكن **لم يتم تطبيق migration الجديدة على Production في هذه الجلسة** لأننا نريد أولًا نتيجة local RPC E2E واضحة. لا تدّعِ أن Production migrated إلا بعد تطبيق موثق وsmoke test.

## Backlog مرتب بالأولوية

### P0 — Functionality / Deadlocks
- [x] Hotfix دفاعي لـvote gating في الواجهة.
- [x] State-model full-game simulator لـ5/6/7 و60 تشغيلًا.
- [x] إضافة real RPC E2E runner ضد local Supabase.
- [ ] **أعلى أولوية حالية:** انتظر/افحص نتيجة `Game QA` للـlocal Supabase RPC E2E؛ أصلح أول failure حقيقي بدون تعطيل الاختبار.
- [ ] بعد Green RPC E2E: أضف `phase` و`canVote` صريحين إلى `room_snapshot` واستخدمهما في UI بدل `lastResolvedRound < roundIndex`.
- [ ] أضف refresh/reconnect regression في كل مرحلة، خصوصًا قبل/بعد cast vote وبعد tie.
- [ ] ثبّت سيناريو Boss نفسه يُسجن ثم يظل قادرًا على resolve/reveal بينما لا يقدر يصوت.
- [ ] طابق Production DB مع versioned migrations فقط بعد Green E2E + smoke test.

### P1 — Player identity
- [ ] إضافة `gender` إلى player profile عند إنشاء/دخول الروم.
- [ ] جعل `nickname` هو الاسم الأساسي الظاهر دائمًا.
- [ ] تحويل شخصية القضية إلى `caseRole` (مثال: مسؤول الإضاءة) بدل اسم خيالي يحل محل اسم اللاعب.
- [ ] توليد/اختيار صياغة role/bio مناسبة للجنس بدون تغيير ميكانيك اللعبة.
- [ ] منع أي clue من الاعتماد على اسم شخصية خيالي؛ الدليل يشير إلى اسم اللاعب الفعلي أو دوره بوضوح.
- [ ] تحديث AI schema بحيث ينتج roles/bios لا fictional names، ثم يركبهم السيرفر على اللاعبين بعد معرفة أسمائهم وجنسهم.

### P1 — Story quality
- [x] Critic heuristic scaffold موجود ويخرج تقريرًا آليًا.
- [ ] إعادة نقد الست قصص واحدة واحدة: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إعادة كتابة كل premise/bio/clue بلغة مصرية محكية بسيطة قابلة للقراءة بصوت عالي.
- [ ] لكل قصة: جدول suspects × clues يوضح من يظل مشتبهًا بعد كل دليل ولماذا.
- [ ] اختبار «هل لاعب ذكي يقدر يحلها من clue واحد؟» — لو نعم فالقصة تفشل.
- [ ] اختبار «هل الحل يحتاج معلومة لم تظهر؟» — لو نعم فالقصة تفشل.
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
3. 60 full-game state simulations.
4. Story critic report.
5. Supabase CLI + clean local DB from migrations.
6. Full-game RPC E2E لـ5/6/7 لاعبين.
7. JSON artifacts تحت `qa/reports/`.

يوجد أيضًا ChatGPT hourly QA loop. كل تشغيل يجب أن يبدأ من هذا الملف، يختار **عنصرًا واحدًا فقط** من أعلى أولوية، ينفذه/يختبره، ثم يحدث هذا الملف قبل أن ينتهي. هذا يمنع الجلسات من العمل من الذاكرة أو من تخمينات قديمة.

## تعريف Done للنسخة المستقرة القادمة
لا نعتبر النسخة مستقرة إلا عندما:
- 20 محاكاة متتالية على الأقل للجيم الكامل تمر بلا deadlock **ومعها RPC E2E حقيقي**.
- 5/6/7 لاعبين يمروا بكل مسارات اللعب الأساسية.
- tie vote يعيد التصويت ولا يعلق الجولة.
- كل لاعب حي يستطيع التصويت مرة، والمسجون لا يستطيع.
- refresh/reconnect لا يفقد حق التصويت أو المرحلة.
- Boss يمكن أن يخرج من اللعب ويستمر كمدير فقط.
- player name/gender/caseRole يظهروا بشكل صحيح ومتسق.
- كل قصة جاهزة تعدي Critic threshold.
- كل شاشة أساسية تعدي mobile QA.

## خطة Session 2 — تُعدل فقط لو نتيجة E2E كشفت blocker أعلى
1. اقرأ هذا الملف، ثم افحص أحدث `Game QA` أولًا.
2. **لو RPC E2E فشل:** هذا هو العمل الوحيد الأول؛ أصلح أول failure وكرر حتى Green. لا تبدأ gender/story rewrite قبله.
3. **لو RPC E2E Green:** نفذ contract صريح `phase` + `canVote` من السيرفر، وأضف refresh/tie regression tests.
4. بعد استقرار game loop: أضف `gender` + `caseRole` إلى schema وcreate/join/snapshot.
5. حوّل قصة واحدة فقط كنموذج — «آخر بروفة» — إلى مصري بسيط مع نفس مستوى الاستنتاج، وشغّل critic + suspects×clues review عليها.
6. لا تعمم إعادة الكتابة على الخمس قصص قبل أن تنجح القصة النموذجية.
7. حدّث هذا الملف بالنتائج والـcommits وأعلى أولوية للسيشن التالية.

## سجل الجلسات
- **2026-09-10 Session 1:** بدأ نظام QA المستمر؛ تم عمل hotfix للتصويت، 60 state simulations، story critic، Game QA workflow، local Supabase RPC simulator، ومزامنة جزء مهم من DB migrations. تم إصلاح RN patch mismatch الذي كشفه Expo Doctor. عند الإغلاق كان local Supabase E2E لا يزال في مرحلة bootstrap، لذلك لم يتم نشر/تطبيق تغييرات QA على Production بعد.
