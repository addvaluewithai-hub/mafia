# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss لاعب كامل ويحتفظ بإدارة اللعبة بعد elimination.
- bug مهم → regression عندما يكون عمليًا؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 معروف.
- Identity/story contract: gender + caseRole + nickname-only identity + curated/AI semantic roles Green. Legacy audit: `character_name` compatibility-only و`character_bio` runtime-required.
- Curated library: قصتان لكل عدد 4–10، fairness review مكتمل، packs: `home-social`, `stage-events`, `work-records`. 11–12 AI-only؛ 13–15 غير مستهدفة.
- Production parity blocked: Supabase `bwxgzcppxdrfcaorobpm` rechecked read-only في Session 31 وما زال `INACTIVE`. لا restore/write/migration بدون تصريح صريح.
- Known non-blocking drift: README roadmap متأخر.

## Recent milestones
- Sessions 18–21 Story Quality + curated 4–10: Green.
- Session 22 Checkpoint: Green.
- Session 23 deep curated fairness: Green.
- Sessions 24–25 shared registry + QA repair: Green.
- Session 26 legacy identity audit: Green.
- Session 27 same-room rematch: Green.
- Session 28 Checkpoint: Green.
- Session 29 curated packs/theme browsing: Green.
- Session 30 AI Generation Abuse Protection: Green.
- Session 31 room/join abuse protection: initial Game QA failure بسبب legacy Boss-row regression.
- Session 32 repair: `24c78e3bf09bad67dac9bc3f21461196f9f83b0c` أصبح `validate` ✅ و`qa` ✅.

## Session 32 — 2026-09-11 — Repair legacy Boss identity regression
### Session type
Delivery repair — إصلاح أول failure meaningful من Session 31 فقط.

### Result
- migration `20260911173000_fix_legacy_create_room_boss.sql` أعادت Boss player row للـlegacy `create_room` مع الحفاظ على throttling.
- لم يتم إضعاف regression.
- prerequisite repair commit `24c78e3bf09bad67dac9bc3f21461196f9f83b0c`: CI completed/success وGame QA completed/success.

## Session 33 — 2026-09-11 — Solo Play / AI Players MVP
### Session type
Delivery feature — explicit product request من المستخدم قدّم هذا الـvertical slice على الـcheckpoint المخطط. لم يتم فتح feature ثانية.

### Starting evidence
- قرأت `AGENTS.md` → `QA-OPERATING-MODE.md` → هذا الهاند أوف من default branch.
- فحص prerequisite `24c78e3bf09bad67dac9bc3f21461196f9f83b0c`: `validate` و`qa` كلاهما completed/success.
- لا P0 gameplay failure معروف عند البداية.

### Exact objective
تمكين شخص واحد من إنشاء ماتش تجريبي 4 لاعبين: Boss بشري + 3 computer/AI players، بحيث يدخلوا نفس lifecycle للأدوار والتصويت ولا يعملوا deadlock بسبب عدم امتلاك auth sessions.

### Design / safety finding
- `players.user_id` و`player_roles.user_id` كانا `NOT NULL` ومربوطين بـ`auth.users`، لذلك إنشاء fake auth identities للbots كان تصميمًا غير آمن وغير ضروري.
- الـMVP يجعل bot player داخل نفس `players` table لكن `user_id = null` و`is_bot = true` تحت constraint صريح؛ البشر يظلون `user_id != null`.
- bot voting server-side يستخدم فقط clues المكشوفة + secret team role الخاص بالbot. لا يقرأ `case_secrets.solution` ولا يرسل private role/solution للعميل.
- هذه النسخة ليست LLM conversation agent بعد: هي computer-player MVP بقرار تصويت heuristic مبني على الأدلة، لتثبيت gameplay/data/security contract أولًا.

### Code / database / UI / tests
- migration `20260911180000_ai_players_mvp.sql`:
  - nullable bot-safe `user_id` + `players.is_bot` constraint.
  - `add_ai_player` و`remove_ai_player` Boss-only/lobby-only مع احترام `max_players`.
  - `cast_ai_votes` Boss-only/voting-only، idempotent per round، ويستخدم نفس `votes` table ونفس eligible-voter accounting.
  - mafia bot يتجنب teammate عندما يوجد innocent target؛ innocent bot يميل لدور مشتبه مذكور في clues المكشوفة، مع random tie-break.
