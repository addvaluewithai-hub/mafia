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
- [x] local Supabase full-game RPC E2E.
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
- [x] shared TypeScript contract الآن يصرّح بـ`GenderedCaseText`, `GeneratedCaseCharacter`, و`GeneratedAiCase`; legacy `GeneratedCase` يبقى compatible مع preset cases القديمة بينما `GeneratedAiCase` يجعل role والـgender variants mandatory.
- [ ] `character_name` و`character_bio` ما زالا legacy story fields؛ إزالة/تحويل legacy preset identity مؤجل لبعد checkpoint وتخطيط Story Quality.

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
- النتيجة النهائية التي تأكدت في Session 16: `validate` ✅ و`qa` ✅.
- كلا AI paths يطلب ويvalidate gender-aware role/bio variants، والـprompt يمنع اختلاف الحقائق أو mafia assignment حسب الجنس.
- لم يحدث Production deploy أو migration.

## Session 16 — 2026-09-10 — Generated Case Identity Contract closure
### Session type
Delivery — هدف واحد متكامل لإغلاق typed generated-case identity contract قبل الانتقال إلى Story Quality checkpoint.

### Starting evidence
- قُرئت `AGENTS.md` ثم `QA-OPERATING-MODE.md` ثم هذا handoff.
- أحدث `main` عند البداية كان `3d34620b447b2afb3d7af2a2d6baa360549b2498`.
- checks على `6d7ea4db2dc9df164d06bd77d9afaa8611b34124`: `validate` ✅ و`qa` ✅، لذلك Session 15 اتقفلت رسميًا.
- checks على latest docs baseline `3d34620b447b2afb3d7af2a2d6baa360549b2498`: `validate` ✅ و`qa` ✅.
- Production parity بقي blocked ولم يُلمس.

### Reproduction / design finding
- runtime contracts كانت أسبق من TypeScript: AI schemas/validators/install path تتعامل مع `roleByGender` و`bioByGender`، لكن `lib/types.ts` كان يمثل character فقط كـ`role?`, `name?`, `bio`.
- جعل variants mandatory داخل `GeneratedCase` نفسه كان سيكسر preset cases legacy، لأن نفس النوع مستخدم للتوافق مع القضايا الجاهزة القديمة.
- الحل الآمن هو فصل contract عام legacy-compatible عن contract صارم للـAI بدل إجبار presets على migration جانبي في نفس الجلسة.

### ما تم
- [x] أضيف `GenderedCaseText { male, female }`.
- [x] أضيف `GeneratedCaseCharacter` مع optional `roleByGender` / `bioByGender` للحفاظ على preset compatibility.
- [x] أضيف `GeneratedAiCase` ويجعل `role`, `roleByGender`, `bioByGender` mandatory للـAI contract.
- [x] وُسع `scripts/qa/generated-case-role-contract.mjs` ليثبت typed contract بجانب schema/prompt/install handoff.
- [x] regression يثبت أن legacy `name?` ما زال مسموحًا فقط للتوافق مع القضايا الجاهزة الحالية، بينما AI contract صار typed بوضوح بدون تخفيف runtime validators.
- [x] لم يتغير mafia assignment/randomization أو gameplay logic.
- [x] لم يُحذف أو يُضعف أي test.
- [x] لم يحدث Production deploy أو migration أو DB write.

### Commits
- `d679dfcbfa7018b95a2a654df7fa97520a42d909` — complete generated case gender wording TypeScript contract.
- `8ee7956dbe38bc8ffaebcc04dcf2fb964013d7f2` — extend generated-case regression to guard typed contract.

### Evidence / checks عند إغلاق الجلسة
- checks على `8ee7956dbe38bc8ffaebcc04dcf2fb964013d7f2`: `validate` in_progress و`qa` in_progress عند آخر فحص، ولا يوجد failure ظاهر.
- لذلك commit Session 16 **ليس deploy-safe بعد** حتى تقفل checks Green.
- الـbaseline السابق والـAI generator prerequisite كلاهما Green.

### Newly discovered bugs / risks
- `GeneratedAiCase` موجود الآن كـstrict shared type لكن server route ما زال يرجع من `validateCase(...): GeneratedCase` مع runtime flag؛ هذا ليس runtime defect لأن validator يفرض variants للـAI، لكنه type-narrowing opportunity لاحق وليس مبررًا لفتح session identity جديدة قبل checkpoint.
- لا يوجد semantic model-evaluation test حيّ على جودة تطابق male/female؛ الاختبارات deterministic وتثبت contract/prompt فقط. Live-model CI غير مناسب حاليًا بسبب flakiness/cost.
- preset stories ما زالت legacy في fictional identity/gender variants؛ تحويلها يجب أن يدخل Story Quality/curated-content plan بدل patch منفصل بلا مراجعة حبكة وفيرنس.

### Roadmap impact
Milestone B (Identity & Story Contract Stable) أصبح قريبًا جدًا من الإغلاق: runtime generator/install + UI identity + shared types كلها متوافقة، والمتبقي legacy preset migration/content debt. قبل لمس ذلك نحتاج checkpoint يقرر هل يتحول ضمن Story Quality بدل identity cleanup منفصل.

## P1 — Story Quality backlog
- [x] Story critic heuristic scaffold موجود.
- [ ] نقد الست قصص الحالية: clarity, plausibility, fairness, ambiguity, escalation, Egyptian naturalness.
- [ ] suspects × clues matrix لكل قصة.
- [ ] إعادة كتابة premise/role/bio/clues بمصري طبيعي مع إزالة fictional identity legacy بطريقة منظمة.
- [ ] منع clue واحد من كشف المافيا مبكرًا، وحتى الأخير يحتاج ربطًا بما قبله.
- [ ] تصميم curated case coverage: 4–5 ثم 6–7 ثم 8–10 لاعبين، مع automated validation قدر الإمكان.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

الـAI generation جزء من المنتج لكنه ليس المصدر الوحيد للمحتوى؛ الهدف مكتبة curated قوية + AI generation تحت نفس قواعد الهوية والـfairness.

## الأولوية الدقيقة للجلسة التالية
نفّذ **Checkpoint/Planning session فقط** قبل أي story rewrite أو feature جديدة:
1. افحص أولًا checks للـcommit `8ee7956dbe38bc8ffaebcc04dcf2fb964013d7f2`; لو failure حقيقي، أصلح أول failure فقط كاستثناء قبل checkpoint.
2. لو Green، اعتبر Generated Case Identity Contract مغلقًا وراجع Milestone A/B بالأدلة الحالية.
3. اعمل audit للـfull-game coverage الحالية وحدد أي gaps حقيقية في player counts / ties / reconnect / winner / Boss behavior، بدون اختراع work لو التغطية كافية.
4. راجع الست preset stories والـstory critic الحالي على مستوى inventory/coverage والـlegacy identity debt، ولا تبدأ rewrite واسع في نفس checkpoint.
5. اخرج بـ3–4 vertical slices مرتبة لـStory Quality ثم Curated Case Library، مع Done-when واضح لكل slice وأولوية واحدة دقيقة للجلسة التالية.
6. Production parity يظل blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
