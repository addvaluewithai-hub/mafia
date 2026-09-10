# آخر خيط — Continuous QA Handoff

> هذا الملف هو مصدر الحقيقة **لحالة المشروع الحالية والهاند أوف المتغير بين الجلسات**. قواعد التشغيل وحجم الجلسة والـcheckpoints والـmilestones موجودة في `docs/qa/QA-OPERATING-MODE.md` ويجب قراءتها قبله كما هو موضح في `AGENTS.md`.

## ترتيب القراءة لأي جلسة جديدة
1. `AGENTS.md`
2. `docs/qa/QA-OPERATING-MODE.md`
3. هذا الملف
4. أحدث commits وCI/checks على `main`

لا تعتمد على chat memory بدل الريبو.

## الهدف
لعبة كاملة قابلة للعب من إنشاء الروم حتى إعلان الفائز، بدون deadlocks أو حالات واجهة غامضة، وبهوية اللاعب الحقيقية وقصص مصرية طبيعية وعادلة، مع automated confidence للمسارات الحرجة.

## قواعد غير قابلة للتفاوض
- full-game path: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ caseRole وصف مرتبط باللاعب وليس اسم شخصية خيالية بديلة.
- gender للصياغة فقط ولا يؤثر على mafia assignment أو فرص الفوز.
- الـBoss لاعب كامل ويظل قادرًا على الإدارة حتى لو اتسجن.
- كل bug مهم أو متكرر يتحول إلى regression عندما يكون ذلك عمليًا.
- ممنوع إضعاف/حذف test لمجرد جعل CI أخضر.
- لا Production deploy أو migration إلا بعد E2E مناسب وقرار deploy-safe صريح هنا.
- الجلسة العادية تنفذ vertical slice واحدًا كاملًا عندما يكون ذلك آمنًا؛ لا micro-sessions بلا داعٍ ولا خلط features غير مرتبطة.

## P0 — Functionality / Deadlocks
- [x] vote gating defensive hotfix.
- [x] 60 deterministic full-game state simulations لـ5/6/7 لاعبين.
- [x] local Supabase full-game RPC E2E لـ5/6/7.
- [x] server-authoritative `phase` + `canVote`.
- [x] UI تعتمد على `phase/canVote` مع regression guard.
- [x] reconnect regression: before cast → after cast → tie reset → resolve → next round.
- [x] eliminated Boss لا يصوت لكنه يحتفظ بـresolve/reveal admin controls.
- [ ] Production DB parity **blocked** حتى Production Supabase يكون active أو restore يتصرح به صراحة. لا تطبق migration قبل read-only parity + smoke-test plan.

## Production drift المعروف
Production كان فيها `case_mode` / `story_template_id` / `create_room_v2` قبل تسجيل كل ذلك في versioned migrations. parity لم تثبت لأن Production Supabase كان `INACTIVE` ومحاولة قراءة migration history انتهت connection timeout. لا تدّعِ أن migration حديث مطبق على Production بدون تحقق read-only.

## Player identity / generated-case contract
- [x] `gender + caseRole` schema + snapshot/types regression.
- [x] gender-aware backend RPCs: `create_room_v3` و`join_room_v2`.
- [x] backend gender E2E all-male/all-female/mixed مع إثبات استقلال mafia count عن gender.
- [x] gender create/join UI في create + room join + standalone `/join`.
- [x] nickname-only PlayerCard identity.
- [x] `caseRole` population في `install_case`.
- [x] AI generators يستخدمان `role + bio` بدون fictional names.
- [x] `install_case` يستهلك optional `roleByGender` / `bioByGender` بعد player shuffle بدون تغيير `order by random()` أو `mafiaCharacterIndexes`.
- [x] AI generator schemas/prompts/validators تنتج وتفرض `roleByGender.{male,female}` و`bioByGender.{male,female}` مع semantic-equivalence rule واستقلال mafia assignment عن gender.
- [x] shared TypeScript contract يصرّح بـ`GenderedCaseText`, `GeneratedCaseCharacter`, و`GeneratedAiCase`; legacy `GeneratedCase` يبقى compatible مع preset cases القديمة بينما `GeneratedAiCase` يجعل role والـgender variants mandatory.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields في presets؛ تحويلهما أصبح جزءًا من Story Quality slice وليس identity micro-cleanup منفصلًا.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC contract + standalone join contract.
- player card identity contract.
- generated-case schema + prompt + typed contract + install handoff contract للمسارين.
- caseRole install E2E + gender-aware case wording install E2E.
- 60 deterministic full-game state simulations.
- local Supabase full-game RPC E2E لـ5/6/7.
- eliminated Boss admin-controls E2E.
- story critic report mode.

