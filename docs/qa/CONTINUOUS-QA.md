# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest pre-session `main` candidate: `3eed7d67ed92e75aef5102035bf240bfc2cea07b`.
- Exact-SHA GitHub checks على هذا الـcandidate: `validate` completed/success ✅ و`qa` completed/success ✅. بذلك Session 40 anonymous-auth churn perimeter رجعت Green end-to-end بعد إصلاحات Sessions 41–42.
- Core/full-game 4–10: Green على full Game QA الحالي، بما في ذلك deterministic 140 complete games + local Supabase RPC E2E لمسارات tie/reconnect/eliminated Boss/rematch والـabuse perimeter.
- Identity/story: nickname-only visible identity + gender wording + caseRole + curated/AI semantic-role contracts Green.
- Curated library: 14 قضية، قصتان لكل عدد 4–10؛ آخر story critic/fairness evidence Green؛ لا دليل يبرر 11–15 الآن.
- Solo/AI Players MVP live in Production؛ snapshot identity + browser/live UX evidence ما زال gap قبل أي توسع AI discussion.
- Production observability code موجود مع privacy-safe allowlist + release correlation + telemetry churn guard، لكنه غير مثبت كـdeployed runtime.
- Anonymous-auth churn perimeter code Green لكنه **غير موجود في Production DB** حتى Session 43: `public.public_abuse_rate_limits`, `claim_public_abuse_slot`, `create_room_v4`, و`join_room_v3` كلها absent في read-only Production inspection.
- Production Supabase project `mafia` كان `ACTIVE_HEALTHY` في Session 43. Dependencies التي تحتاجها migration الجديدة موجودة: `create_room_v3(text,text,integer,text,text,text,text)`, `join_room_v2(text,text,text)`, و`claim_case_generation_slot(text)`.
- Production migration ledger الحالي لا يطابق repo migration filename versions: `supabase_migrations.schema_migrations` يحتوي server-recorded versions مختلفة عن الـ14-digit prefixes الموجودة في `supabase/migrations/`. لذلك preflight الحالي الذي يقارن النسختين حرفيًا سيعمل hard-stop حتى قبل احتساب migration `20260911204500_public_abuse_perimeter.sql` المفقودة. هذا operational release blocker وليس مبررًا لتجاوز guardrail.
- limitation مقصودة للـabuse perimeter: clearing app/site storage يمكنه تدوير installation key؛ هذا perimeter ضد routine auth churn وليس fraud-proof device fingerprint، ولا يستخدم PII أو gameplay identity.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation abuse protection per authenticated identity.
- [x] Room creation/join abuse protection per authenticated identity + legacy Boss regression repair.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + final Green QA on exact SHA.
- [~] Fresh production release readiness: exact-SHA checks are Green and Production was inspected read-only, but migration-history parity guard is blocked by legacy ledger/version mismatch and the abuse-perimeter migration is genuinely absent in Production.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 39 — 2026-09-11 — Launch-safety checkpoint
Checkpoint/planning only. Starting SHA `62509fd60dfab0769c648ed304925979dcb9c42c` had `validate` + `qa` success. Audit found no P0 gameplay regression and made anonymous-auth churn the next exact priority, followed by fresh release readiness, AI Players live UX evidence, then an AI scope decision checkpoint. No Production write/deploy/migration.

## Session 40 — 2026-09-11 — Anonymous-identity churn / public-launch abuse perimeter
Delivery. Added migration `20260911204500_public_abuse_perimeter.sql`, digest-only installation-key limiter state, `create_room_v4`, `join_room_v3`, generation/telemetry installation-budget guards, client wiring, deterministic local-Supabase churn E2E, Game QA wiring, and privacy/runbook docs. Existing per-auth quotas remain in force. No Production write/deploy/migration. Initial handoff later exposed stale/static QA-contract issues rather than runtime privacy defects.

## Session 41 — 2026-09-12 — Abuse perimeter CI contract repair
Delivery / CI repair. Updated the Gender UI contract to follow the intentional `create_room_v4` / `join_room_v3` security boundary while retaining gender semantics and asserting `p_abuse_key`. No runtime/schema/Production change. That repair revealed the next QA failure in the perimeter privacy assertion.

## Session 42 — 2026-09-12 — Abuse perimeter privacy assertion repair
Delivery / CI repair. GitHub Actions logs showed the failing privacy assertion was a false positive caused by scanning the whole table DDL for substring `room`, which matched allowed action literals such as `create_room`. The test was strengthened to parse real column identifiers, require the exact minimal limiter schema, and run forbidden-identity assertions against columns only. Repair commit `c7e0993b83d4a8f9f1ae9f26a1a71eb50ebcde98`; handoff commit `3eed7d67ed92e75aef5102035bf240bfc2cea07b` subsequently completed with both `validate` and full `qa` success.

