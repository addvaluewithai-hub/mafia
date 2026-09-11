# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي للجلسات السابقة محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

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
- Solo/AI Players MVP live in Production: Human Boss + 3 server-side bots + normal secret roles/votes/round resolution.
- آخر production DB evidence من Session 34: Supabase `bwxgzcppxdrfcaorobpm` كان `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`. لا نفترض parity مستقبلية بدون preflight.
- Production web الحالي: Vercel `https://akher-kheit.vercel.app`; آخر deployment durable evidence من Session 34 هو `dpl_So7A51KxPVdmh1eGbRsrB1Uzwagb` READY.
- Session 35 checkpoint جعل launch-safety أعلى من توسيع AI features.
- Session 36 أضاف release preflight + exact-SHA Vercel package gate + runbook/README truth، وأصبح handoff commit `bb5363e1d137dd7c2125f83aa0463935f457f714` لاحقًا CI + Game QA Green.
- Session 37 أضاف privacy-safe production gameplay telemetry للمسارات الحرجة مع release correlation وCI privacy contract. لا Production writes تمت؛ final checks كانت ما زالت queued/running عند كتابة handoff.

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
- Session 32 repair: `24c78e3bf09bad67dac9bc3f21461196f9f83b0c` became CI + Game QA Green.
- Session 33 Solo/AI Players MVP: code + local Supabase E2E + Game QA integration, Green.
- Session 34 Production rollout: Supabase restore/parity + AI Players migration + Vercel deploy + live smoke, Green.
- Session 35 Checkpoint: core/CI Green; launch-safety became next priority.
- Session 36 Release guardrails: final handoff commit `bb5363e1d137dd7c2125f83aa0463935f457f714` is CI + Game QA Green.
- Session 37 Production observability: implementation complete; final checks pending at handoff write time.

## Durable production evidence
### Session 34 — Production rollout for Solo/AI Players
- Production Supabase was restored and missing repo migrations were applied through `20260911180000_ai_players_mvp`.
- Production drift in an old `create_room_v2` signature was conservatively repaired before migration application.
- Vercel project `akher-kheit` deployment `dpl_So7A51KxPVdmh1eGbRsrB1Uzwagb` reached READY.
- Live smoke: `/` and `/solo` HTTP 200; `/api/generate-case` returned expected GET 405 for POST-only route.
- This remains the last deployed/deploy-safe production evidence until a later session explicitly records another production release.

## Session 36 — Release parity + Vercel deployment guardrails
### Result
- Added read-only exact-SHA release preflight requiring `validate` + `qa` Green and production migration parity.
- Vercel source artifact workflow is gated by that preflight and emits a SHA-stamped release manifest.
- README and release runbook now describe Vercel as current production web truth.
- No Production writes occurred.
- Session 36 handoff commit `bb5363e1d137dd7c2125f83aa0463935f457f714` subsequently reached `validate` completed/success and `qa` completed/success.

## Session 37 — 2026-09-11 — Production observability/error telemetry
### Session type
Delivery — one Production/Launch Safety vertical slice only. No gameplay feature, production deploy, production migration, DB write, or service mutation.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting latest `main`: `bb5363e1d137dd7c2125f83aa0463935f457f714` (`docs: hand off release guardrails session`).
- Starting `validate`: completed/success ✅.
- Starting Game QA `qa`: completed/success ✅.
- Therefore Session 36's pending-check prerequisite was resolved Green before new scope; no meaningful failing check displaced the handoff priority.

### Exact objective
Add structured privacy-safe Production gameplay telemetry for create/join/start/generation/vote/resolve/reconnect, with release correlation, bounded allowlisted payloads, non-blocking client behavior, deterministic CI contract checks, and operator documentation — without leaking secrets, identity, room identifiers, case content, or the solution.

### Reproduction / design finding
- Critical gameplay mutations mostly call Supabase directly from clients, while case start/generation goes through the app server. Existing production evidence therefore lacked one consistent operational signal vocabulary for failures across create/join/vote/resolve/reconnect.
- Existing generation logs included raw server error messages. For the new cross-path telemetry contract, raw exceptions/user-entered values are intentionally excluded; only coarse error classes and bounded enum details are allowed.
- Routine successful room snapshots can be frequent because realtime events call refresh. Logging every snapshot would create noise, so reconnect telemetry records only transient recovery after retry and terminal snapshot failure.
- Start currently owns generation/install as one transaction. The implementation emits both `start` and `generation` names from the same observed operation so production dashboards have a stable generation signal before those stages are ever split.

### Code / test / docs changes
- Added `lib/observability.ts`:
  - event allowlist: `create`, `join`, `start`, `generation`, `vote`, `resolve`, `reconnect`;
  - outcome allowlist: `success`, `error`, `recovered`;
  - coarse error classification only (`auth`, `rate_limit`, `network`, `not_found`, `conflict`, `server`, `unknown`);
  - duration + bounded safe details only;
  - non-blocking telemetry transport; telemetry failure never fails gameplay;
  - client release hint via `EXPO_PUBLIC_RELEASE_SHA` when configured.
