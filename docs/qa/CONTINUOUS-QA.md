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

## Session 31 — 2026-09-11 — Room Creation / Join Abuse Protection
### Session type
Delivery — هدف launch-safety واحد فقط. لا gameplay/story/feature إضافية ولا Production mutation.

### Starting evidence
- قرأت بالترتيب: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → هذا الهاند أوف من default branch.
- `main` عند البداية: `faf19e4a158684ceaa7c593f7eb2f49b3be2496e`.
- prerequisite Session 30 اتقفل Green: `validate` و`qa` completed/success.
- Production recheck: المشروع ما زال `INACTIVE`; restore غير مصرح به.

### Exact objective
Server-authoritative bounded throttling لإنشاء الروم والانضمام، مع تغطية current + legacy RPCs حتى لا توجد version-based bypasses، مع الحفاظ على create/join/idempotent behavior الطبيعي.

### Reproduction / design finding
- `create_room_v3` و`join_room_v2` لم يكن عليهما durable room/join budget.
- legacy authenticated RPCs (`create_room`, `create_room_v2`, `join_room`) بقيت callable؛ حماية أحدث RPC فقط كانت ستترك bypass مباشرًا.
- limiter لازم يكون Postgres-backed؛ client-only/in-memory غير كافٍ.
- join accounting موضوع قبل successful insert بعد validations؛ بالتالي retries/idempotent/validation errors لا تستهلك budget. هذا يحمي successful multi-room join spam، لكنه لا يعد invalid room-code probes لأن exception rollback يعيد transaction؛ الخطر موثق صراحة.

### Code / database / tests
- `supabase/migrations/20260911164000_room_join_rate_limit.sql`: جدول private `room_action_rate_limits` keyed by auth user + action، window = 10 دقائق، create max = 5، successful join max = 8.
- `claim_room_action_slot(text)` داخلي فقط؛ table access وdirect execute مسحوبان من `public`, `anon`, `authenticated`.
- `create_room_v3`, `create_room_v2`, `create_room` تشترك في نفس create budget.
- `join_room_v2`, `join_room` يشتركان في نفس join budget؛ existing-member/host idempotent returns لا تُحسب.
- `scripts/qa/room-join-rate-limit-e2e.mjs`: 5 creates ثم block السادس؛ legacy create لا يتجاوز limiter؛ 8 joins ثم block التاسع عبر legacy join؛ state/function private؛ constants explicit.
- `.github/workflows/game-qa.yml` يشغل الـE2E الجديد بعد AI generation abuse guard.

### Commits
- `d33fc2843e54ab28e65e31e14cf14d5a16304282` — `feat: throttle room creation and joins`.
- `885e049994dd7ef7f63be41a52b05ee2dd1adad6` — `qa: cover room and join throttling`.
- `bdd73e1a8b6ba0c4a3fa6dcb51d628d6a1c6b36d` — `qa: run room and join abuse guard`.

### Checks / evidence
- Session 30 prerequisite: `validate` ✅ و`qa` ✅.
- `bdd73e1a...`: `validate` ✅ completed/success؛ `qa` ما زال `in_progress` عند آخر فحص، بدون failure مُبلغ حتى الآن. الـroom/join local E2E لم يُثبت Green بعد.

### Newly discovered bugs / risks
- لا gameplay P0/P1 جديد.
- الحماية per authenticated anonymous identity وليست per IP/device؛ reset للهوية يعطي budget جديد.
- invalid/nonexistent room-code probing غير محسوب durable داخل نفس RPC بسبب transaction rollback؛ الحل الصحيح يحتاج gateway/request-boundary/token design منفصل، وليس تغييرًا جانبيًا داخل هذه الجلسة.
- Production لا يحتوي migrations Session 30/31 لأنه inactive ولم يحدث أي write.

### Deploy-safety status
**Not deploy-safe yet لأن `qa` لـ`bdd73e1a...` ما زال يعمل.** `validate` Green. لا Production deploy/restore/migration/data write حدث.

### Roadmap impact
أغلقنا ثاني launch-abuse slice بعد AI generation. Sessions 29–31 أصبحت 3 implementation sessions بعد Checkpoint 28، لذلك بعد Green يجب عمل checkpoint بدل feature جديدة.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract stable.
- [x] Curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection؛ Green.
- [ ] Room creation/join abuse protection؛ implementation complete، `validate` Green و`qa` running.
- [ ] Production parity blocked while Supabase is `INACTIVE`.
- [ ] بعد checkpoint فقط: observability/error telemetry، provider quotas/runbook، possible gateway/IP-level probe controls، ثم polish/docs drift.
- [ ] 11–15 فقط إذا gameplay/UX evidence لاحقًا يبرر.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا `qa` لـ`bdd73e1a8b6ba0c4a3fa6dcb51d628d6a1c6b36d`. إذا فشل بسبب الـroom/join abuse guard، أصلح أول failure meaningful فقط ولا تبدأ scope جديد. إذا Green، نفّذ **Checkpoint/Planning session فقط**: audit launch-safety coverage، residual abuse risks، Production blocker، full-game health، story/library status، technical/docs drift، ثم حدد 3–4 milestones تالية وأولوية واحدة دقيقة بدون feature implementation.
