# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- بداية Session 40 كانت على `bda2176b2eba6685247021f14c9b430fdff94f4b` (`docs: checkpoint launch-safety priorities`) مع `validate` completed/success ✅ و`qa` completed/success ✅.
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 gameplay معروف في آخر Green baseline.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts Green.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ fairness review الحالية PASS؛ لا دليل يبرر 11–15 الآن.
- Solo/AI Players MVP live in Production؛ snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.
- Session 40 أضاف second abuse boundary ضد anonymous-auth churn عبر random locally persisted installation key؛ الـDB يخزن SHA-256 فقط. create/join/generation/telemetry wired، مع بقاء quotas القديمة per `auth.uid()` كطبقة إضافية.
- limitation مقصودة: clearing app/site storage يمكنه تدوير installation key؛ هذا perimeter ضد routine auth churn وليس fraud-proof device fingerprint، ولا يستخدم PII أو gameplay identity.
- Production observability code موجود مع privacy-safe allowlist + release correlation + telemetry churn guard، لكنه غير مثبت كـdeployed runtime.
- آخر Production DB evidence من Session 34: Supabase `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`; migration الجديدة `20260911204500_public_abuse_perimeter.sql` **لم تُطبّق Production**.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection per authenticated identity.
- [x] Room creation/join abuse protection per authenticated identity + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails.
- [x] Production observability implementation.
- [x] Session 38 gender contract repair Green.
- [~] Anonymous-identity churn / public-launch abuse perimeter implemented in Session 40; final Green CI still required before closure.
- [ ] Fresh production parity + guarded release evidence for current launch-safety stack; observability + churn perimeter remain undeployed until explicitly released.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 39 — 2026-09-11 — Launch-safety checkpoint
Checkpoint/planning only. Starting SHA `62509fd60dfab0769c648ed304925979dcb9c42c` had `validate` + `qa` success. Audit found no P0 gameplay regression and made anonymous-auth churn the next exact priority, followed by fresh release readiness, AI Players live UX evidence, then an AI scope decision checkpoint. No Production write/deploy/migration.

## Session 40 — 2026-09-11 — Anonymous-identity churn / public-launch abuse perimeter
### Session type
Delivery — exactly one coherent launch-safety objective. No unrelated gameplay/story feature, Production deploy, Production migration, or Production DB write.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting latest `main`: `bda2176b2eba6685247021f14c9b430fdff94f4b`.
- Starting `validate`: completed/success ✅.
- Starting `qa`: completed/success ✅.
- Therefore there was no prerequisite CI failure to repair before the handoff priority.

### Exact objective
Close the routine anonymous-auth churn gap with a second least-identifying practical abuse boundary across create/join/AI generation/telemetry, server-authoritative where practical, while preserving existing per-auth quotas and keeping nickname/gender/room/player/story/role/mafia data out of the abuse identity.

### Reproduction / design finding
- Existing `room_action_rate_limits` and `case_generation_rate_limits` are keyed by `auth.uid()`, so a fresh anonymous Supabase identity gets a fresh budget.
- A durable IP/device fingerprint would add privacy and platform complexity. The bounded design chosen here is a random installation key persisted in app/site local storage, unrelated to product identity.
- The DB stores only `SHA-256(installation key)` and action/window counters. Changing anonymous auth alone does not reset the installation budget; clearing local storage still can, and that limitation is documented explicitly.
- Existing per-auth quotas remain in force, so this is a second boundary rather than a replacement/weaker limiter.

### Code / database / tests / docs changes
- Added migration `20260911204500_public_abuse_perimeter.sql`:
  - private `public_abuse_rate_limits(key_hash, action, window, attempts)` table;
  - `claim_public_abuse_slot` with explicit budgets for create/join/generate/telemetry;
  - only SHA-256 digest persisted;
  - `create_room_v4` and `join_room_v3` wrappers claim installation budget then call the existing v3/v2 RPCs, preserving per-auth protection;
  - `claim_case_generation_slot_v2` claims installation budget then existing per-auth generation budget.