- `lib/game.ts`: actions للـAI players، و`resolveVote` يشغّل bot votes قبل الحسم حتى لا تنتظر اللعبة auth sessions غير موجودة.
- `app/solo.tsx`: one-tap solo setup لـ4 لاعبين بقضية curated `last-tray`: المستخدم + 3 AI.
- `app/index.tsx`: CTA واضح `جرّب لوحدك ضد AI`.
- `scripts/qa/ai-players-e2e.mjs`: local Supabase regression من lobby → 3 bots → install case → human vote + 3 bot votes → resolve غير pending، مع capacity/idempotency assertions.
- `.github/workflows/game-qa.yml`: أضيف AI players E2E للـGame QA، وتم تصحيح label القديم للـfull-game إلى 4–10.

### Commits
- `0a5262710d8679a0bf4a61e76ff09d35fd0cc015` — DB AI-player lifecycle + voting.
- `13e8e8acdd721ab8f87e8e3f06deb093dd09f417` / `2b59ab241284474b8a78a737e1f56ecde7cb16bc` — client actions + automatic bot voting before resolve.
- `08eff1b2338e7a861916cd3c578dd0e15e6fe772` — solo playtest screen.
- `c7e1990fc8da32b18596dad9433b30737ccaac76` — home CTA.
- `b892cee6fec186033b89b6373117f70ab29d3f0e` — AI players local E2E.
- `a84f900804440d716f783c402e2a877a5b91e3c4` — Game QA integration.

### Checks / evidence
- prerequisite Session 32 repair: `validate` ✅ و`qa` ✅.
- عند آخر فحص لـ`a84f9008...`: GitHub لم يكن قد أنشأ check runs بعد (`0 check runs`). لذلك لا توجد دعوى Green للتغيير الجديد بعد.

### Newly discovered bugs / risks
- AI players MVP لا ينتج نقاشًا نصيًا/صوتيًا بعد؛ الذكاء الحالي محدود لاختيار التصويت من الأدلة المكشوفة. هذا مقصود كـMVP وليس ادعاء LLM-agent كامل.
- bot identity يعتمد حاليًا على prefix `AI ` في الاسم للعرض؛ `is_bot` لم يُضف بعد إلى `room_snapshot` UI contract. الـDB contract نفسه صريح وآمن.
- solo screen يستخدم قضية 4-player واحدة (`last-tray`) كبداية سريعة؛ اختيار القضية/عدد bots لاحقًا يمكن أن يكون slice منفصل بعد ثبوت الـMVP.
- Production ما زالت inactive، لذلك المستخدم لن يقدر يجرب feature على production قبل restore/migration/deploy مصرح به.

### Deploy-safety status
**Not deploy-safe.** local E2E الجديد والـfull Game QA لم يثبتا Green بعد، وProduction inactive. لم يحدث Production restore/deploy/migration/data write.

### Roadmap impact
Solo/AI Players أصبح feature MVP فعلي بدل فكرة فقط. قبل توسيعه إلى LLM discussion أو أعداد أكبر يجب أولًا إثبات DB/full-game E2E Green ثم عمل checkpoint لأن cadence كان مستحقًا أصلًا.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection.
- [x] Room creation/join abuse protection + legacy Boss regression repair.
- [ ] Solo/AI Players MVP: implementation committed؛ deploy safety معلقة على Game QA الجديدة.
- [ ] Production parity blocked while Supabase is `INACTIVE`.
- [ ] بعد checkpoint: قيّم AI discussion/reasoning UX مقابل launch-safety/observability، ولا توسع bots عشوائيًا قبل ثبوت الـMVP.
- [ ] 11–15 فقط إذا gameplay/UX evidence لاحقًا يبرر.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا `validate` وGame QA لـ`a84f900804440d716f783c402e2a877a5b91e3c4`. إذا ظهر failure حقيقي في AI Players أو regression موجود، أصلح أول failure meaningful فقط. إذا Green بالكامل، نفّذ **Checkpoint/Planning session فقط**: قيّم Solo/AI MVP وfull-game/security coverage، ثم قرر هل أعلى milestone تالٍ هو AI discussion agents أم Production/launch-safety/observability، مع 3–4 أهداف مرتبة وبدون implementation جديد في نفس checkpoint.
