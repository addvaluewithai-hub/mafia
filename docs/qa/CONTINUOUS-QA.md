# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest `main` at Session 47 start: `eba158539a7050ad45c620360859fec6c83deb7e`.
- Exact-SHA GitHub workflows on that SHA are Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced in this session.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production project `mafia` is `ACTIVE_HEALTHY`.
- Controlled launch-safety migration rollout completed successfully: Production ledger now records `20260911204500_public_abuse_perimeter` (server version `20260912033242`).
- Post-migration object verification is Green: `public.public_abuse_rate_limits`, `claim_public_abuse_slot(text,text)`, `create_room_v4(...)`, `join_room_v3(...)`, and `claim_case_generation_slot_v2(text,text)` all exist; RLS is enabled on the rate-limit table.
- Fresh Production migration reconciliation is now complete: all 16 canonical repo migrations reconcile and the new public-abuse migration is no longer missing; no unrelated Production migration was introduced.
- Security advisor reports the new rate-limit table as RLS-enabled/no-policy, which is intentional because direct table privileges are revoked and access is through the bounded RPC. It also reports `claim_public_abuse_slot` as callable by anon/authenticated SECURITY DEFINER; this is intentional for the telemetry/public-abuse boundary and matches the reviewed migration contract. Existing unrelated advisor warnings remain out of scope for this rollout.
- No Vercel/web deploy, restore, or unrelated Production DB write occurred in Session 47.

## Roadmap status
- [x] Core/full-game 4–10 stable.
- [x] Identity/story contract + curated 4–10 + fairness + packs.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + relevant E2E + Production rollout.
- [x] Release parity + Vercel deployment guardrails implementation.
- [x] Production observability implementation.
- [x] Anonymous-identity churn / public-launch abuse perimeter implementation + deterministic QA.
- [x] Migration-history parity reconciliation implemented and exact-SHA CI Green.
- [x] Launch-safety Production migration rollout + post-migration object/ledger verification.
- [~] Web release readiness: Production DB parity is now restored; a later separate session must perform the repository release preflight/package/deploy workflow and smoke verification before claiming the web release complete.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 47 — 2026-09-12 — Controlled launch-safety migration rollout

### Session type
Delivery/rollout session. Exactly one coherent objective: resolve the pending Session 46 handoff checks, apply only the explicitly approved `20260911204500_public_abuse_perimeter.sql` migration to Production, then verify its objects and migration parity. No Vercel/web deploy and no unrelated feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `eba158539a7050ad45c620360859fec6c83deb7e`.
- The previously pending handoff workflows resolved Green before mutation: Game QA completed/success and CI completed/success on exact SHA `eba158539a7050ad45c620360859fec6c83deb7e`.
- Session 46 explicitly marked one Production change deploy-safe: applying only `supabase/migrations/20260911204500_public_abuse_perimeter.sql`; it explicitly prohibited a web deploy in the same session.
- Pre-rollout Production ledger had 18 records and did not yet contain the public-abuse migration.

### Exact objective
Perform the approved controlled Production migration rollout only, then prove the resulting schema/object presence and migration-ledger parity without starting web deployment or another product objective.

### Reproduction / design finding
- The approved migration applied successfully through the managed Supabase migration operation.
- Supabase recorded it as server migration version `20260912033242` with name `20260911204500_public_abuse_perimeter`; the repository reconciliation contract recognizes canonical timestamps carried in migration names, so this maps to canonical repo migration `20260911204500` without adding a new alias.
- Post-migration SQL confirms the rate-limit table and all four expected RPC entry points exist. RLS is enabled on the table.
- The Production ledger now has 19 records and includes the new named canonical migration. Under the repository reconciliation model, all 16 canonical repo migrations are now accounted for and there is no new unknown drift.
- Security advisor observations on the new table/function match the intentional migration design: no direct table policy/privilege path, and the public claim RPC is the bounded SECURITY DEFINER API needed by the public telemetry boundary. No advisor-driven schema change was mixed into this rollout.

### Code / database / test / doc changes
- Production DB: applied exactly `20260911204500_public_abuse_perimeter.sql`; no other migration or DDL/DML was performed.
- Production verification: read-only object-presence/RLS query, fresh migration-ledger listing, and security-advisor inspection.
- GitHub: no runtime/schema/test code changed in this session; updated this rolling handoff with durable rollout evidence.

### Commits
- Exact rollout source / starting handoff SHA: `eba158539a7050ad45c620360859fec6c83deb7e`.
- Session 47 handoff commit: `docs: record launch-safety migration rollout`.

### Check / test results at session close
- Starting/latest rollout source SHA `eba158539a7050ad45c620360859fec6c83deb7e`: CI completed/success ✅; Game QA completed/success ✅.
- Managed Production migration application: success ✅.
- Post-migration object presence: table + `claim_public_abuse_slot` + `create_room_v4` + `join_room_v3` + `claim_case_generation_slot_v2` present ✅.
- RLS on `public_abuse_rate_limits`: enabled ✅.
- Post-migration ledger: public-abuse migration present; canonical migration parity restored under the tested reconciliation contract ✅.
- Handoff-only commit checks may still be pending/absent at close; it does not change runtime/schema behavior.

### Newly discovered bugs / risks
- No new gameplay/story P0 discovered.
- The database rollout is complete, but the web release has not happened; the currently deployed web client may therefore still be an older source until a separately gated release session packages/deploys the exact approved source.
- Supabase security advisor flags intentional public SECURITY DEFINER access for `claim_public_abuse_slot` and RLS-without-policy on the private rate-limit table. These are expected by design, but any future widening of that RPC or table privileges must be treated as security-sensitive.
- Existing unrelated advisor warnings were not changed in this session to avoid mixing objectives.

### Deploy-safety status
**Production DB rollout complete and verified.** The exact approved migration was applied successfully and post-migration parity/object checks are Green.

**No Vercel/web deployment was performed in this session.** Database parity is no longer the blocker. A later separate release session may proceed only after resolving latest-main checks and running the repository's exact-SHA release preflight/package guardrails; it must then verify the deployed SHA and perform the prescribed production smoke checks before claiming web rollout complete.

### Roadmap impact
The launch-safety database milestone is closed: the anonymous-identity churn perimeter now exists in Production and migration parity is restored. The next session should stay within launch readiness and execute the separately gated web release workflow rather than reopening product scope.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا بقي latest launch-safety source Green، نفّذ **exact-SHA web release readiness/deploy verification** كهدف واحد: شغّل release preflight ضد Production parity الحالية، package/deploy فقط إذا guardrails كلها Green، ثم تحقق من deployed SHA وproduction smoke وفق الـrunbook. لا تبدأ AI Players أو feature أخرى في نفس الجلسة.