- Added `getAbuseInstallationKey()` in `lib/supabase.ts`, persisted through the already-installed cross-platform `localStorage` adapter.
- Main create/join client path now calls `create_room_v4` / `join_room_v3` with the installation key.
- AI generation request sends the key and server uses `claim_case_generation_slot_v2` before model work.
- Telemetry sends the key only in `X-Abuse-Key`; telemetry JSON schema/log payload remains free of the key. Endpoint checks the DB-backed telemetry budget and returns 429/503 without blocking gameplay callers.
- Added deterministic/local-Supabase `public-abuse-perimeter-e2e.mjs`: alternates two different anonymous auth identities against one installation key and proves the ninth create claim is still blocked, verifies a different key has an independent budget, private limiter state, digest-only storage, and wiring across create/join/generation/telemetry.
- Added the new E2E to `Game QA` after the existing per-auth abuse tests.
- Updated `docs/operations/OBSERVABILITY.md` with privacy model and explicit storage-reset limitation.

### Commits
- `e21edc21ffe52ff64e9c5afad851f9acf1ca5a73` — migration / DB perimeter.
- `5d3928f4ee20645ef0b8a2152e3cfd3e92a4a56a` — persisted installation key.
- `b4a1182676120b9b85ea88c6ca794cdd704d30c9` — create/join/generation client wiring.
- `734f422a748e3d950323faf0cbf6e8a3b825ce45` — telemetry client header.
- `3cf919c912e3d904312c0804b1808ae3ba76774a` — telemetry server guard.
- `4f6faec096574c169c47041a398da877b809e701` — generation server guard.
- `770082a3e9c4f8ffdb3311a8a03889e44ae738a3`, `d3dbd230e986c1638d276ac2422eb26796e6314d` — churn E2E + privacy assertion refinement.
- `6fa4fe332850d865cc16f34e36841fb2a043ecf3` — Game QA wiring.
- `970157ef84a4e60a3fc0a38dfa26f0cfe5f46582` — observability docs.
- This handoff commit: `docs: record anonymous churn perimeter session`.

### Check/test results
- Starting checkpoint SHA: `validate` success ✅, `qa` success ✅.
- Latest implementation/docs SHA inspected before this handoff (`970157ef84a4e60a3fc0a38dfa26f0cfe5f46582`): both `validate` and `qa` were **in progress** at inspection time.
- This handoff commit will trigger fresh checks. Do not treat Session 40 as Green/deploy-safe until latest `main` `validate` + full `qa` both complete successfully; if either fails, next session fixes the first meaningful failure before release work.

### Newly discovered bugs / risks
- No new P0 gameplay bug found before implementation.
- Installation key is pseudonymous operational state, not identity; storage reset remains a bypass. Do not silently evolve it into PII/device fingerprinting without a separate privacy/product decision.
- Public claim RPC is intentionally callable by anon/authenticated because telemetry can arrive without auth; the raw high-entropy installation key is never logged or stored. Rate state table remains unreadable by clients.
- Production DB does not yet contain the new migration; current Production clients therefore must not be pointed at these new RPCs until guarded release parity/migration sequencing is proven.

### Deploy-safety status
**Not deploy-safe yet.** Relevant CI was still running at handoff time, and Production migration parity has not been re-proven. No Production deploy, migration, restore, or DB write occurred.

### Roadmap impact
- The highest checkpoint launch-risk is now implemented pending Green CI.
- The next milestone remains fresh exact-SHA release readiness/parity; do not skip directly to Production rollout.
- AI Players UX evidence remains after release readiness; unrelated features and 11–15 expansion stay deferred.

## الأولوية الدقيقة للجلسة التالية
افحص أحدث `main` أولًا. إذا Session 40 `validate` أو full `qa` فشل، أصلح **أول failure meaningful فقط** داخل نفس objective ولا تبدأ release scope. إذا كلاهما Green، نفّذ **Fresh release readiness for the launch-safety stack** كـvertical slice واحد read-only أولًا: exact-SHA checks + migration parity/preflight للـcandidate الحالي، وثّق أي Production/DB drift وأفضل next action، ولا تطبق migration أو deploy إلا إذا relevant E2E Green والهاند أوف يسجل التغيير المحدد `deploy-safe` صراحة.
