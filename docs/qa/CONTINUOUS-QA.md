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
- Session 36 أضاف repo-native release preflight + exact-SHA Vercel package gate + runbook/README truth. لا Production writes تمت.

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
- Session 36 Release guardrails: exact-SHA check/migration preflight + Vercel artifact gate + docs truth implemented; final checks were still running at handoff write time.

## Durable prior production evidence
### Session 34 — Production rollout for Solo/AI Players
- Production Supabase was restored and missing repo migrations were applied through `20260911180000_ai_players_mvp`.
- Production drift in an old `create_room_v2` signature was conservatively repaired before migration application.
- Vercel project `akher-kheit` deployment `dpl_So7A51KxPVdmh1eGbRsrB1Uzwagb` reached READY.
- Live smoke: `/` and `/solo` HTTP 200; `/api/generate-case` returned expected GET 405 for POST-only route.
- This remains the last deployed/deploy-safe production evidence until a later session explicitly records another production release.

## Session 35 — Launch-safety checkpoint
### Result
- Latest starting main `e3b86ad91b57997df2f23afcbc3cf8ff38547a04` had `validate` and `qa` completed/success.
- No known P0 gameplay deadlock.
- Highest risks reordered to: release parity/deployment guardrails → observability → anonymous identity churn perimeter → AI Players UX evidence/contract.
- Exact next priority was Release parity + deployment guardrails.

## Session 36 — 2026-09-11 — Release parity + Vercel deployment guardrails
### Session type
Delivery — one launch-safety vertical slice only. No product feature, production deploy, production migration, or service mutation.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting latest `main`: `2d491bdb222da744d4303b277c2eb2b9dfad4867` (`docs: record launch-safety checkpoint`).
- Starting `validate`: completed/success ✅.
- Starting Game QA `qa`: completed/success ✅.
- No prerequisite pending and no meaningful failing check tied to the active objective.

### Exact objective
Build a repository-native, read-only release preflight that binds a release to an exact SHA, requires Green CI/Game QA for that SHA, detects production Supabase migration drift before any write, gates the Vercel source artifact on that preflight, and updates README/runbook so the documented production path matches current Vercel truth.

### Reproduction / design finding
- Before this session, release safety was durable evidence only: operators could know Session 34 had parity, but repo tooling did not prevent a later deploy from using a SHA with pending/failed checks or a migration state different from production.
- Existing `.github/workflows/package-vercel-source.yml` packaged a moving checkout without validating release SHA, checks, or production migration parity.
- README still described EAS Hosting as production while Session 34 production evidence is Vercel.
- Chosen guardrail is fail-closed and read-only: GitHub check-runs are read through API; production DB access performs only `SELECT version FROM supabase_migrations.schema_migrations`.
- Migration application remains intentionally separate. A release containing unapplied migrations should fail preflight rather than silently mutate production.

### Code / test / workflow / docs changes
- Added `scripts/release/preflight.mjs`:
  - requires a full 40-character release SHA;
  - requires exact-SHA `validate` and `qa` check-runs to be `completed/success`;
  - reads local migration versions from `supabase/migrations/`;
  - reads production migration history with `psql` using `SUPABASE_PRODUCTION_DB_URL`;
  - fails on either missing-in-production or unexpected-in-production migration versions;
  - includes fixture-file inputs so contract logic is testable without production access.
- Added deterministic `scripts/qa/release-preflight-contract.mjs` covering Green checks/parity, failed Game QA, missing production migration, and unexpected production migration.
- Added package scripts `release:preflight` and `qa:release-preflight`.
- CI `validate` now runs the release-preflight contract regression.
- Reworked `.github/workflows/package-vercel-source.yml` into `Vercel Release Package`:
  - manual full SHA input;
  - exact-SHA checkout;
  - read-only preflight before packaging;
  - requires GitHub Actions secret `SUPABASE_PRODUCTION_DB_URL`;
  - emits a SHA-stamped artifact only after preflight passes;
  - includes `release-manifest.txt` with repository, exact SHA, and `preflight=passed`.
- Added `docs/operations/RELEASE-RUNBOOK.md` defining release invariants, secret handling, guarded artifact procedure, migration hard-stop behavior, and explicit handoff/deploy-safety requirement.
- Updated README to current Vercel production architecture, current Boss/player-count/AI state, and the guarded release path. EAS is no longer presented as authoritative production web hosting.

### Commits
- `38214755af36d3750bf541148bf098983e031e0f` — add read-only release preflight.
- `f9d004551aa3cf32f8d0184509df44f4ca8f7965` — deterministic preflight contract tests.
- `e4f9e4952c2bb5cc90b705191bc538549ed72498` — expose release scripts.
- `faf45fa35d52e8ada409c9d72e09cfdc4fd3056a` — run preflight contract in CI.
- `0a134667e07ab8c9d3f60b32b9dc53520dd2c604` — gate Vercel source artifact on exact-SHA preflight.
- `2b18e6c903a78ecf4252f249312f352162f19df9` — add release runbook.
- `034006b210a95ec4b9925984d4f66171f3d9c81f` — align README with production Vercel truth.

### Checks / test results
- Starting checkpoint commit `2d491bdb222da744d4303b277c2eb2b9dfad4867`: `validate` completed/success ✅ and `qa` completed/success ✅.
- Preflight implementation was syntax-checked and its deterministic fixtures were executed during the session before repository write: Green fixture PASS; failed `qa` blocked; missing migration blocked; unexpected production migration blocked.
- On final implementation SHA `034006b210a95ec4b9925984d4f66171f3d9c81f`, both GitHub checks had started and were `in_progress` when inspected. Therefore this session does **not** mark the new release tooling deploy-safe yet.
- This handoff commit itself will trigger normal main checks after write; inspect them first next session.

### Newly discovered bugs / risks
- The guarded workflow requires a repository Actions secret named `SUPABASE_PRODUCTION_DB_URL`. Repo tooling cannot prove that secret is configured until the workflow is run; missing secret fails closed before migration comparison.
- Vercel Git integration is still not enabled/documented as active. The runbook deliberately standardizes the current path around an exact-SHA guarded artifact until Git integration is intentionally configured and verified.
- `.eas/workflows/deploy.yml` still exists for Expo-related workflow history; README/runbook now explicitly state it is not authoritative production web release path. Do not infer that file proves a production EAS deployment path.
- No production DB connection was used in this session, so current parity beyond Session 34 was not reasserted; the new tool exists to verify it at release time.

### Deploy-safety status
**Not deploy-safe yet for Session 36 changes.** No Production deployment or migration occurred. Final implementation checks were still running when inspected. A future production release must satisfy both Green checks for the exact release SHA, successful read-only migration parity preflight, and an explicit deploy-safe handoff entry.

### Roadmap impact
Release safety moved from convention/documented evidence to a repository-enforced fail-closed package gate. The next highest priority from Session 35 remains Production observability because no gameplay failure displaced it.

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
- [ ] Production observability/error telemetry on critical paths.
- [ ] Anonymous-identity churn / public-launch abuse perimeter.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
أولًا افحص checks الخاصة بآخر handoff/main commits من Session 36. إذا ظهر failure حقيقي مرتبط بالـrelease guardrails، أصلح أول failure meaningful فقط. إذا أصبحت Green، نفّذ **Production observability vertical slice** واحدًا: structured privacy-safe error/event telemetry للمسارات الحرجة (create/join/start/generation/vote/resolve/reconnect) مع release correlation واختبارات/verification مناسبة، بدون تسريب secrets أو case solution وبدون Production deployment إلا بعد handoff deploy-safe صريح.
