# Akher Kheit — QA Operating Mode

هذا الملف يحدد **طريقة تشغيل جلسات QA والتطوير المرتبطة بها**. هو ثابت نسبيًا مقارنةً بـ`CONTINUOUS-QA.md` الذي يمثل الحالة المتغيرة والهاند أوف بين الجلسات.

## ترتيب القراءة الإلزامي
أي Agent أو جلسة QA يبدأ بهذا الترتيب:
1. `AGENTS.md`
2. `docs/qa/QA-OPERATING-MODE.md`
3. `docs/qa/CONTINUOUS-QA.md`
4. أحدث commits وCI/checks على `main`

إذا تعارضت معلومة حالة حالية مع الذاكرة أو المحادثة، **الهاند أوف والريبو هما مصدر الحقيقة**.

## الهدف الأعلى
الوصول إلى لعبة كاملة مستقرة وممتعة من إنشاء الروم حتى إعلان الفائز، مع:
- عدم وجود gameplay deadlocks.
- full-game correctness يمكن إثباته آليًا.
- هوية اللاعب الحقيقية (`nickname`) واضحة دائمًا.
- gender يستخدم فقط لضبط الصياغة اللغوية، وليس لتحديد المافيا أو فرص الفوز.
- قصص مصرية طبيعية وواضحة وعادلة، صعوبتها في الاستنتاج لا في اللغة.
- إمكانية دعم مكتبة قضايا جاهزة عالية الجودة إلى جانب التوليد بالـAI.

## حجم الجلسة: Vertical Slice واحد كامل
الجلسة لا ينبغي أن تكون "تعديلًا صغيرًا واحدًا" إذا كان يمكن إغلاق الهدف نفسه end-to-end بأمان.

القاعدة:
- اختر **هدفًا واحدًا واضحًا**.
- يجوز للجلسة أن تعدل schema + backend + UI + tests + docs معًا إذا كانت كلها ضرورية لإغلاق **نفس الهدف**.
- لا تقسّم feature واحدة صناعيًا إلى عدة جلسات إذا كان إغلاقها بالكامل في جلسة واحدة آمنًا ويمكن اختباره.
- لا تجمع features غير مرتبطة لمجرد زيادة حجم الجلسة.
- عند وجود P0 أو failure في CI، يسبق أي توسع أو feature جديد.

أمثلة جيدة:
- "إكمال caseRole personalization end-to-end" ويشمل types + generation + install + snapshot + UI + regression.
- "إغلاق reconnect correctness" ويشمل reproduction + backend/state fix + E2E + handoff.

أمثلة سيئة:
- جلسة كاملة لتغيير TypeScript type فقط بينما runtime/UI/tests المطلوبة معروفة وقابلة للإغلاق بأمان في نفس الجلسة.
- خلط story rewrite مع unrelated navigation feature ومع database cleanup في جلسة واحدة.

## ترتيب الأولويات
يُستخدم هذا الترتيب ما لم يثبت الهاند أوف blocker أو أولوية أعلى:
1. **P0 gameplay correctness/deadlocks**: create/join/start/reveal/clues/voting/ties/elimination/reconnect/winner/Boss controls.
2. **Full-game automated confidence**: regression وE2E للمسارات الحرجة.
3. **Player identity & fairness**: nickname, gender wording, caseRole، بدون تأثير gender على mafia assignment.
4. **Story quality & content system**: clarity, fairness, Egyptian naturalness, clue escalation, presets + AI contract.
5. **Curated case library & player-count coverage**.
6. **New gameplay/product features**.
7. **Polish / launch readiness**.

## Full-game definition of done
نعتبر الـcore قريبًا من stable عندما تستطيع الاختبارات تغطية المسار التالي باستمرار:

room creation → joins → role assignment → case install → clue progression → voting → tie handling → elimination → reconnect/refresh → next round → repeated voting/elimination → winner.

ويجب أن تشمل الاختبارات الحالات الخاصة المهمة مثل:
- Boss eliminated لكنه يحتفظ بصلاحيات الإدارة الضرورية.
- eliminated player لا يصوت.
- tie لا يترك اللعبة في حالة معلقة.
- server-authoritative phase/canVote بعد refresh/reconnect.
- أعداد اللاعبين المدعومة الأساسية.

## Regression rule
- كل bug مهم أو متكرر يتحول إلى regression test عندما يكون ذلك عمليًا.
- لا تحذف أو تضعف اختبارًا فاشلًا لمجرد جعل CI أخضر.
- لو الاختبار كشف contract قديمًا غير صحيح، أصلح contract أو وثّق blocker بدل إخفاء المشكلة.

