# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Pre-session `main`: `021c404299227d53a4161e0f4e8c822148436ac5`; exact-SHA GitHub checks: `validate` completed/success ✅ و`qa` completed/success ✅.
- Core/full-game 4–10 ما زال Green على full Game QA الحالي؛ لا يوجد P0 gameplay معروف في هذه الجلسة.
- Identity/story contract + curated 4–10 + fairness ما زالت Green؛ لا دليل حالي يبرر 11–15.
- Anonymous-auth churn perimeter implementation موجود في الريبو وQA الخاص به Green من الجلسات السابقة، لكنه غير موجود في Production DB حسب آخر read-only inspection: `public.public_abuse_rate_limits`, `claim_public_abuse_slot`, `create_room_v4`, و`join_room_v3` absent.
- Production Supabase project `mafia` كان `ACTIVE_HEALTHY` في هذه الجلسة عند read-only project inspection.
- Production migration ledger الفعلي يحتوي legacy server-generated versions وأسماء مختلفة عن بعض repo filename timestamps. هذا لم يعد يُعامل بالمقارنة الحرفية فقط: repository-owned reconciliation rules موجودة الآن في `scripts/release/migration-history-map.json` ويستخدمها preflight.
- Production migration `20260911204500_public_abuse_perimeter.sql` ما زالت pending/absent حسب آخر Production evidence؛ reconciliation لا تعتبرها مطبقة بدون ledger record يربط اسمها canonical timestamp فعليًا.
- Solo/AI Players MVP live in Production؛ snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + deterministic QA.
- [~] Migration-history parity reconciliation implemented; final exact-SHA CI still pending at session close.
- [ ] Fresh read-only release readiness against Production using reconciled history model.
- [ ] Launch-safety rollout only after explicit deploy-safe evidence.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 45 — 2026-09-12 — Migration-history parity contract reconciliation

### Session type
Delivery. Exactly one coherent objective: replace the structurally incorrect literal migration-version parity rule with deterministic repository-owned reconciliation for known Production legacy history, while preserving hard failure for genuinely missing or unknown migrations. No gameplay/story feature, Production deploy, Production migration, restore, or Production DB write.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `021c404299227d53a4161e0f4e8c822148436ac5`.
- Exact-SHA checks on the starting commit: `validate` completed/success ✅ and `qa` completed/success ✅.
- Read-only Supabase project lookup confirmed Production project `mafia` is `ACTIVE_HEALTHY`.
- Read-only Production migration listing confirmed the legacy ledger shape: early migrations use server-generated versions; two temporary deploy-source bridge entries are Production-only history; curated-story Production history corresponds to the later canonical repo reconciliation migration; newer entries encode the canonical repo timestamp at the beginning of the migration `name`.

### Exact objective
Implement migration-history identity reconciliation end-to-end in release tooling and deterministic QA so that:
1. exact known legacy Production history is accepted;
2. composite legacy history must be complete;
3. `20260911204500_public_abuse_perimeter.sql` stays reported missing until a real matching Production ledger record exists;
4. any unknown Production record remains a hard failure.

### Reproduction / design finding
- Old `scripts/release/preflight.mjs` compared the 14-digit repo filename prefixes directly against Production `schema_migrations.version`, so it could never truthfully pass the known legacy Production ledger.
- Production evidence provides a safer identity model than rewriting the DB ledger: exact legacy record aliases can be owned in the repository, while newer Supabase-generated versions can reconcile through a canonical timestamp prefix in the ledger `name`.
- `20260910074600_sync_case_mode_and_snapshot.sql` represents reconciled curated-story Production state and therefore requires both exact historical records `add_curated_story_mode` and `harden_curated_room_rpc`; one alone is insufficient.
- Temporary deploy-source bridge add/remove records are recognized only as exact `historicalOnly` ledger identities; they do not satisfy any canonical repo migration.

### Code / database / test / doc changes
- Added `scripts/release/migration-history-map.json` as the narrow source of truth for exact legacy aliases and exact Production-only historical records.
- Updated `scripts/release/preflight.mjs` to read `version|name`, reconcile direct canonical versions, canonical timestamps embedded in newer migration names, exact legacy alias sets, and exact historical-only entries.
- Preflight now hard-fails stale mapping references, empty alias sets, missing canonical migrations, incomplete composite aliases, malformed remote records, and unknown Production ledger records.
- Updated `scripts/qa/release-preflight-contract.mjs` with deterministic fixtures proving known legacy history passes, failed `qa` blocks, the abuse-perimeter migration remains missing when absent, an incomplete composite legacy alias blocks, and unknown Production history blocks.
- Updated `docs/operations/RELEASE-RUNBOOK.md` to document migration identity rules and forbid adding mappings merely to make preflight Green.
- No application schema/runtime code changed and no Production state changed.

### Commits
- `5fda5256f3b45fc4d1c1a131d00328071899518b` — `release: define legacy migration history mapping`
- `c553fb3508f990ce613d53d2a7f8a5c2fab9b797` — `release: reconcile legacy migration history safely`
- `b91a0e7d888f873097e2fcf54aa93e9a02551be5` — `test: cover legacy migration history reconciliation`
- `5c24ed6035d1d1a9da2f05e5adaa4cc762601103` — `docs: explain migration history reconciliation`
- Session handoff commit: `docs: record migration history reconciliation session`.

### Check / test results at session close
- Starting SHA `021c404299227d53a4161e0f4e8c822148436ac5`: `validate` success ✅; `qa` success ✅.
- New implementation commits triggered GitHub Actions. At the last inspection before handoff, checks on the implementation/doc tip were queued/in progress; no final Green claim is made for Session 45 yet.
- Deterministic contract coverage is committed and wired through the existing `qa:release-preflight` / Game QA path; final GitHub result must be resolved at the beginning of the next session.

### Newly discovered bugs / risks
- The mapping file is intentionally security-sensitive release metadata. A future careless alias addition could hide drift, so mappings must remain exact and evidence-backed; the runbook now states this explicitly.
- Newer ledger-name reconciliation trusts only a 14-digit canonical timestamp prefix that exists in the candidate's local migration set; arbitrary unknown names still fail.
- Production abuse-perimeter migration remains genuinely absent. Do not infer deploy safety merely because the legacy-history model is now representable.
- No new gameplay/story P0 discovered.

### Deploy-safety status
**Not deploy-safe for Production rollout.** Session 45 implementation checks were not complete at handoff close, and the required abuse-perimeter Production migration is still absent. No Production mutation occurred.

### Roadmap impact
Migration-history reconciliation is no longer a design-only blocker; it is implemented with explicit evidence-backed rules and negative fixtures. The next gate is to prove the implementation Green on exact SHA and run a fresh read-only Production preflight. Only that evidence can determine whether the launch-safety migration/release can be marked deploy-safe for a later, separately authorized rollout session.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وSession 45 checks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا `validate` وfull `qa` أصبحا Green، نفّذ **Fresh exact-SHA release readiness rerun** كجلسة واحدة read-only: شغّل/أثبت migration reconciliation ضد Production ledger الحالي، تأكد أن `20260911204500_public_abuse_perimeter.sql` هي الـmissing canonical migration الوحيدة المتوقعة، وافحص prerequisites اللازمة لها. لا تطبق migration ولا deploy Production في جلسة الإثبات؛ سجّل deploy-safety decision والـexact next action فقط.