## Session 43 — 2026-09-12 — Fresh launch-safety release readiness audit
### Session type
Delivery / release-readiness audit — exactly one coherent objective: prove exact-SHA QA state and Production migration/preflight readiness read-only before any launch-safety Production mutation. No gameplay/story feature, Production deploy, Production migration, restore, or Production DB write.

### Starting evidence
- Read repository truth in required order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `3eed7d67ed92e75aef5102035bf240bfc2cea07b`.
- GitHub check-runs for that exact SHA: `validate` completed/success ✅ and `qa` completed/success ✅.
- Both CI and Game QA workflow runs for that SHA completed successfully.
- Current release tooling requires an exact 40-character SHA, those two Green checks, exact migration-history parity, read-only preflight success, and explicit deploy-safe handoff evidence before packaging/deploy.

### Exact objective
Perform a fresh, read-only release-readiness check for the current launch-safety candidate: exact-SHA checks + Production Supabase health/dependency inspection + migration ledger/parity evidence. Stop and document drift rather than applying a migration or deploying.

### Reproduction / design finding
- Production Supabase project `mafia` is `ACTIVE_HEALTHY`.
- Read-only inspection confirms `public.public_abuse_rate_limits` and the new abuse-perimeter RPCs are absent in Production, so `20260911204500_public_abuse_perimeter.sql` is genuinely not deployed.
- The migration's prerequisite Production RPCs are present with the expected signatures: `create_room_v3(text,text,integer,text,text,text,text)`, `join_room_v2(text,text,text)`, and `claim_case_generation_slot(text)`.
- A second, older drift exists in migration bookkeeping: Production `supabase_migrations.schema_migrations` versions are server-recorded IDs that do not equal the filename prefixes in the repository. `scripts/release/preflight.mjs` currently compares those values literally, so its parity rule cannot pass against current Production history as-is.
- This means the safe next action is **not** to bypass preflight and not to apply the new migration yet. First reconcile/repair the migration-ledger parity contract in repository tooling with durable evidence for the legacy Production history; then rerun the exact-SHA preflight. Only after that can a separately authorized migration/release session decide whether to mutate Production.

### Code / database / test / doc changes
- No application/schema/runtime code changed.
- No Production state changed; all Supabase operations in this session were read-only (`SELECT`/catalog inspection).
- Updated this handoff with the exact Green candidate SHA, current Production absence of the perimeter objects, confirmed prerequisite RPC signatures, and the migration-ledger blocker.

### Commits
- Starting candidate: `3eed7d67ed92e75aef5102035bf240bfc2cea07b` — both required checks Green.
- Handoff commit: `docs: record fresh release readiness audit`.

### Check/test results
- Candidate `3eed7d67ed92e75aef5102035bf240bfc2cea07b`: `validate` success ✅; full `qa` success ✅.
- Production DB health: `ACTIVE_HEALTHY` ✅.
- Abuse-perimeter Production parity: FAIL / expected drift ❌ — limiter table and new RPCs absent.
- Literal migration-ledger parity used by current preflight: FAIL ❌ — historical Production ledger versions do not match repo filename prefixes.
- No release package or deployment was attempted because parity is a hard stop.

### Newly discovered bugs / risks
- Release tooling currently assumes Supabase migration ledger IDs are identical to repository filename timestamps. That assumption is false for this Production database's existing history, so the guardrail needs a reconciled source-of-truth/mapping before it can truthfully certify parity.
- Applying `20260911204500_public_abuse_perimeter.sql` before fixing that contract would leave the exact-SHA release workflow unable to prove parity afterward and would encourage manual bypasses; do not do that.
- No new P0 gameplay or story defect was discovered.

### Deploy-safety status
**Not deploy-safe for Production rollout.** Relevant E2E/QA is Green, but the required Production migration is absent and the current migration-history preflight cannot establish trustworthy parity because of legacy ledger/version mismatch. No Production mutation occurred.

### Roadmap impact
- Anonymous-churn implementation itself is now QA-closed.
- Launch-safety rollout remains blocked on one operational correctness objective: reconcile the migration-history parity contract without weakening the release gate.
- AI Players UX evidence and unrelated features stay deferred until this launch-safety blocker is resolved or explicitly reprioritized at checkpoint.

## الأولوية الدقيقة للجلسة التالية
اعمل **Checkpoint/Planning session** لأن أربع جلسات تنفيذ/repair/readiness تمت منذ Session 39. راجع Green full-game evidence، launch-safety rollout blocker، والـmigration-ledger mismatch تحديدًا، ثم ثبّت 3–4 milestones تالية. إذا لم يظهر P0، اجعل أول objective تنفيذي بعد الـcheckpoint هو **reconcile Production migration-history parity contract** بطريقة read-only/deterministic تحفظ guardrail ولا تعتمد على مساواة خاطئة بين server-recorded migration IDs وrepo filename timestamps؛ لا تطبق `20260911204500_public_abuse_perimeter.sql` ولا deploy قبل نجاح ذلك الـcontract وإعادة preflight صريحة.