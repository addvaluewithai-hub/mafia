# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- أحدث `main` قبل هذا checkpoint: `62509fd60dfab0769c648ed304925979dcb9c42c` (`docs: record gender contract CI repair`).
- latest `main` checks: `validate` completed/success ✅ و`qa` completed/success ✅؛ Session 38 gender-contract repair أصبح Green بالكامل.
- Core/full-game 4–10: deterministic 140 complete games + local Supabase RPC E2E تشمل tie/reconnect/eliminated Boss/rematch؛ لا P0 gameplay معروف في أحدث Green QA.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts Green.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ fairness review الحالية PASS لكل القضايا بعد الإصلاحات الموثقة. 11–12 AI-only؛ 13–15 غير مستهدفة حاليًا.
- Solo/AI Players MVP live in Production، لكن snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.
- AI generation abuse guard وroom create/join abuse guard موجودان حاليًا per authenticated identity فقط؛ churn عبر إنشاء anonymous identities جديدة ما زال launch-risk حقيقيًا.
- Production observability code موجود مع privacy-safe allowlist وrelease correlation، لكنه غير مثبت كـdeployed runtime في handoff حالي.
- آخر Production DB evidence من Session 34: Supabase كان `ACTIVE_HEALTHY` ومهاجر حتى `20260911180000_ai_players_mvp`; لا نفترض parity مستقبلية بدون release preflight.
- Production web الحالي Vercel؛ لا يوجد Production deploy موثق بعد Sessions 35–38.

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
- [ ] Anonymous-identity churn / public-launch abuse perimeter.
- [ ] Fresh production parity + guarded release evidence for current launch-safety code; observability runtime remains undeployed until explicitly released.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 39 — 2026-09-11 — Launch-safety checkpoint after Sessions 36–38
### Session type
Checkpoint/planning — exactly one bounded checkpoint objective. No product feature implementation, schema migration, Production deploy, or Production DB write.

### Starting evidence
- Read `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff from default branch.
- Last checkpoint preceded three implementation/repair sessions (36 release guardrails, 37 observability, 38 CI contract repair), so the default 3–4-session checkpoint cadence is due.
- Starting `main`: `62509fd60dfab0769c648ed304925979dcb9c42c`.
- `validate`: completed/success ✅.
- `qa`: completed/success ✅.
- Current Game QA still covers TypeScript, Expo doctor, vote/gender/identity/story contracts, deterministic full-game state sims, local Supabase identity/gender/caseRole/gender-wording E2E, AI-generation abuse guard, room create/join abuse guard, AI Players E2E, full-game RPC E2E 4–10, eliminated Boss admin controls, and rematch E2E.

### Exact objective
Audit what is truly Green after Sessions 36–38 and reset the next 3–4 substantial objectives around launch risk, without forcing another implementation slice during a due checkpoint.

### Checkpoint findings
1. **Core/full-game confidence remains Green.** Latest full `qa` completed successfully, so there is no evidence requiring a P0 gameplay repair before launch-safety work.
2. **Session 38 repair is closed.** The gender UI contract now follows the real UI→helper→RPC boundary and the full downstream QA suite also completed, restoring fresh evidence beyond the previously failing static step.
3. **Anonymous-identity churn is now the highest practical launch risk.** Existing DB guards key create/join and AI-generation budgets by `auth.uid()`. A user can obtain a new anonymous identity and reset those budgets. Observability explicitly documents public endpoint churn as a separate unresolved objective. The next implementation should add a second server-authoritative, non-PII abuse key/perimeter rather than weakening gameplay or storing nickname/gender/room/story data.
4. **Production parity is historical, not current release evidence.** The runbook correctly requires exact-SHA `validate` + `qa`, read-only migration parity, preflight, and explicit deploy-safe before release. Current latest Green does not by itself prove Production DB parity or that observability is deployed.
5. **Story/content status is healthy.** The current human fairness review covers all 14 curated 4–10 cases and concludes PASS; no fixed-cadence rewrite is justified. Story work should react to regression/new-content evidence rather than manufacture activity.
6. **Curated coverage should stay 4–10 for now.** Two curated cases exist for each count 4–10; the documented review explicitly says expansion beyond 10 is not justified by current evidence.
7. **AI Players needs evidence before scope expansion.** MVP has E2E and production rollout evidence, but browser/live snapshot identity and UX behavior should be verified before adding LLM discussion or broader bot behavior.
8. **Technical-debt watch:** static source-contract tests can become location-coupled during refactors. New contracts should prefer semantic boundaries, as fixed in Session 38.

### Code / database / tests / docs changes
- Checkpoint only: no runtime code, schema, migration, test, or Production change.
- Updated this rolling handoff with current Green evidence, launch risks, reordered milestones, and one exact next-session priority.

### Commits
- This handoff checkpoint commit: `docs: checkpoint launch-safety priorities`.

### Check/test results
- Starting SHA `62509fd60dfab0769c648ed304925979dcb9c42c`: `validate` success ✅ and `qa` success ✅.
- This docs-only checkpoint commit will trigger checks; inspect them next session before any new implementation and fix any real failure first.

### Newly discovered bugs / risks
- No new P0 gameplay bug found.
- Confirmed architectural abuse gap: per-`auth.uid()` quotas do not survive anonymous identity churn.
- Production observability remains an implementation claim, not a deployed-runtime claim, until an exact-SHA guarded release is explicitly made and recorded.
- Production DB parity must be re-proven for the release candidate; Session 34 evidence is not sufficient for a future deploy.

### Deploy-safety status
**Not deploy-safe for a new Production release from this checkpoint alone.** Core checks are Green, but no fresh release preflight/migration parity was executed for a deployment candidate and no deploy was requested. No Production write occurred.

### Roadmap impact — next 4 substantial objectives
1. **Anonymous-identity churn / public-launch abuse perimeter** — add the least-identifying practical second abuse boundary across create/join/generation/telemetry, server-authoritative where possible, with deterministic regression/E2E. Do not use nickname, gender, room code, player ID, story text, or mafia assignment as an abuse identity.
2. **Fresh release readiness for launch-safety stack** — once objective 1 is Green, run exact-SHA read-only preflight/parity and close any production/migration drift; only mark deploy-safe when the handoff records the exact Green candidate. Do not deploy automatically.
3. **AI Players snapshot identity + browser/live UX evidence** — verify bot identity, refresh/reconnect visibility, Boss add/remove flow, vote resolution, and solo completion in browser/live conditions; repair regressions before considering new AI behavior.
4. **AI Players scope decision checkpoint** — based on objective 3 evidence, decide whether LLM discussion adds enough product value without harming latency/cost/fairness. Keep 11–15 and unrelated polish deferred unless evidence changes priorities.

## الأولوية الدقيقة للجلسة التالية
افحص checks لأحدث `main` أولًا. إذا ظهر failure حقيقي، أصلح أول failure meaningful فقط. إذا بقي `validate` + full `qa` Green، نفّذ **Anonymous-identity churn / public-launch abuse perimeter** كـvertical slice واحد: second abuse boundary غير معتمد على `auth.uid()` وحده، لا يخزن PII أو gameplay identity، يغطي create/join/generation/telemetry بقدر عملي server-authoritative، ويضيف deterministic regression/E2E. لا Production migration/deploy إلا بعد Green + parity/preflight + `deploy-safe` صريح لاحقًا.
