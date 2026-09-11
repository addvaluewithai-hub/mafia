# آخر خيط — Continuous QA Handoff

> هذا الملف هو مصدر الحقيقة **لحالة المشروع الحالية والهاند أوف المتغير بين الجلسات**. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

## الهدف
لعبة كاملة قابلة للعب من إنشاء الروم حتى إعلان الفائز، بدون deadlocks، بهوية اللاعب الحقيقية، وقصص مصرية طبيعية وعادلة، مع automated confidence للمسارات الحرجة.

## قواعد غير قابلة للتفاوض
- full-game path: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ caseRole وصف مرتبط باللاعب وليس اسم شخصية خيالية بديلة.
- gender للصياغة فقط ولا يؤثر على mafia assignment أو فرص الفوز.
- الـBoss لاعب كامل ويظل قادرًا على الإدارة حتى لو اتسجن.
- كل bug مهم أو متكرر يتحول إلى regression عندما يكون ذلك عمليًا.
- ممنوع إضعاف/حذف test لمجرد جعل CI أخضر.
- لا Production deploy أو migration إلا بعد E2E مناسب وقرار deploy-safe صريح هنا.
- الجلسة العادية تنفذ vertical slice واحدًا كاملًا عندما يكون ذلك آمنًا.

## P0 — Functionality / Deadlocks
- [x] vote gating defensive hotfix.
- [x] 60 deterministic full-game state simulations لـ5/6/7.
- [x] local Supabase full-game RPC E2E لـ5/6/7.
- [x] server-authoritative `phase` + `canVote` + UI contract.
- [x] reconnect regression: before cast → after cast → tie reset → resolve → next round.
- [x] eliminated Boss لا يصوت لكنه يحتفظ بـresolve/reveal admin controls.
- [ ] Production DB parity **blocked** حتى Production Supabase يكون active أو restore يتصرح به صراحة. لا migration قبل read-only parity + smoke-test plan.

## Production drift المعروف
Production كان فيها `case_mode` / `story_template_id` / `create_room_v2` قبل تسجيل كل ذلك في versioned migrations. parity لم تثبت لأن Production Supabase كان `INACTIVE`. لا تدّعِ أن migration حديث مطبق على Production بدون تحقق read-only.

## Identity / story contract — الحالة الحالية
- [x] `gender + caseRole` schema + snapshot/types regression.
- [x] gender-aware create/join backend + UI + mixed-gender E2E.
- [x] nickname-only PlayerCard identity.
- [x] `install_case` يملأ `caseRole` ويختار optional `roleByGender` / `bioByGender` بعد player shuffle بدون تغيير `order by random()` أو `mafiaCharacterIndexes`.
- [x] AI generators تطلب semantic `role + bio + roleByGender + bioByGender` مع semantic-equivalence rule واستقلال mafia assignment عن gender.
- [x] shared TypeScript contract: `GenderedCaseText`, `GeneratedCaseCharacter`, `GeneratedAiCase`.
- [x] الست curated presets migrated من fictional `name` إلى semantic `role` + complete male/female wording في Session 19.
- [ ] DB/snapshot legacy `character_name` و`character_bio` fields ما زالت موجودة للتوافق؛ لا تحذفها قبل compatibility audit منفصل.

## QA coverage الحالي
- vote UI authoritative contract.
- gender UI RPC + standalone join contract.
- player-card identity contract.
- generated-case schema/prompt/type/install contract للمسارين.
- caseRole + gender-aware install E2E.
- 60 deterministic full-game simulations.
- local Supabase full-game RPC E2E لـ5/6/7.
- eliminated Boss admin-controls E2E.
- deterministic story critic + machine-readable fairness baseline.
- curated-preset identity regression الآن داخل `story-critic.mjs`: يمنع fictional `name` ويرفض نقص `role`, neutral `bio`, `roleByGender`, أو `bioByGender` لأي character.

