# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التفاصيل التاريخية الكاملة محفوظة في Git history؛ هذا الملف يركز على الحالة التنفيذية الحالية.

## الهدف والقواعد الثابتة
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو هوية اللاعب الظاهرة؛ caseRole وصف وليس اسم شخصية بديلة.
- gender للصياغة فقط، ولا يؤثر على mafia assignment أو الفوز.
- Boss لاعب كامل ويحتفظ بإدارة اللعبة بعد elimination.
- bug مهم → regression عندما يكون عمليًا؛ ممنوع إضعاف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد كامل؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## P0 / Core status
- [x] vote gating + server-authoritative `phase/canVote` + UI guard.
- [x] reconnect: before/after cast → tie reset → resolve → next round.
- [x] eliminated Boss admin controls + eliminated-player vote rejection.
- [x] deterministic + local Supabase full-game RPC coverage لـ4–10 لاعبين.
- [x] same-room rematch E2E Green: finish → Boss-only reset → preserved players → clean lobby → fresh second case.
- [ ] Production DB parity blocked: Supabase project `bwxgzcppxdrfcaorobpm` was last rechecked read-only in Session 28 and was `INACTIVE`; no restore/write/migration بدون تصريح صريح. بعد restore المطلوب أولًا read-only schema/RPC/migration parity + smoke plan.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity; gender-aware install بعد shuffle بدون تأثير على mafia selection.
- [x] AI generator + curated presets يستخدمان semantic role/bio + male/female variants.
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.
- [x] server preset/AI-reference path يستخدم shared `lib/server-stories` registry.
- [x] legacy identity audit موثق في `docs/qa/LEGACY-IDENTITY-COMPATIBILITY-AUDIT.md`: `character_name` compatibility-only و`character_bio` runtime-required حاليًا.

## Current curated library
- 4: `last-tray`, `balcony-key`.
- 5: `clock-1117`, `room-312`.
- 6: `last-rehearsal`, `blue-notebook`.
- 7: `fourth-floor`, `silent-auction`.
- 8: `rooftop-envelope`, `backstage-pass`.
- 9: `gallery-ledger`, `garden-locker`.
- 10: `midnight-menu`, `archive-seal`.
- Theme packs: `home-social` (لمة وبيت), `stage-events` (مسرح وفعاليات), `work-records` (شغل وسجلات). Pack browsing is always filtered inside the active exact player count.
- 11–12: AI-only؛ لا curated support معلن. 13–15 غير مستهدفة حاليًا.

## QA coverage
- vote/gender/join/player-card/generated-case/legacy-identity contracts.
- caseRole + gender-aware install E2E.
- story critic + lexical fairness + curated identity integrity guards.
- `curated-player-count-contract.mjs`: exact 2 cases لكل 4–10، shared registry/API/Expo path، pack metadata integrity، player-count-first pack filtering، no unrelated-count fallback، و11–12 غير معلنين.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4/5/6/7/8/9/10 + tie/reconnect + eliminated Boss + rematch.
- Known non-blocking drift: اسم خطوة full-game في `.github/workflows/game-qa.yml` ما زال يقول 4/5/6/7 رغم أن suite يغطي 4–10؛ README roadmap أيضًا متأخر عن features المنفذة.

## Recent milestones
- Sessions 18–21: Story Quality baseline + semantic preset migration + curated 4–10 expansion; Green.
- Session 22: Checkpoint; Green.
- Session 23: Deep Curated Story Fairness Review; Green.
- Sessions 24–25: shared curated registry + QA repair; Green.
- Session 26: Legacy DB Identity Compatibility Audit; Green.
- Session 27: Same-room Rematch, code/QA `51183f896368d0a568dd22b569c4c5a520811269`; Green.
- Session 28: Checkpoint/Planning `6320fdbb24c3b7c18020f0ab9e732197121db0c4`; `CI` ✅ and `Game QA` ✅.

## Session 29 — 2026-09-11 — Curated Case Packs / Theme Browsing
### Session type
Delivery — exactly one Milestone E product slice. No Production work, new player-count expansion, gameplay rule change, or second feature started.

### Starting evidence
- Mandatory read order completed from default branch: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- `main` at start: `6320fdbb24c3b7c18020f0ab9e732197121db0c4`.
- Session 28 prerequisite resolved before implementation: GitHub Actions `CI` and `Game QA` both completed/success on `6320fdbb...`.
- No failing check or known P0 tied to the active objective was present.

