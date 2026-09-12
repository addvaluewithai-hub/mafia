# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest handoff SHA at Session 53 start: `13222a1745264b3be727aa49dd85accac80ce5e5` (`docs: record AI identity UI session`).
- Session 52 latest handoff is now Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅ on exact SHA `13222a1745264b3be727aa49dd85accac80ce5e5`.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB already contains launch-safety migration `20260911204500_public_abuse_perimeter.sql`; no Production mutation occurred in Session 53.
- Guarded web release remains externally blocked because the connected GitHub surface still has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- AI Players snapshot identity is implemented end-to-end in the repository: DB snapshot contract → TypeScript → deterministic E2E → explicit PlayerCard `isBot` consumption, with nickname remaining the visible identity.
- Fresh read-only Production parity audit confirms `players.is_bot` already exists, current Production `room_snapshot(text)` still omits `players[].isBot`, and `20260912113500_ai_snapshot_identity.sql` is the only new canonical repo migration not yet represented in the Production ledger.
- `20260912113500_ai_snapshot_identity.sql` is explicitly **deploy-safe for a separate controlled Production migration session only** against the Green exact SHA lineage above. This is not authorization for a web/Vercel deploy or any unrelated migration.

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
- [~] Web rollout completion: code/DB/check prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [~] AI Players snapshot identity: repository contract/UI/tests are Green and the Production migration has passed read-only safety/parity audit; controlled Production application remains pending.
- [ ] AI Players discussion-scope decision after snapshot/live evidence is complete.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 53 — 2026-09-12 — Delivery: AI snapshot migration release-readiness audit

### Session type
Delivery/safety-gate session. Exactly one coherent objective: read-only exact-SHA Production parity and deploy-safety decision for the AI snapshot identity migration. No unrelated product feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was `13222a1745264b3be727aa49dd85accac80ce5e5`.
- Fresh exact-SHA check-runs inspection showed `validate` completed/success and `qa` completed/success on `13222a1745264b3be727aa49dd85accac80ce5e5`.
- No P0/full-game regression or failing check preceded the objective.
- Session 52 handoff required a read-only parity audit before any Production decision for `20260912113500_ai_snapshot_identity.sql`.

### Exact objective
Verify Production migration parity and the current `room_snapshot`/`players.is_bot` prerequisites read-only, determine whether `20260912113500_ai_snapshot_identity.sql` is the sole pending canonical migration, and record a bounded deploy-safety decision without applying it in this session.

### Reproduction / design finding
- Repository tree at exact SHA includes 17 canonical migration files through `20260912113500_ai_snapshot_identity.sql`.
- Production migration ledger currently contains the reconciled legacy/canonical history through `20260911204500_public_abuse_perimeter` and no record for `20260912113500_ai_snapshot_identity`.
- The existing migration-history reconciliation rules recognize the known legacy aliases and hard-fail unknown drift; no new alias is needed for this migration.
- Production `public.players.is_bot` exists as boolean, satisfying the only new data dependency used by the migration.
- Production `public.room_snapshot(text)` is still the pre-identity version: it returns player nickname/gender/caseRole/character fields/elimination/host state but no `isBot` key.
- The repository migration replaces that function while preserving the existing phase/voting/privacy semantics and adds only `'isBot', p.is_bot` to each player snapshot object.
- Current Production function ACL is `{postgres, authenticated, service_role}` execute; the migration explicitly revokes `public`/`anon` and grants execute to `authenticated`, preserving the intended external access boundary.

### Code / database / test / doc changes
- Code/schema: no implementation change; this session intentionally performed a safety audit only.
- Database: read-only inspection only (`list_migrations`, function definition, `players.is_bot`, function ACL). No DDL/DML, migration, restore, or service mutation.
- Tests/checks: no test changed; exact-SHA `validate` + `qa` are Green.
- Docs: updated this handoff with the parity evidence and explicit bounded deploy-safe decision.

### Commits
- Starting exact SHA: `13222a1745264b3be727aa49dd85accac80ce5e5` — `docs: record AI identity UI session`.
- Session handoff: `docs: record AI snapshot migration readiness`.

### Check / test results at session close
- Exact-SHA `13222a1745264b3be727aa49dd85accac80ce5e5`: `validate` completed/success ✅; `qa` completed/success ✅.
- Read-only Production ledger inspection: all previously reconciled migrations are present through public-abuse perimeter; only `20260912113500_ai_snapshot_identity.sql` remains pending from the current repo tree.
- Production prerequisite inspection: `players.is_bot boolean` exists ✅; `room_snapshot(text)` exists in the expected pre-migration form ✅; intended execute boundary is authenticated/service-side only ✅.
- No failing test was weakened, deleted, skipped, or rewritten.

### Newly discovered bugs / risks
- No gameplay P0 or new functional regression discovered.
- Until the migration is applied, latest-source UI that expects `player.isBot` cannot receive that field from Production snapshots; this is a known deployment-order dependency rather than a repository regression.
- Applying the migration and web rollout must remain separate safety-gated steps; generic/unpinned web deployment is still prohibited.
- Latest-source live browser evidence remains unavailable until the guarded web release path is executable.

### Deploy-safety status
**Deploy-safe for exactly one controlled Production DB change:** apply repository migration `20260912113500_ai_snapshot_identity.sql` only, from the Green exact-SHA lineage represented by `13222a1745264b3be727aa49dd85accac80ce5e5`. After application, verify the ledger record, confirm `room_snapshot(text)` contains `players[].isBot`, re-check function privileges, and re-run read-only migration parity. This does **not** authorize Vercel/web deployment, any other migration, or unrelated Production mutation.

### Roadmap impact
- AI Players authoritative identity has now cleared repository checks plus Production read-only migration prerequisites.
- The next bounded milestone is Production DB contract rollout and post-migration verification; only after that and guarded web release/live evidence should the AI discussion-scope decision resume.

## الأولوية الدقيقة للجلسة التالية
إذا ظل latest `main` Green، نفّذ **controlled Production rollout لـ`20260912113500_ai_snapshot_identity.sql` فقط** وفق الـdeploy-safe decision أعلاه، ثم تحقق من ledger و`room_snapshot players[].isBot` والـACL وأعد read-only parity. لا تنفذ Vercel/web deploy ولا تبدأ LLM discussion feature في نفس الجلسة.
