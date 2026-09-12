# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest `main` before this handoff update: `e0988e819b84b28dd660c89b71a49ee3cfa45978`.
- Exact-SHA GitHub checks on that candidate are Green: `validate` completed/success ✅ and full `qa` completed/success ✅.
- Core/full-game 4–10 remains Green; no known gameplay P0 surfaced in this session.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Migration-history reconciliation is implemented and now proven against the current Production ledger shape.
- Fresh read-only Production evidence shows every canonical repo migration before the public-abuse migration reconciles, with no unknown Production ledger record. The only missing canonical repo migration is `20260911204500_public_abuse_perimeter.sql`.
- Production project `mafia` is `ACTIVE_HEALTHY`.
- The public-abuse migration prerequisites exist in Production: `create_room_v3(text,text,integer,text,text,text,text)`, `join_room_v2(text,text,text)`, `claim_case_generation_slot(text)`, and `extensions.digest(text,text)`.
- The objects introduced by that migration are still absent as expected before rollout: `public.public_abuse_rate_limits`, `claim_public_abuse_slot`, `create_room_v4`, `join_room_v3`, and `claim_case_generation_slot_v2`.
- No Production write, migration, restore, or deployment occurred in Session 46.
- Solo/AI Players MVP remains live in Production; snapshot identity + browser/live UX evidence is still a later gap before any AI discussion expansion.

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
- [x] Fresh read-only release readiness against Production using reconciled history model.
- [~] Launch-safety rollout: exact migration is now approved for a later controlled Production migration session; post-migration exact-SHA preflight and rollout verification remain required before web packaging/deploy.
- [ ] AI Players snapshot identity + browser/live UX evidence; then decide LLM discussion scope.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 46 — 2026-09-12 — Fresh exact-SHA release readiness rerun

### Session type
Delivery/evidence session. Exactly one coherent objective: resolve Session 45 checks, then perform a fresh read-only exact-SHA launch-safety readiness audit against current Production migration history and migration prerequisites. No feature implementation, Production migration, deploy, restore, or Production DB write.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Starting latest `main`: `e0988e819b84b28dd660c89b71a49ee3cfa45978`.
- Session 45 prerequisite resolved first: exact-SHA `validate` completed/success ✅ and `qa` completed/success ✅ on `e0988e819b84b28dd660c89b71a49ee3cfa45978`.
- `scripts/release/preflight.mjs` requires exact-SHA Green checks and reconciles local canonical migrations against Production ledger using repository-owned aliases/historical-only rules; any missing or unknown record is a hard stop.

### Exact objective
Prove, read-only, whether the reconciled release model now describes current Production truth and identify the exact remaining launch-safety change, including its prerequisites, without mutating Production.

### Reproduction / design finding
- Production migration ledger currently has 18 records: four exact legacy aliases for early canonical migrations, two historical-only temporary bridge records, the two-record composite curated-story alias, and ten newer records whose names carry canonical migration timestamps.
- The repository candidate has 16 canonical migration files. Reconciliation accounts for 15 of them and recognizes all 18 current Production ledger records.
- The one and only missing canonical migration is `20260911204500_public_abuse_perimeter.sql`; there is no unknown Production drift.
- Production runtime prerequisites required by that migration already exist: `create_room_v3`, `join_room_v2`, `claim_case_generation_slot`, and `extensions.digest`.
- None of the migration's new table/RPC objects exist yet, matching the expected pre-rollout state rather than a partial/ambiguous application.

### Code / database / test / doc changes
- No runtime, schema, test, or release-tool code changed.
- Performed read-only GitHub exact-SHA check inspection.
- Performed read-only Supabase project/migration inspection.
- Performed one read-only SQL prerequisite/object-presence query; no DDL/DML or Production state mutation.
- Updated this handoff with durable release-readiness evidence and the exact deploy-safety boundary.

### Commits
- Session 45 candidate proven Green: `e0988e819b84b28dd660c89b71a49ee3cfa45978`.
- Session 46 handoff commit: `docs: record fresh release readiness evidence`.

### Check / test results at session close
- Candidate SHA `e0988e819b84b28dd660c89b71a49ee3cfa45978`: `validate` completed/success ✅; `qa` completed/success ✅.
- Existing Game QA therefore includes the deterministic public-abuse perimeter regression/E2E and release-preflight contract coverage for this exact candidate.
- Fresh Production reconciliation evidence: only canonical `20260911204500` is missing; no unexpected Production record found.
- Handoff-only commit checks may still be pending/absent at close; this documentation commit does not change the proven candidate code/schema.

### Newly discovered bugs / risks
- No new gameplay/story P0 discovered.
- Production remains intentionally one migration behind the candidate, so the current application/release cannot be packaged or deployed yet under the release invariant.
- Applying the migration is not the end of release readiness: after application, the same exact candidate SHA must pass a fresh read-only preflight showing full parity before any Vercel source package/deploy.
- A migration application failure/partial state must be treated as a hard stop and investigated; do not manually fabricate ledger history or aliases.

### Deploy-safety status
**Deploy-safe for one exact Production change only:** applying `supabase/migrations/20260911204500_public_abuse_perimeter.sql` from candidate `e0988e819b84b28dd660c89b71a49ee3cfa45978` in a separately controlled rollout session. This approval is based on exact-SHA `validate` + full `qa` Green, deterministic abuse-perimeter E2E/contract coverage in that QA, current Production prerequisite presence, and the absence of any other migration drift.

**Not yet deploy-safe for Vercel/web release.** After the approved migration is applied, rerun exact-SHA read-only preflight against Production. Web packaging/deploy is allowed only if that post-migration preflight is fully Green and the handoff records the resulting rollout verification. No Production mutation occurred in Session 46.

### Roadmap impact
The migration-history blocker is closed as a modeling/readiness issue. The launch-safety stack now has a single explicit Production delta with prerequisites proven present and no unrelated drift. The next session should stay inside this milestone: apply only that approved migration, verify post-migration objects/parity, and stop before unrelated product work.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا ظهر failure حقيقي، أصلح أول meaningful failure فقط. إذا بقي candidate launch-safety code Green، نفّذ **controlled launch-safety migration rollout** كهدف واحد: طبّق فقط `20260911204500_public_abuse_perimeter.sql` على Production، ثم افحص وجود الجدول/RPCs وكرر exact-SHA read-only migration preflight/parity. لا تعمل Vercel/web deploy في نفس الجلسة؛ إذا أصبح post-migration preflight Green، سجّل ذلك كدليل deploy-safe للـweb release في جلسة لاحقة منفصلة.