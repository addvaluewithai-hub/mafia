# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التفاصيل التاريخية الكاملة محفوظة في Git history؛ هذا الملف يركز على الحالة التنفيذية الحالية.

## الهدف والقواعد الثابتة
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو هوية اللاعب الظاهرة؛ caseRole وصف وليس اسم شخصية بديلة.
- gender للصياغة فقط، ولا يؤثر على mafia assignment أو الفوز.
- Boss لاعب كامل ويحتفظ بإدارة اللعبة بعد elimination.
- bug مهم → regression عندما يكون عمليًا؛ ممنوع إضعاف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد كامل؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## P0 / Core status
- [x] vote gating + server-authoritative `phase/canVote` + UI guard.
- [x] reconnect: before/after cast → tie reset → resolve → next round.
- [x] eliminated Boss admin controls + eliminated-player vote rejection.
- [x] deterministic + local Supabase full-game RPC coverage لـ4–10 لاعبين.
- [x] same-room rematch E2E Green: finish → Boss-only reset → preserved players → clean lobby → fresh second case.
- [ ] Production DB parity blocked: Supabase project `bwxgzcppxdrfcaorobpm` rechecked read-only in Session 30 and still `INACTIVE`; no restore/write/migration بدون تصريح صريح. بعد restore المطلوب أولًا read-only schema/RPC/migration parity + smoke plan.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity; gender-aware install بعد shuffle بدون تأثير على mafia selection.
- [x] AI generator + curated presets يستخدمان semantic role/bio + male/female variants.
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.
- [x] server preset/AI-reference path يستخدم shared `lib/server-stories` registry.
- [x] legacy identity audit موثق في `docs/qa/LEGACY-IDENTITY-COMPATIBILITY-AUDIT.md`: `character_name` compatibility-only و`character_bio` runtime-required حاليًا.

## Current curated library
- 4: `last-tray`, `balcony-key`.
- 5: `clock-1117`, `room-312`.
- 6: `last-rehearsal`, `blue-notebook`.
- 7: `fourth-floor`, `silent-auction`.
- 8: `rooftop-envelope`, `backstage-pass`.
- 9: `gallery-ledger`, `garden-locker`.
- 10: `midnight-menu`, `archive-seal`.
- Theme packs: `home-social` (لمة وبيت), `stage-events` (مسرح وفعاليات), `work-records` (شغل وسجلات). Pack browsing is always filtered inside the active exact player count.
- 11–12: AI-only؛ لا curated support معلن. 13–15 غير مستهدفة حاليًا.

## QA coverage
- vote/gender/join/player-card/generated-case/legacy-identity contracts.
- caseRole + gender-aware install E2E.
- story critic + lexical fairness + curated identity integrity guards.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، shared registry/API/Expo path، pack metadata integrity، player-count-first pack filtering، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10 + tie/reconnect + eliminated Boss + rematch.
- AI generation abuse E2E added in Session 30: host-only DB-backed claim, 20s cooldown, 3 attempts / 10 minutes, preset exclusion, private limiter state, both server entrypoints required to enforce HTTP 429.
- Known non-blocking drift: اسم خطوة full-game في `.github/workflows/game-qa.yml` ما زال يقول 4/5/6/7 رغم أن suite يغطي 4–10؛ README roadmap أيضًا متأخر عن features المنفذة.

## Recent milestones
- Sessions 18–21: Story Quality baseline + semantic preset migration + curated 4–10 expansion; Green.
- Session 22: Checkpoint; Green.
- Session 23: Deep Curated Story Fairness Review; Green.
- Sessions 24–25: shared curated registry + QA repair; Green.
- Session 26: Legacy DB Identity Compatibility Audit; Green.
- Session 27: Same-room Rematch; Green.
- Session 28: Checkpoint/Planning; Green.
- Session 29: Curated Case Packs / Theme Browsing, code/QA `9d4b7ac442d99a2a0683ad28cc6c0e79cec5453e`; `CI` ✅ and `Game QA` ✅.

## Session 30 — 2026-09-11 — AI Generation Abuse / Public-launch Protection
### Session type
Delivery — exactly one Production/Launch Safety slice. No unrelated feature, gameplay rule change, story change, player-count expansion, Production restore, Production migration, or Production data write.

### Starting evidence
- Mandatory read order completed from default branch: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- `main` at start: `fee9566ac053177847bbd555879b28bb3a53dd64`.
- Session 29 prerequisite resolved before implementation: GitHub Actions `CI` and `Game QA` both completed/success on `9d4b7ac442d99a2a0683ad28cc6c0e79cec5453e`.
- Production gate was rechecked read-only via Supabase: project `bwxgzcppxdrfcaorobpm` remains `INACTIVE`. Restore was not explicitly authorized, so Production parity remained blocked and no Production mutation was attempted.
- No failing check or known P0 tied to the active objective was present.

### Exact objective
Protect the costly AI case-generation path from repeated anonymous-session abuse before public launch, using a durable server-authoritative budget that cannot be bypassed by client UI changes, while leaving curated preset play unaffected.