## Session 15 — AI generator gender wording variants
- commit: `6d7ea4db2dc9df164d06bd77d9afaa8611b34124`.
- النتيجة النهائية: `validate` ✅ و`qa` ✅.
- كلا AI paths يطلب ويvalidate gender-aware role/bio variants، والـprompt يمنع اختلاف الحقائق أو mafia assignment حسب الجنس.
- لم يحدث Production deploy أو migration.

## Session 16 — 2026-09-10 — Generated Case Identity Contract closure
### Session type
Delivery — إغلاق typed generated-case identity contract قبل Story Quality checkpoint.

### Evidence / result
- commits: `d679dfcbfa7018b95a2a654df7fa97520a42d909` و`8ee7956dbe38bc8ffaebcc04dcf2fb964013d7f2`.
- أضيف `GenderedCaseText`, `GeneratedCaseCharacter`, `GeneratedAiCase` مع legacy preset compatibility.
- regression يثبت typed contract بجانب schema/prompt/install handoff.
- **النتيجة النهائية التي تأكدت في Session 17:** checks على `8ee7956dbe38bc8ffaebcc04dcf2fb964013d7f2` أصبحت `validate` ✅ و`qa` ✅.
- لم يتغير gameplay أو mafia assignment ولم يحدث Production deploy/migration.

## Session 17 — 2026-09-10 — Milestone A/B → Story Quality checkpoint
### Session type
Checkpoint / Planning فقط. لم يبدأ story rewrite أو feature جديدة.

### Starting evidence
- قُرئت `AGENTS.md` ثم `QA-OPERATING-MODE.md` ثم هذا handoff من default branch.
- `main` عند بداية الـcheckpoint: `082c1f2b63985dec76aa46ad0e8415f264ffed80` (Session 16 handoff)، والـcode prerequisite `8ee7956d...` Green بالكامل: `validate` ✅ و`qa` ✅.
- لا يوجد CI failure يسبق الـcheckpoint.
- Production parity ما زال blocker خارجيًا ولم يُلمس.

### Audit — Milestone A: Core Stable
- **لا يوجد P0 gameplay deadlock معروف حاليًا.**
- local Supabase E2E يثبت create → joins → install → voting → tie (6 players) → tie reset → resolve/elimination → reconnect before/after cast/tie/resolve/reveal → next clue → repeated eliminations → winner/public solution لـ5/6/7.
- eliminated voter rejection وBoss-host controls بعد elimination مغطاة.
- deterministic simulation تضيف 60 full-game state scenarios لـ5/6/7.
- **Gap حقيقي وليس P0 حاليًا:** runtime full-game E2E لا يغطي 4 أو 8–10 لاعبين؛ لكن curated presets نفسها حاليًا 5/6/7 فقط، لذلك لا نوسّع core test matrix عشوائيًا قبل تحديد player-count support مع curated library. عند بدء 4–5/8–10 content coverage يجب إضافة matching full-game E2E قبل اعتبار العدد supported.
- Milestone A محليًا قريب من stable/Green؛ الاستثناء الوحيد غير المحسوم هو Production DB parity الخارجي.

### Audit — Milestone B: Identity & Story Contract
- nickname identity، gender create/join، gender wording install، caseRole، AI generation contract، shared types كلها مغطاة ومتصلة end-to-end.
- المتبقي ليس runtime identity defect: presets الستة ما زالت تستخدم fictional `name` + single `bio` legacy content. هذا content debt يجب إصلاحه أثناء Story Quality حتى لا نعيد كتابة الهوية منفصلة عن الحبكة والـclues.
- Milestone B runtime contract يعتبر مغلقًا؛ preset migration هو مدخل Milestone C.

### Audit — Story inventory / critic
- inventory الحالي بالـrepo: **6 curated presets** فقط: قصتان لـ5 لاعبين، قصتان لـ6، قصتان لـ7. لا curated coverage لـ4 أو 8–10 حاليًا.
- `story-critic.mjs` الحالي مفيد كلغة/structure smoke report لكنه محدود: jargon hits + stiff phrases + clue/bio length + exactly 4 clues + solution presence. هو نفسه يصرح أنه لا يستبدل logic criticism.
- critic الحالي **لا يقيس** suspect×clue fairness، clue exclusivity، early reveal، red-herring distribution، role/nickname identity debt، gender variants، أو player-count contract.
- عينة مباشرة من `clock-1117` تؤكد legacy fictional names (`مروان/سلمى/...`) وbio واحد لكل character، رغم أن install/runtime الآن قادر على caseRole/gender variants.
- عينة `last-rehearsal` تظهر حملًا لغويًا وتقنيًا واضحًا مثل `ريلاي`, `تحليل الغبار`, و`سجل ريلاي`، وتوضح أن story quality debt حقيقي وليس مجرد cleanup نظري.

