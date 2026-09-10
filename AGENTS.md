# Akher Kheit — Agent Instructions

قبل أي QA أو gameplay/story implementation session:

1. اقرأ `docs/qa/QA-OPERATING-MODE.md`.
2. اقرأ `docs/qa/CONTINUOUS-QA.md` من default branch وتعامل معه كهاند أوف الحالة الحالية.
3. افحص أحدث commits وCI/checks على `main` قبل اختيار العمل.
4. لا تعتمد على chat memory بدل الريبو.

## طريقة العمل
- اختر أعلى أولوية قابلة للتنفيذ حسب الهاند أوف، مع P0/full-game correctness قبل features.
- نفّذ **vertical slice واحدًا كاملًا** بدل micro-task إذا كان نفس الهدف يمكن إغلاقه بأمان end-to-end.
- يجوز أن يشمل الهدف نفسه schema + backend + UI + tests + docs.
- لا تجمع features غير مرتبطة في جلسة واحدة.
- كل bug مهم يُفضّل تحويله إلى regression test.
- لا تضعف أو تحذف اختبارًا فقط لجعل CI أخضر.
- لا تنشر Production أو تطبق migration إلا وفق قواعد deploy safety في `QA-OPERATING-MODE.md` والهاند أوف الحالي.
- عند وجود blocker خارجي، وثّقه مع أفضل next action ولا تخمّن.

## Checkpoints
اعمل Planning/Checkpoint session عادة بعد 3–4 implementation sessions أو عند نهاية milestone/تغير الأولويات، كما هو موضح في `docs/qa/QA-OPERATING-MODE.md`.

## إغلاق الجلسة
حدّث `docs/qa/CONTINUOUS-QA.md` قبل النهاية بالنتائج، الأدلة، المخاطر، حالة checks/deploy safety، وأولوية واحدة دقيقة للجلسة التالية.