## Checkpoint / Planning sessions
لا نعمل planning session بعد رقم ثابت بشكل أعمى، لكن الافتراضي:
- بعد كل **3–4 implementation sessions**، أو
- عند نهاية milestone، أو
- عندما يصبح الهاند أوف مليئًا ببنود صغيرة ويكون ترتيب الأولويات غير واضح، أو
- قبل الانتقال من core correctness إلى story/content/features.

جلسة الـCheckpoint لا تضيف feature كبيرة. مهمتها:
1. مراجعة أحدث CI والـregression coverage.
2. تحديد ما أُغلق فعليًا وما زال مجرد partial implementation.
3. مراجعة P0/P1 والـtechnical debt والـproduction blockers.
4. فحص هل الجلسات السابقة كانت صغيرة أكثر من اللازم أو واسعة أكثر من اللازم.
5. تحديث milestones والـroadmap.
6. تحديد **3–4 أهداف تنفيذية تالية** بترتيب واضح، مع next-session priority واحدة فقط.

إذا ظهر P0 أثناء checkpoint، يصبح هو الأولوية التالية فورًا.

## Milestone roadmap
### Milestone A — Core Stable
- full-game correctness Green.
- no known P0 gameplay deadlocks.
- reconnect/tie/elimination/winner paths covered.
- production DB parity معروف أو موثق كـblocker صريح.

### Milestone B — Identity & Story Contract Stable
- nickname هو الهوية الأساسية.
- gender wording end-to-end.
- caseRole end-to-end.
- presets وAI يستخدمان contract متوافقًا.
- legacy fictional identity fields إما migrated أو معزولة بوضوح.

### Milestone C — Story Quality
- story critic قابل للقياس.
- مراجعة القضايا الحالية: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- suspects × clues matrix للقضايا الأساسية.
- لا clue واحد يكشف المافيا مبكرًا بشكل ظالم.
- اللغة مصرية بسيطة وسهلة القراءة بصوت عالٍ.

### Milestone D — Curated Case Library
نبني مكتبة قضايا جاهزة curated بدل الاعتماد على AI فقط.

الهدف المبدئي لتغطية الأعداد:
- 4–5 لاعبين.
- 6–7 لاعبين.
- 8–10 لاعبين.
- ثم 11–15 فقط إذا أثبت gameplay والـUX أنهما يتحملان ذلك.

يفضل أن تكون القضية الواحدة قابلة للتكيف مع أكثر من عدد عندما يكون ذلك عادلًا، بدل نسخ قصص منفصلة بلا داعٍ.

كل قضية curated تحتاج:
- roles كافية للأعداد المستهدفة.
- gender-aware wording دون تغيير role semantics.
- clue progression مضبوط.
- mafia count/assignment مستقل عن gender.
- fairness/clarity review.
- automated validation قدر الإمكان.

### Milestone E — New Features
بعد استقرار الـcore والـstory foundation نبدأ features جديدة حسب القيمة، مع الحفاظ على full-game suite كحاجز أمان.

### Milestone F — Polish / Launch
- UX polish.
- observability/error handling.
- performance/reliability.
- deploy/runbook readiness.
- production smoke tests.

## Production safety
- لا Production deploy أو migration من QA loop إلا بعد E2E مناسب للمسار المتغير وقرار `deploy-safe` صريح في `CONTINUOUS-QA.md`.
- إذا production parity غير معروفة، لا تخمّن.
- إذا خدمة أو DB blocked/inactive، وثّق blocker وأفضل next action ولا تعمل write جانبي غير مصرح به.

## كيف تُغلق كل جلسة تنفيذية
قبل النهاية حدّث `docs/qa/CONTINUOUS-QA.md` بما يلي:
- الهدف الوحيد الذي تم اختياره ولماذا كان الأعلى أولوية.
- reproduction/evidence.
- التغييرات التي تمت.
- الاختبارات والـCI/checks ونتيجتها الحالية.
- أي bugs/risks جديدة.
- هل التغيير deploy-safe أم لا.
- **أولوية دقيقة واحدة للجلسة التالية**.

إذا كانت checks ما زالت تعمل، اكتب ذلك صراحة ولا تعتبر الهدف deploy-safe.

## قاعدة منع الانشغال بالتفاصيل الصغيرة
إذا كان next item مجرد type/static change لكنه جزء واضح من هدف أكبر يمكن إغلاقه في نفس الجلسة بأمان، وسّع الجلسة إلى الـvertical slice الكامل بدل استهلاك جلسة كاملة في micro-task.

الاستثناء: عندما يكون هناك failure/uncertainty حقيقي، migration risk، production blocker، أو تغيير contract واسع؛ عندها التقسيم المتحفظ مبرر.