### Newly discovered bugs / risks
- لا bug gameplay جديد ظهر في الـcheckpoint.
- **Story QA blind spot:** critic يمكن أن يعطي score جيدًا لقصة structurally سليمة لغويًا حتى لو clue واحد يكشف المافيا مبكرًا أو توزيع الاشتباه غير عادل؛ قبل rewrite واسع نحتاج measurable fairness inventory.
- **Player-count gap:** curated library الحالية 5/6/7 فقط. 4 و8–10 لا ينبغي وصفها supported content bands حتى توجد قصة + validator + matching gameplay evidence.
- preset fictional names قد تجعل اللاعب يشعر أنه يمثل شخصية بديلة بدل أن nickname هو الهوية؛ يجب تحويلها إلى semantic roles أثناء rewrite، لا مجرد rename آلي.

### Roadmap decision — الأربع vertical slices التالية
1. **Story Quality Baseline & Fairness Matrix — الأولوية التالية.** وسّع deterministic story QA ليعمل inventory لكل الست قصص: character/mafia counts، suspect×clue evidence matrix أو metadata قابلة للتحقق، early-reveal/exclusivity warnings، jargon/read-aloud burden، legacy identity/gender-variant coverage. Done when: تقرير machine-readable يغطي 6/6 ويكشف gaps بدون تغيير القصص نفسها، ويدخل CI report mode بدون live model.
2. **Rewrite/Migrate the existing six presets end-to-end.** استخدم baseline لإزالة fictional identity واستبدالها semantic `role` + gender-aware wording، وتبسيط المصري، وضبط clue escalation/red herrings مع الحفاظ على mystery semantics. Done when: 6/6 تمر story validator/critic المستهدف + install E2E ولا يتغير mafia assignment بسبب gender.
3. **Curated 4–5 & 6–7 library coverage.** بعد تنظيف الست الحالية، أضف/كيّف قضايا بحيث 4–5 و6–7 لهما coverage مقصودة وليست fallback، مع player-count validation وmatching local full-game E2E لأي عدد جديد (خصوصًا 4). Done when: selection لا يعتمد على unrelated-count fallback لهذه bands وكل case passes story/fairness validation.
4. **Curated 8–10 expansion + gameplay proof.** صمم قضايا مناسبة لعدد أكبر بدل تمديد قصص صغيرة آليًا، واضبط mafia count/fairness، وأضف full-game E2E لـ8/9/10 قبل إعلان الدعم. Done when: curated selection + story QA + local full-game winner/tie/elimination evidence Green للأعداد المعلنة.

### Deploy safety
- هذا checkpoint docs-only؛ لا Production deploy/migration تم أو مطلوب.
- تغييرات Session 16 أصبحت CI Green، لكن Production DB parity ما زال غير مثبت؛ لا تستخدم Green المحلي كدليل parity.

## P1 — Story Quality backlog
- [x] Story critic heuristic scaffold موجود.
- [x] checkpoint inventory للست قصص وتحديد حدود critic والـplayer-count gaps.
- [ ] measurable Story Quality Baseline & Fairness Matrix لـ6/6.
- [ ] نقد/إعادة كتابة الست قصص: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] إزالة fictional preset identity ضمن rewrite منظم وإضافة role/gender wording.
- [ ] منع clue واحد من كشف المافيا مبكرًا، وحتى الأخير يحتاج ربطًا بما قبله.
- [ ] curated coverage: 4–5 ثم 6–7 ثم 8–10، مع matching gameplay E2E لأي player count جديد.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

الـAI generation جزء من المنتج لكنه ليس المصدر الوحيد للمحتوى؛ الهدف مكتبة curated قوية + AI generation تحت نفس قواعد الهوية والـfairness.

## الأولوية الدقيقة للجلسة التالية
نفّذ vertical slice **Story Quality Baseline & Fairness Matrix** فقط، بدون rewrite للقصص في نفس الجلسة:
1. افحص checks لهذا handoff commit أولًا؛ لو failure حقيقي أصلحه ضمن docs/checkpoint closure قبل scope جديد.
2. وسّع deterministic story QA من language/length heuristic إلى machine-readable inventory يغطي 6/6: player/mafia counts، clue progression، legacy identity/gender variant coverage، وsuspect×clue/fairness signals قابلة للمراجعة.
3. اجعل early-reveal/exclusive-clue risk ظاهرًا كwarning/report evidence بدل ادعاء semantic certainty لا يستطيع heuristic إثباتها.
4. أضف regression/CI wiring اللازم بحيث baseline قابل لإعادة التشغيل بدون live AI/LLM.
5. لا تبدأ rewrite للست قصص حتى baseline يحدد بالضبط أين مشاكل كل قصة.
6. Production parity يظل blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