- Added `app/api/telemetry+api.ts`:
  - strict Zod schema rejects unknown fields instead of silently accepting them;
  - 2 KiB payload hard cap;
  - writes a single structured JSON log shape `type=akher_kheit.gameplay`;
  - canonical release is server-side `VERCEL_GIT_COMMIT_SHA` (or `RELEASE_SHA` fallback), so client metadata cannot spoof the deployed release.
- Refactored active room creation in `app/create.tsx` through observed `createRoomV3` in `lib/game.ts`.
- Instrumented active `join`, `vote`, `resolve`, `start/generation`, and reconnect-retry/failure paths in `lib/game.ts`.
- Added `scripts/qa/observability-contract.mjs` checking critical event coverage, active create-path wiring, strict endpoint/size bound/release correlation, and a forbidden sensitive-field list including room code/id, nickname, player IDs, tokens, story title, solution, clues, theme and prompt.
- Added `npm run qa:observability` and made CI `validate` run it.
- Added `docs/operations/OBSERVABILITY.md` with event semantics, privacy contract, release correlation, failure behavior, Vercel query shape, and current abuse limitation.

### Commits
- `06d25c8828e73cd86e5423b0e0251afc2e9cb2c9` — add privacy-safe gameplay telemetry client contract.
- `8c97e9d97af4a04abf77b045e6d703ca98a5ac81` — add strict server telemetry sink.
- `b5d5bf836a78d485365e095e94474bd2e626eec7` / `8344fa81783f88df4349550a45d8301a4bd4d83d` — instrument gameplay operations and centralize current `create_room_v3` path.
- `c3f2a2901092ab3d2d4214ef7c2445ac3e45aa58` — route Create UI through observed create path.
- `b41255527760ffca7a5151599258dc13c137b8c5` — emit correlated generation signal with case start.
- `00cfffe25f4fd2da25e6658c89595c99fdcb841e` — add observability privacy/coverage contract.
- `587eca91fc8dc494df1c2d7914c16f8b260f7aac` — expose observability QA script.
- `198e8f9c7a489ec57b1fbb8d6373b9bb232a058d` — run observability contract in CI.
- `ae3e14569b21dfc916702ebcc1c36dd24f70311c` — document production observability contract.

### Checks / test results
- Starting handoff commit `bb5363e1d137dd7c2125f83aa0463935f457f714`: `validate` completed/success ✅ and `qa` completed/success ✅.
- The deterministic observability contract is wired into `validate`; it is designed to fail if critical event wiring disappears or forbidden sensitive fields are added to the telemetry API.
- At the last pre-handoff inspection, commit `198e8f9c7a489ec57b1fbb8d6373b9bb232a058d` had both `validate` and `qa` in progress, and later documentation SHA `ae3e14569b21dfc916702ebcc1c36dd24f70311c` had both checks queued.
- This handoff commit itself will trigger normal checks. Inspect the latest-main checks first next session. Do not infer deploy safety while they are pending.

### Newly discovered bugs / risks
- The telemetry endpoint is intentionally public and low-data. It can still receive anonymous request churn; do not add identity/room data to solve that. The correct next perimeter is bounded abuse protection at the request/anonymous-identity layer.
- `EXPO_PUBLIC_RELEASE_SHA` is optional, so `clientRelease` can be `unknown`. Canonical production correlation remains server-side Vercel SHA; future release packaging may set the client value for richer correlation.
- Routine successful snapshot/realtime refreshes are deliberately not logged to avoid high-volume noise. Current reconnect evidence is recovery-after-retry or terminal failure, not every successful refresh.
- This session did not deploy the new telemetry endpoint, so there is no claim yet that production is emitting these events.

### Deploy-safety status
**Not deploy-safe yet for Session 37 changes.** No Production deployment or migration occurred. Final implementation/documentation checks were still queued/running at handoff time. Before any deployment, require latest exact-SHA `validate` + `qa` Green, release preflight/migration parity Green, and a later explicit deploy-safe handoff decision.

### Roadmap impact
Production observability moved from ad-hoc path-specific logging to one privacy-safe structured vocabulary with release correlation and CI-enforced field constraints. No core/full-game priority was displaced. Per the Session 35 checkpoint ordering, the next launch-safety risk is anonymous identity/request churn rather than AI feature expansion.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection.
- [x] Room creation/join abuse protection + legacy Boss regression repair.
- [x] Solo/AI Players MVP implementation + relevant E2E Green.
- [x] Production restore/parity + Solo/AI Players rollout + live smoke.
- [x] Checkpoint: launch-safety prioritization.
- [x] Release parity + Vercel deployment guardrails + README/runbook truth.
- [x] Production observability/error telemetry implementation (checks pending at Session 37 handoff).
- [ ] Anonymous-identity churn / public-launch abuse perimeter.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
أولًا افحص checks الخاصة بأحدث Session 37 handoff/main SHA. إذا ظهر failure حقيقي مرتبط بالـobservability slice، أصلح أول failure meaningful فقط. إذا أصبحت Green، نفّذ **Anonymous-identity churn / public-launch abuse perimeter vertical slice** واحدًا: اختَر أقل contract يحد bypass عبر إنشاء anonymous identities جديدة على create/join/telemetry/generation بدون تخزين PII أو التأثير على gameplay fairness، مع deterministic regression/E2E مناسب وبدون Production migration/deploy إلا بعد Green + deploy-safe صريح.