### Exact objective
Add curated case packs/theme browsing end-to-end while preserving exact player-count safety, curated fairness, nickname/gender contracts, and existing mafia assignment semantics.

### Reproduction / design finding
- The create flow exposed exactly two curated cases for each supported count but only as a flat pair; there was no reusable theme taxonomy or browse/filter affordance as the library grows.
- Pack filtering must be secondary to player-count eligibility. A theme must never surface a case for the wrong count or change mafia assignment/gender behavior.
- Some counts currently have both cases in one pack, so the UI should only show pack filters when more than one pack is actually useful for that count; it must never manufacture unrelated-count fallback content.

### Code / API / UI / test changes
- `lib/story-catalog.ts`: added three explicit reviewed packs (`home-social`, `stage-events`, `work-records`), assigned every one of the 14 curated cases to one pack, and added `storiesForPlayerCount(playerCount, packId)`, `packsForPlayerCount`, and `storyMetadata` helpers.
- `lib/server-stories/index.ts`: server registry now resolves shared catalog metadata and includes `packId` in exact-count AI reference DTOs. Preset lookup still resolves the same curated case and player-count contract; no mafia/story content changed.
- `app/create.tsx`: added player-count-safe pack browsing, only offers packs available for the active count, clears stale filters when count changes, auto-selects a valid case when a pack changes, labels case cards by pack, and keeps final submit validation against the full exact-count set.
- `scripts/qa/curated-player-count-contract.mjs`: expanded regression coverage to require all 14 cases to have valid pack metadata, all three packs to contain content, pack filtering to remain player-count-first, server references to carry metadata, UI to derive only available packs, and stale pack state to reset on count changes. Existing exact 4–10/two-per-count/no-fallback guards remain intact.
- No schema, migration, Supabase RPC, player identity, gender wording, story text, or mafia assignment logic changed.

### Commits
- `14b1a8d95431a469c6df139ec2a00d6ad0189971` — `feat: add curated case pack metadata`.
- `0308a892ad31c443d2bf90dc237941371421c682` — `feat: expose curated pack metadata server-side`.
- `d05368cc08180385e238276bc3c750d241fc86fb` — `feat: browse curated cases by theme pack`.
- `9d4b7ac442d99a2a0683ad28cc6c0e79cec5453e` — `qa: cover curated case pack browsing`.

### Checks / evidence
- At session close, GitHub Actions for `9d4b7ac442d99a2a0683ad28cc6c0e79cec5453e` had started: `CI` in progress and `Game QA` in progress, with no failure reported yet.
- Because full checks were not complete, this session is not marked deploy-safe.

### Newly discovered bugs / risks
- No new P0/P1 gameplay bug was found during this slice.
- Pack taxonomy is intentionally metadata-only; it does not imply every player count has a case in every pack. Future library growth should add content based on quality/fairness, not fill a matrix mechanically.
- Production parity remains independently blocked by the inactive Production Supabase state last verified in Session 28.
- README/workflow-label drift remains non-blocking technical debt and was not mixed into this feature session.

### Deploy-safety status
**Not deploy-safe yet because `CI` and `Game QA` for the final code/QA commit were still running at handoff.** No Production deploy, restore, migration, or data write occurred.

### Roadmap impact
Curated library browsing now has a scalable taxonomy without weakening exact-count fairness. This closes the first post-checkpoint product objective and leaves Production parity as an external gate rather than silently coupling it to product work.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable for current runtime.
- [x] Curated library exact coverage 4–10 + deep fairness review.
- [x] Shared curated registry + legacy identity compatibility audit.
- [x] Same-room rematch.
- [ ] Session 29 curated case packs/theme browsing: implementation complete; awaiting final `CI` + `Game QA` result.
- [ ] Production parity remains blocked while Supabase project is `INACTIVE`.
- [ ] Abuse/public-launch protection.
- [ ] Polish/observability/docs drift cleanup.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Gameplay/Product Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا نتيجة `CI` و`Game QA` لـ`9d4b7ac442d99a2a0683ad28cc6c0e79cec5453e`. لو ظهر failure حقيقي أصلح أول failure meaningful فقط. لو Green، نفّذ **Production parity + smoke-readiness gate فقط إذا كان restore/availability مصرحًا ومتاحًا بوضوح**؛ وإلا اعتبر Production blocker قائمًا وانتقل إلى **Abuse / public-launch protection vertical slice** كهدف واحد، بدون Production mutation وبدون توسيع 11–15.
