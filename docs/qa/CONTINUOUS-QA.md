# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Latest implementation SHA at Session 52 close: `1013d785711a8add8c2197c7f9d274cdf0e09753` (`test: lock AI player card identity UI`), preceded by `1cb2359741fb3556096cb1f3097304c4885b2e64` (`feat: show authoritative AI player identity`).
- Session 51 handoff SHA `d5d655fd4065afc0187c5336728251e010a4b300` is now Green: CI/`validate` completed/success ✅ and Game QA/`qa` completed/success ✅.
- Session 52 implementation CI + Game QA were both `in_progress` at the last inspection, so this change is **not deploy-safe yet**.
- Core/full-game 4–10 remains Green before this session; no known gameplay P0 surfaced.
- Identity/story contract + curated 4–10 + fairness remain Green; no current evidence justifies 11–15 expansion.
- Production DB already contains launch-safety migration `20260911204500_public_abuse_perimeter.sql`; no Production mutation occurred in Session 52.
- Guarded web release remains externally blocked because the connected GitHub surface still has no authorized `Vercel Release Package` workflow-dispatch operation with exact `release_sha` input. Generic/unpinned deployment remains prohibited.
- AI Players snapshot identity is now consumed explicitly by the room UI: `PlayerCard` uses `player.isBot` for a robot avatar cue and an `AI` badge while keeping `nickname` as the primary visible identity. The UI contract rejects nickname-prefix inference.
- Migration `20260912113500_ai_snapshot_identity.sql` remains repository-only until a separate safety-gated Production migration decision. Latest-source live browser evidence remains blocked by release/browser access.

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
- [~] AI Players snapshot identity: repository snapshot contract + deterministic E2E + explicit UI consumption are implemented; Session 52 checks are pending and Production migration remains unapplied.
- [ ] AI Players discussion-scope decision after snapshot/live evidence is complete.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 52 — 2026-09-12 — Delivery: AI Players explicit UI identity consumption

### Session type
Delivery session. Exactly one coherent product-confidence objective; no unrelated feature work.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start was Session 51 handoff commit `d5d655fd4065afc0187c5336728251e010a4b300`.
- Fresh Actions inspection showed CI run `34683617754` completed/success and Game QA run `34683617764` completed/success on that exact SHA.
- No P0/full-game regression or failing check preceded the objective.
- Session 51 had already established `players[].isBot` as the server-authoritative snapshot contract, but visible room UI did not consume that field explicitly.

### Exact objective
Consume authoritative AI identity explicitly in the room UI and lock the identity/display contract so bot presentation never depends on nickname conventions.

### Reproduction / design finding
- `PlayerCard` rendered `player.nickname` and generic initial/avatar state, with no explicit use of `player.isBot`.
- Current bot nicknames include an `AI ` prefix, but that is a display convention, not a durable identity contract.
- A future renamed/localized bot or a human whose nickname begins with `AI` must not change machine-identity behavior.
- Nickname remains the primary visible player identity; `isBot` is only an orthogonal machine-identity cue.

### Code / database / test / doc changes
- Updated `app/room/[code].tsx`:
  - imports the robot `Bot` icon;
  - renders a robot avatar cue for non-eliminated `player.isBot` players;
  - renders an explicit `AI` pill from `player.isBot`;
  - keeps `{player.nickname}` as the primary visible identity and preserves Boss/eliminated/selected state pills.
- Strengthened `scripts/qa/player-card-identity-contract.mjs`:
  - requires the visible nickname contract;
  - requires AI badge and robot cue to be driven by `player.isBot`;
  - rejects `nickname.startsWith/includes/match` or equality-based AI inference inside `PlayerCard`;
  - continues rejecting legacy `characterName` as a second visible identity.
- Database: no schema change beyond the already-repository-only Session 51 migration; no Production write or migration.
- Live browser: not claimed because latest-source guarded rollout/browser evidence is still unavailable.

### Commits
- `1cb2359741fb3556096cb1f3097304c4885b2e64` — `feat: show authoritative AI player identity`
- `1013d785711a8add8c2197c7f9d274cdf0e09753` — `test: lock AI player card identity UI`
- Session handoff: `docs: record AI identity UI session`.

### Check / test results at session close
- Starting Session 51 handoff SHA `d5d655fd4065afc0187c5336728251e010a4b300`: CI + Game QA completed/success ✅.
- Implementation SHA `1013d785711a8add8c2197c7f9d274cdf0e09753`: CI run `34686113806` and Game QA run `34686113827` were both `in_progress` at last inspection.
- No failing test was weakened, deleted, skipped, or rewritten merely to make CI Green.

### Newly discovered bugs / risks
- No new gameplay P0 discovered.
- UI previously under-consumed the authoritative `isBot` snapshot field; machine identity could remain visually coupled to the bot nickname convention. The repository UI/test gap is now closed, pending checks.
- Production still lacks `20260912113500_ai_snapshot_identity.sql`; applying it remains a separate production-safety decision after Green checks and read-only parity evidence.
- Latest-source live browser evidence remains unavailable until guarded release/browser access is resolved.

### Deploy-safety status
**Not deploy-safe yet.** Session 52 CI and Game QA were still running at close. No Production DB migration, web deploy, restore, or service mutation occurred.

### Roadmap impact
- AI identity now flows through the full repository contract: DB snapshot → TypeScript → deterministic E2E → visible PlayerCard cue, without replacing nickname as player identity.
- This closes the planned explicit UI-consumption slice before any LLM discussion feature decision.
- Web-release and Production-migration safety gates remain unchanged.

## الأولوية الدقيقة للجلسة التالية
افحص latest `main` وchecks أولًا. إذا Session 52 CI/Game QA فشل، أصلح أول meaningful failure فقط. إذا أصبحت Green، نفّذ **read-only release/preflight parity audit** للـlatest exact SHA وتأكد أن `20260912113500_ai_snapshot_identity.sql` هي migration الجديدة الوحيدة غير المطبقة. لا تطبقها Production إلا إذا الأدلة تسمح بتسجيل `deploy-safe` صريح في نفس الجلسة؛ ولا تبدأ LLM discussion feature قبل إغلاق هذا الـsafety decision.