## Story Quality baseline
Session 18 أضاف baseline deterministic للست قصص: player/mafia counts، role/name coverage، clue-by-clue mention matrix، early-exclusive/decisive warnings، jargon/read-aloud burden، وplayer-count coverage. الـfairness signal lexical evidence فقط، وليس semantic guilt verdict.

## Session 18 — 2026-09-11 — Story Quality Baseline & Fairness Matrix
- code commit: `f7d5504992e209feeae4c99a16c2cd8bdc1f53f4`.
- handoff commit: `c0dcf1d6f2cd57b13b4714db50611b971edaad90`.
- **النتيجة النهائية التي تأكدت في Session 19:** `validate` ✅ و`qa` ✅ على handoff/main prerequisite.
- لا Production deploy/migration.

## Session 19 — 2026-09-11 — Rewrite/Migrate existing six curated presets
### Session type
Delivery — vertical slice واحد: تحويل الست curated presets الحالية end-to-end إلى story identity contract الجديد، مع تبسيط اللغة وتقليل الجارجون والحفاظ على نفس mafia assignment indexes.

### Starting evidence
- قُرئت `AGENTS.md` ثم `QA-OPERATING-MODE.md` ثم هذا handoff من default branch.
- أحدث `main` عند البداية كان `c0dcf1d6f2cd57b13b4714db50611b971edaad90`.
- checks على prerequisite/handoff `c0dcf1d6...`: `validate` ✅ و`qa` ✅؛ لا يوجد failure يسبق الـrewrite.
- Production parity ما زال blocker خارجيًا ولم يُلمس.

### Exact objective
Rewrite/Migrate الست presets فقط: إزالة fictional player identities، semantic roles + gender-aware wording، مصري أبسط وأسهل في القراءة بصوت عالٍ، وتقليل technical jargon، مع الحفاظ على mystery structure و`mafiaCharacterIndexes`. لم نفتح player-count expansion أو feature جديدة.

### What changed
Migrated all six files under `lib/server-stories/`:
- `clock-1117.ts`
- `room-312.ts`
- `blue-notebook.ts`
- `last-rehearsal.ts`
- `fourth-floor.ts`
- `silent-auction.ts`

لكل character الآن:
- `role` semantic غير اسم شخص.
- neutral fallback `bio`.
- `roleByGender.male/female` بنفس معنى الدور.
- `bioByGender.male/female` بنفس الحقائق والفرصة والاشتباه.
- لا `name` fictional fields في curated content.

Story text نفسه اتبسط في premise/clues/prompts/solution، خصوصًا المصطلحات التقنية الثقيلة مثل relay/dust-analysis style wording. الـclues تشير إلى semantic roles بدل أسماء شخصيات خيالية، بحيث nickname الحقيقي يظل هوية اللاعب.

### Regression / fairness guard
`story-critic.mjs` اتغير من name-based fairness inventory إلى semantic-role-based inventory. وبدل ما legacy identity تكون warning فقط، integrity يفشل CI لو أي curated preset:
- رجّع `name` fictional field.
- ناقص `role` لأي character.
- ناقص neutral `bio`.
- ناقص `roleByGender` أو `bioByGender` لأي character.
- عنده invalid `mafiaCharacterIndexes` أو no clues.

الـfairness matrix الآن تستخدم role mentions (`mentionedRoles`, `mafiaMentionedRoles`, `nonMafiaMentionedRoles`) وتظل lexical deterministic evidence وليست semantic verdict.

### Mafia assignment safety
`mafiaCharacterIndexes` لم تتغير:
- `clock-1117`: `[1]`
- `room-312`: `[4]`
- `blue-notebook`: `[1, 2]`
- `last-rehearsal`: `[1, 4]`
- `fourth-floor`: `[1, 6]`
- `silent-auction`: `[0, 1]`
Gender variants لا تدخل في الاختيار أو الشفل.