### Reproduction / design finding
- Both server case-generation entrypoints authenticated the Boss and checked lobby state, but an authenticated anonymous Boss could repeatedly invoke Gemini generation with no durable cooldown or per-user request budget.
- Client-only throttling would be bypassable, and an in-memory serverless limiter would be unreliable across instances. The limiter therefore needs to live in Postgres and be claimed before any Gemini call.
- Preset cases do not incur model-generation cost and must not consume AI budget.

### Code / database / API / test changes
- `supabase/migrations/20260911154500_case_generation_rate_limit.sql` adds private `case_generation_rate_limits` state keyed by authenticated user and a `claim_case_generation_slot(p_code)` SECURITY DEFINER RPC.
- The RPC verifies authenticated Boss ownership, lobby status, and AI case mode, then atomically enforces a 20-second cooldown and a maximum of 3 AI-generation attempts per rolling/resettable 10-minute window. Cooldown rejections do not consume budget.
- Direct table access is revoked from `public` and `authenticated`; only the bounded claim RPC is executable by authenticated clients.
- `app/api/generate-case+api.ts` now claims a slot after Boss/lobby/player-count validation and before constructing/calling Gemini. Rejected claims return HTTP `429` with `Retry-After` and a user-facing Egyptian-Arabic retry message.
- `api/case-start.ts` now enforces the same DB-backed claim only for AI mode; curated preset installation remains outside the AI budget. Rejected claims also return `429` + `Retry-After`.
- `scripts/qa/case-generation-rate-limit-e2e.mjs` verifies first host claim succeeds, immediate repeat is cooldown-blocked without spending another attempt, non-host claims fail, preset rooms cannot consume AI budget, limiter state stays private, explicit budget constants remain reviewable, and both server entrypoints contain the DB claim + 429 path.
- `.github/workflows/game-qa.yml` now runs the abuse-guard E2E against a clean local Supabase before the existing full-game E2E suite.

### Commits
- `59452976c92cb5b405f2e8678a8581d5b31a279a` — `feat: rate limit AI case generation`.
- `7c2d981fb8e0a355ffa8efb5caecc06a088a3a9a` — `feat: enforce AI generation budget`.
- `18e6e9329e19f751f41c2008f745ee7fed5d4327` — `qa: cover AI generation rate limit`.
- `dbbe3315d74bc3cbe47fdbb999de0dbb5a5d3673` — `feat: protect Vercel AI generation endpoint`.
- `d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a` — `qa: run AI generation abuse guard E2E`.

### Checks / evidence
- `CI` for `d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a` completed/success.
- `Game QA` was still in progress at the final inspection. TypeScript, Expo Doctor, vote/gender/join/player-card/legacy/generated-case contracts had completed/success; the run had reached the curated player-count contract with no failure reported. The local Supabase abuse-guard E2E had not run yet.
- Session 29 prerequisite remains confirmed Green.

### Newly discovered bugs / risks
- No new gameplay P0/P1 was discovered in this slice.
- This slice protects the highest-cost public endpoint but is not a complete anti-abuse program: room-creation/join spam, IP/device-level controls, observability, and provider-side quotas remain future launch-hardening work if evidence justifies them.
- The current budget is per authenticated anonymous user, not per IP; clearing app/browser identity could obtain a fresh anonymous user. That residual risk is explicit rather than hidden.
- Production parity remains blocked independently by the inactive Supabase project. The new migration has not been applied to Production.

### Deploy-safety status
**Not deploy-safe yet because `Game QA` for `d89c7cc...` was still running and the new local abuse E2E had not executed yet.** `CI` is Green. Production DB is inactive and does not have this migration. No Production deploy, restore, migration, or data write occurred.

### Roadmap impact
This closes the first concrete abuse-control slice around the externally billable AI path without touching gameplay fairness or content. The next launch-hardening work should be chosen only after this E2E is Green; Production parity remains an explicit external gate.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10 + deep fairness review.
- [x] Shared curated registry + legacy identity compatibility audit.
- [x] Same-room rematch.
- [x] Curated case packs/theme browsing; Session 29 Green.
- [ ] Session 30 AI-generation abuse protection: implementation complete; `CI` Green, awaiting final `Game QA` result.
- [ ] Production parity remains blocked while Supabase project is `INACTIVE`.
- [ ] Further public-launch hardening if justified: room/join abuse controls, observability/error telemetry, provider quotas/runbook.
- [ ] Polish/README/workflow-label drift cleanup.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Gameplay/Product Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا نتيجة `Game QA` لـ`d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a`. لو ظهر failure حقيقي مرتبط بالـabuse guard، أصلح أول failure meaningful فقط ولا تبدأ scope جديد. لو Green، أعد فحص Production availability read-only؛ إذا ظلت `INACTIVE` أو restore غير مصرح به، نفّذ **Room Creation / Join Abuse Protection** كـvertical slice واحد فقط، مع server-authoritative bounded throttling + local E2E، بدون Production mutation وبدون خلط observability/polish في نفس الجلسة.
