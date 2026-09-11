# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 معروف.
- Identity/story: gender + caseRole + nickname-only identity + curated/AI semantic roles Green.
- Curated library: قصتان لكل عدد 4–10؛ 11–12 AI-only؛ 13–15 غير مستهدفة حاليًا.
- Solo/AI Players MVP live in Production.
- آخر production DB evidence من Session 34: Supabase كان `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`; لا نفترض parity مستقبلية بدون preflight.
- Production web الحالي Vercel. آخر deployment durable evidence من Session 34؛ لا يوجد Production deploy في Sessions 35–37.
- Session 36 release guardrails handoff `bb5363e1d137dd7c2125f83aa0463935f457f714` أصبح `validate` + `qa` Green.
- Session 37 نفّذ Production observability slice. حصل CI failure أثناء الجلسة وتم تشخيصه وإصلاح أول failure meaningful؛ latest repair checks ما زالت pending عند handoff.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection.
- [x] Room creation/join abuse protection + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Launch-safety checkpoint.
- [x] Release parity + Vercel deployment guardrails.
- [x] Production observability implementation; latest repair checks pending.
- [ ] Anonymous-identity churn / public-launch abuse perimeter.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 37 — 2026-09-11 — Production observability/error telemetry
### Session type
Delivery — one Production/Launch Safety vertical slice only. No Production deploy, migration, DB write, gameplay feature, or unrelated product scope.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Starting `main`: `bb5363e1d137dd7c2125f83aa0463935f457f714`.
- Starting `validate`: completed/success ✅.
- Starting `qa`: completed/success ✅.
- Session 36 prerequisite was therefore resolved Green before new scope.

### Exact objective
Add structured privacy-safe Production gameplay telemetry for create/join/start/generation/vote/resolve/reconnect with release correlation, bounded allowlisted payloads, non-blocking failure behavior, deterministic CI verification, and operator documentation — without leaking identity, secrets, room identifiers, case text, or solution data.

### Reproduction / design finding
- Critical gameplay operations were split between direct Supabase client RPCs and the case-generation server path, so Production had no single operational event vocabulary.
- Logging every room snapshot would be noisy because realtime refresh invokes snapshots frequently. Reconnect telemetry is therefore limited to retry recovery and terminal failure.
- Start and generation are one transaction today; both event names are emitted so dashboards can distinguish the lifecycle contract when implementation separates later.
- Telemetry errors use coarse classes only; raw exception/user-entered content is not sent.

### Code / tests / docs
- Added `lib/observability.ts` with allowlisted events/outcomes, coarse error classes, duration, safe enum details, non-blocking transport, and client release hint.
- Added `app/api/telemetry+api.ts` with strict Zod schema, 2 KiB body cap, structured `akher_kheit.gameplay` JSON logs, and canonical server-side release correlation via `VERCEL_GIT_COMMIT_SHA`/`RELEASE_SHA`.
- Refactored active Create UI through observed `createRoomV3`; instrumented join, vote, resolve, start/generation, reconnect retry recovery/failure.
- Added `scripts/qa/observability-contract.mjs`; it checks event coverage/wiring, strict endpoint behavior, release correlation, and forbids room code/id, nicknames, player IDs, tokens, story title, solution, clues, theme, and prompt fields.
- Added `qa:observability` and wired it into CI `validate`.
- Added `docs/operations/OBSERVABILITY.md` covering privacy semantics, query shape, release correlation, and limitations.

### Commits
- `06d25c8828e73cd86e5423b0e0251afc2e9cb2c9` telemetry client contract.
- `8c97e9d97af4a04abf77b045e6d703ca98a5ac81` server telemetry sink.
- `b5d5bf836a78d485365e095e94474bd2e626eec7`, `8344fa81783f88df4349550a45d8301a4bd4d83d` gameplay instrumentation/create helper.
- `c3f2a2901092ab3d2d4214ef7c2445ac3e45aa58` active Create UI instrumentation.
- `b41255527760ffca7a5151599258dc13c137b8c5` generation correlation.
- `00cfffe25f4fd2da25e6658c89595c99fdcb841e` observability QA contract.
- `587eca91fc8dc494df1c2d7914c16f8b260f7aac`, `198e8f9c7a489ec57b1fbb8d6373b9bb232a058d` package/CI wiring.
- `ae3e14569b21dfc916702ebcc1c36dd24f70311c` observability runbook.
- `845456154356d4f9923036e649111af5346f8253` CI repair: explicitly declare `react-native-url-polyfill` runtime dependency.

### Check/test results and CI repair
- Starting handoff SHA was `validate` + `qa` Green.
- On implementation SHA `198e8f9c7a489ec57b1fbb8d6373b9bb232a058d`, both checks completed/failure. `validate` failed at TypeScript before the new contract test ran.
- Workflow logs identified exact first compile failure: `lib/supabase.ts(1,8) TS2882 Cannot find module or type declarations for side-effect import of 'react-native-url-polyfill/auto'`.
- The import already existed in the runtime code; the package was not declared as a direct dependency. Fixed by adding `react-native-url-polyfill` to `dependencies` in commit `845456154356d4f9923036e649111af5346f8253`. No test was weakened/skipped/rewritten to hide the failure.
- At the latest inspection, `845456154356d4f9923036e649111af5346f8253` had both `validate` and `qa` queued. This handoff commit will trigger checks again; next session must inspect latest-main checks first.

### Newly discovered bugs / risks
- Public telemetry endpoint can itself receive anonymous request churn. Do not solve that by adding identifying payload data; abuse perimeter is the next separate objective.
- `EXPO_PUBLIC_RELEASE_SHA` may be absent, so `clientRelease` can be `unknown`; canonical Production release stays server-side.
- Routine successful snapshot refreshes intentionally do not generate telemetry; reconnect evidence is retry recovery or terminal failure.
- This session did not deploy the telemetry endpoint, so there is no claim that Production is already emitting these events.
- CI exposed a dependency declaration drift (`react-native-url-polyfill` used but not directly declared); repair is committed but not yet Green at handoff.

### Deploy-safety status
**Not deploy-safe yet.** No Production write occurred. Latest repair/handoff checks must become Green, release preflight/migration parity must be Green, and a later handoff must explicitly mark the exact release deploy-safe before deployment.

### Roadmap impact
Observability moved from ad-hoc logs to one privacy-safe structured vocabulary with CI-enforced field constraints. The next launch-safety priority remains anonymous identity/request churn unless the pending checks reveal another failure tied to this slice.

## الأولوية الدقيقة للجلسة التالية
أولًا افحص checks لأحدث Session 37 handoff/main SHA. إذا ظهر failure مرتبط بالـobservability/dependency repair، أصلح أول failure meaningful فقط. إذا أصبحت Green، نفّذ **Anonymous-identity churn / public-launch abuse perimeter vertical slice** واحدًا: أقل contract عملي يحد bypass عبر إنشاء anonymous identities جديدة على create/join/telemetry/generation بدون تخزين PII أو التأثير على gameplay fairness، مع deterministic regression/E2E مناسب، وبدون Production migration/deploy إلا بعد Green + deploy-safe صريح.