### Commits
- `dcf845e03dceab4d2bfc84ff8e309da3312f18e3` — clock-1117 migration.
- `be2ff3d285d1601637a5beb78eeb5442a0c17479` — blue-notebook migration.
- `3086d683309403b73dc8afd36bff281f7dff5066` — fourth-floor migration.
- `1c71791e37eb38d21b29e43881cba69fd4d9eee9` — last-rehearsal migration.
- `30bc8c0850f12d878ca0b4fa73b918174a127a8a` — room-312 migration.
- `05410e4885f4b39baf80790afef0718ac2a0b3f1` — silent-auction migration.
- `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0` — semantic-role story critic + strict curated identity regression.

### Evidence / checks
- prerequisite `c0dcf1d6...`: `validate` ✅ و`qa` ✅.
- checks على `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0` عند آخر فحص: `validate` in_progress و`qa` in_progress، ولا يوجد failure ظاهر حتى handoff.
- لذلك Session 19 **ليست deploy-safe بعد** حتى يقفل full CI Green.

### Newly discovered bugs / risks
- لا gameplay bug جديد ظهر أثناء الـrewrite.
- semantic-role lexical matrix أحسن من name matrix بعد migration، لكنه ما زال لا يفهم الإشارات الضمنية أو قوة clue دلاليًا؛ يحتاج human/content review بجانب التقرير.
- neutral fallback `bio` موجود للتوافق، لكن تجربة اللاعب الطبيعية مع gender معروف يجب أن تستخدم `bioByGender` عبر `install_case`؛ هذا contract مغطى سابقًا بالـgender install E2E.
- player-count library ما زالت 5/6/7 فقط؛ 4 و8–10 غير مدعومين كمكتبة curated حتى matching case + gameplay E2E.

### Deploy safety
- لا Production deploy، restore، migration، أو DB write حدث.
- Production parity blocker مستقل ولم يُلمس.
- لا تعتبر الـpreset migration deploy-safe حتى `validate` وfull `qa` على `8bb4e2b...` يقفلوا Green.

## P1 — Story / library backlog
- [x] deterministic Story Quality Baseline & Fairness Matrix لـ6/6.
- [x] migrate/rewrite الست curated presets إلى semantic roles + gender-aware wording + simpler Egyptian Arabic.
- [ ] close Session 19 only after Green CI; fix first real failure if any.
- [ ] curated 4–5 & 6–7 coverage مع player-count selection contract وmatching local full-game E2E لأي عدد جديد، خصوصًا 4.
- [ ] curated 8–10 expansion + full-game E2E لـ8/9/10 قبل إعلان الدعم.
- [ ] لاحقًا: semantic/human story review أعمق للـfairness/plausibility بعد اتساع المكتبة.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Case Library → New Gameplay Features → Polish/Launch**.

الـAI generation جزء من المنتج، لكن الهدف مكتبة curated قوية + AI generation تحت نفس قواعد الهوية والـfairness.

## الأولوية الدقيقة للجلسة التالية — بعد Session 19
1. افحص checks للـcommit `8bb4e2b25cfe0132df78be670cdf6d4c5ab068a0` أولًا.
2. إذا ظهر failure حقيقي: أصلح **أول failure فقط** داخل preset-migration objective مع regression مناسب، ولا تبدأ player-count expansion.
3. إذا `validate` و`qa` Green: أغلق Session 19 ثم نفّذ vertical slice واحدًا **Curated 4–5 & 6–7 library coverage**. أضف/كيّف selection/content بحيث 4–5 و6–7 coverage مقصودة وليست unrelated-count fallback، وأضف matching local full-game E2E لأي عدد جديد—خصوصًا 4—قبل وصفه supported.
4. لا تبدأ 8–10 في نفس الجلسة؛ ده slice مستقل بعد 4–7 Green.
5. لا تغيّر mafia assignment بسبب gender.
6. Production parity يظل blocked ولا يُلمس إلا إذا Production أصبح active أو وُجد تصريح restore صريح.
