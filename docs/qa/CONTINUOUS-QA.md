# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss لاعب كامل ويحتفظ بإدارة اللعبة بعد elimination.
- bug مهم → regression عندما يكون عمليًا؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 معروف قبل regression Session 31.
- Identity/story contract: gender + caseRole + nickname-only identity + curated/AI semantic roles Green. Legacy audit: `character_name` compatibility-only و`character_bio` runtime-required.
- Curated library: قصتان لكل عدد 4–10، fairness review مكتمل، packs: `home-social`, `stage-events`, `work-records`. 11–12 AI-only؛ 13–15 غير مستهدفة.
- Production parity blocked: Supabase `bwxgzcppxdrfcaorobpm` rechecked read-only في Session 31 وما زال `INACTIVE`. لا restore/write/migration بدون تصريح صريح.
- Known non-blocking drift: اسم full-game workflow step ما زال يقول 4/5/6/7 رغم أن التغطية 4–10؛ README roadmap متأخر.

## Recent milestones
- Sessions 18–21 Story Quality + curated 4–10: Green.
- Session 22 Checkpoint: Green.
- Session 23 deep curated fairness: Green.
- Sessions 24–25 shared registry + QA repair: Green.
- Session 26 legacy identity audit: Green.
- Session 27 same-room rematch: Green.
- Session 28 Checkpoint: Green.
- Session 29 curated packs/theme browsing: Green.
- Session 30 AI Generation Abuse Protection: `validate` ✅ و`qa` ✅ على `d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a`.
- Session 31 room/join abuse protection: `validate` ✅ لكن `qa` ❌ بسبب legacy `create_room` Boss-row regression؛ Session 32 أصلح أول failure meaningful.

## Session 32 — 2026-09-11 — Repair legacy Boss identity regression
### Session type
Delivery repair — إصلاح أول failure meaningful من Session 31 فقط. لم يبدأ checkpoint أو feature جديد.

### Starting evidence
- قرأت بالترتيب: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → هذا الهاند أوف من default branch.
- أحدث main قبل الإصلاح: `99335765f2611c4f830690df6438988fbd37235d`.
- prerequisite `bdd73e1a8b6ba0c4a3fa6dcb51d628d6a1c6b36d`: CI completed/success، Game QA completed/failure.
- Game QA فشل في أول local DB contract: `Player identity schema contract`; كل static contracts و140 full-game simulations السابقة له كانت Green، وباقي local E2E اتعمل لها skip بعد failure.

### Exact objective
استعادة legacy `create_room` identity contract الذي كسرته Session 31، مع الإبقاء على create-room throttling نفسه ومن دون إضعاف regression أو بدء scope جديد.

### Reproduction / design finding
- migration `20260911164000_room_join_rate_limit.sql` أعادت تعريف legacy `create_room` لإضافة `claim_room_action_slot('create_room')`.
- أثناء إعادة التعريف سقط سطر إنشاء Boss player row: تم إنشاء `rooms` row لكن لم يتم إدخال `(room_id, auth.uid(), boss nickname)` في `players`.
- `scripts/qa/player-identity-schema-e2e.mjs` يعتمد بحق على أن legacy create + join ينتجان Boss وplayer identities؛ لذلك failure regression حقيقي وليس test drift.

### Code / database / tests / docs
- أضيفت migration تصحيحية additive: `supabase/migrations/20260911173000_fix_legacy_create_room_boss.sql`.
- migration تعيد legacy `create_room` بنفس validations ونفس shared create budget، ثم تعيد إدخال Boss في `players` قبل `room_created` event.
- لم يتم تعديل أو حذف أو تخفيف `player-identity-schema-e2e.mjs`؛ نفس regression هو gate للإصلاح.
- لا UI/story/feature unrelated changes.

### Commits
- `24c78e3bf09bad67dac9bc3f21461196f9f83b0c` — `fix: preserve boss identity in legacy room creation`.

### Checks / evidence
- failing prerequisite evidence: CI ✅، Game QA ❌ في `Player identity schema contract` على `bdd73e1a...`.
- checks على `24c78e3b...` يجب حسمها أولًا في الجلسة التالية/قبل أي scope جديد؛ لا يُعتبر الإصلاح Green حتى تكمل workflows بنجاح.

### Newly discovered bugs / risks
- regression Session 31 كان أوسع من abuse guard نفسه: أي caller يستخدم legacy `create_room` كان يحصل على room بلا Boss player identity.
- لا evidence على P0 آخر حتى الآن لأن local E2E اللاحقة تم skip بعد أول failure؛ يجب انتظار Game QA كاملة بعد الإصلاح.
- residual abuse risks السابقة باقية: limiter per authenticated identity وليس IP/device، وinvalid room-code probes لا تُحسب durable بسبب rollback داخل RPC.
- Production ما زالت blocked/inactive ولم يحدث أي write أو migration عليها.

### Deploy-safety status
**Not deploy-safe.** الإصلاح committed لكن full Game QA الجديدة لم تُثبت Green بعد. لا Production deploy/restore/migration/data write حدث.

### Roadmap impact
Session 32 ليست feature session؛ هي repair إلزامي قبل checkpoint. إذا أصبحت Game QA Green بالكامل، يكون الـcheckpoint هو الجلسة التالية لأن Sessions 29–31 كانت ثلاث implementation sessions بعد Checkpoint 28.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable قبل Session 31 regression.
- [x] Identity/story contract stable قبل Session 31 regression.
- [x] Curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection؛ Green.
- [ ] Room creation/join abuse protection: implementation موجود، لكن deploy safety معلقة حتى يثبت إصلاح legacy Boss identity أن Game QA كاملة Green.
- [ ] Production parity blocked while Supabase is `INACTIVE`.
- [ ] بعد checkpoint فقط: observability/error telemetry، provider quotas/runbook، possible gateway/IP-level probe controls، ثم polish/docs drift.
- [ ] 11–15 فقط إذا gameplay/UX evidence لاحقًا يبرر.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا CI وGame QA لـ`24c78e3bf09bad67dac9bc3f21461196f9f83b0c`. إذا ظهر failure حقيقي، أصلح أول failure meaningful فقط ولا تبدأ scope جديد. إذا Green بالكامل، نفّذ **Checkpoint/Planning session فقط**: audit launch-safety coverage، residual abuse risks، Production blocker، full-game health، story/library status، technical/docs drift، ثم حدد 3–4 milestones تالية وأولوية واحدة دقيقة بدون feature implementation.
