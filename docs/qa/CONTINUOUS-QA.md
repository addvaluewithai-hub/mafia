# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو.

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
- [x] same-room rematch E2E Green.
- [ ] Production DB parity blocked: Supabase project `bwxgzcppxdrfcaorobpm` rechecked read-only in Session 31 and still `INACTIVE`; no restore/write/migration بدون تصريح صريح. بعد restore المطلوب أولًا read-only schema/RPC/migration parity + smoke plan.

## Identity / story contract
- [x] gender + caseRole schema/backend/UI/E2E.
- [x] nickname-only identity; gender-aware install بعد shuffle بدون تأثير على mafia selection.
- [x] AI generator + curated presets يستخدمان semantic role/bio + male/female variants.
- [x] semantic/human fairness review للـ14 curated cases موثق في `docs/qa/CURATED-STORY-FAIRNESS-REVIEW.md`.
- [x] server preset/AI-reference path يستخدم shared `lib/server-stories` registry.
- [x] legacy identity audit موثق في `docs/qa/LEGACY-IDENTITY-COMPATIBILITY-AUDIT.md`.

## Curated library
- 4: `last-tray`, `balcony-key`.
- 5: `clock-1117`, `room-312`.
- 6: `last-rehearsal`, `blue-notebook`.
- 7: `fourth-floor`, `silent-auction`.
- 8: `rooftop-envelope`, `backstage-pass`.
- 9: `gallery-ledger`, `garden-locker`.
- 10: `midnight-menu`, `archive-seal`.
- Theme packs: `home-social`, `stage-events`, `work-records`; filtering stays inside exact active player count.
- 11–12: AI-only؛ 13–15 غير مستهدفة حاليًا.

## QA coverage
- vote/gender/join/player-card/generated-case/legacy-identity contracts.
- caseRole + gender-aware install E2E.
- story critic + lexical fairness + curated identity integrity guards.
- curated exact-count/pack contract for 4–10.
- deterministic full-game simulations: 140 complete games، 20 لكل 4/5/6/7/8/9/10.
- local Supabase full-game RPC E2E: 4–10 + tie/reconnect + eliminated Boss + rematch.
- AI generation abuse E2E: host-only DB-backed claim, 20s cooldown, 3 attempts / 10 minutes, preset exclusion, private limiter state, both server entrypoints enforce 429.
- Room/join abuse E2E added in Session 31: shared DB-backed per-auth identity limiter across current + legacy RPCs, private limiter state, create budget 5/10m, successful-join budget 8/10m.
- Known non-blocking drift: full-game workflow label still says 4/5/6/7 though suite covers 4–10; README roadmap lags implemented features.

## Recent milestones
- Sessions 18–21: Story Quality baseline + semantic preset migration + curated 4–10 expansion; Green.
- Session 22: Checkpoint; Green.
- Session 23: Deep Curated Story Fairness Review; Green.
- Sessions 24–25: shared curated registry + QA repair; Green.
- Session 26: Legacy DB Identity Compatibility Audit; Green.
- Session 27: Same-room Rematch; Green.
- Session 28: Checkpoint/Planning; Green.
- Session 29: Curated Case Packs / Theme Browsing; Green.
- Session 30: AI Generation Abuse Protection; `validate` ✅ and `qa` ✅ on `d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a`.

## Session 31 — 2026-09-11 — Room Creation / Join Abuse Protection
### Session type
Delivery — exactly one launch-safety vertical slice. No unrelated gameplay/story/feature work, Production restore, Production migration, or Production data write.

### Starting evidence
- Mandatory read order completed from default branch: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- `main` at start: `faf19e4a158684ceaa7c593f7eb2f49b3be2496e`.
- Session 30 prerequisite resolved before implementation: `validate` and `qa` both completed/success on `d89c7cc75e0ed6d08bb15fbdd9c2d4bdd89ca17a`.
- Production rechecked read-only: Supabase project `bwxgzcppxdrfcaorobpm` remains `INACTIVE`; restore not authorized, so no Production mutation was attempted.
- No failing check or known P0 tied to the active objective was present.

### Exact objective
Add server-authoritative bounded throttling for room creation and room joining before public launch, covering current and legacy RPC entrypoints so older callable functions cannot bypass the protection, while preserving normal create/join/idempotent behavior.

### Reproduction / design finding
- `create_room_v3` and `join_room_v2` had no durable per-identity room/join budget.
- Legacy authenticated RPCs (`create_room`, `create_room_v2`, `join_room`) remained callable, so protecting only the newest RPCs would leave a trivial bypass.
- A Postgres-backed limiter is required because client-only or in-memory throttles are bypassable/unreliable across instances.
- Join accounting is intentionally applied immediately before a successful insert, after room/state/name validations. This keeps idempotent retries and validation errors from consuming budget. Consequence: this slice limits successful multi-room join spam, not invalid room-code probing; that residual risk is documented rather than hidden.

### Code / database / test changes
- `supabase/migrations/20260911164000_room_join_rate_limit.sql` adds private `room_action_rate_limits` state keyed by authenticated user + action.
- Internal `claim_room_action_slot(text)` enforces one explicit 10-minute window with max 5 successful room creations or 8 successful joins per authenticated identity.
- Direct table access and direct execution of the internal claim function are revoked from `public`, `anon`, and `authenticated`.
- `create_room_v3`, `create_room_v2`, and legacy `create_room` all call the same creation limiter, closing version-based bypasses.
- `join_room_v2` and legacy `join_room` both call the same join limiter immediately before successful player insertion. Existing-member/host idempotent returns remain uncharged.
- `scripts/qa/room-join-rate-limit-e2e.mjs` verifies five creates succeed and the sixth is blocked; legacy create cannot bypass; eight joins succeed and the ninth is blocked even through legacy join; limiter table/function stay private; limits remain explicit/reviewable.
- `.github/workflows/game-qa.yml` now runs the room/join abuse E2E against clean local Supabase after the AI-generation abuse guard.

### Commits
- `d33fc2843e54ab28e65e31e14cf14d5a16304282` — `feat: throttle room creation and joins`.
- `885e049994dd7ef7f63be41a52b05ee2dd1adad6` — `qa: cover room and join throttling`.
- `bdd73e1a8b6ba0c4a3fa6dcb51d628d6a1c6b36d` — `qa: run room and join abuse guard`.

### Checks / evidence
- Session 30 prerequisite: `validate` ✅ and `qa` ✅.
- For `bdd73e1a...`, both `validate` and `qa` were `in_progress` at final inspection with no failure reported yet. The new local Supabase room/join E2E had therefore not been confirmed Green at handoff time.

### Newly discovered bugs / risks
- No new gameplay P0/P1 was discovered.
- Protection is per authenticated anonymous identity, not per IP/device; resetting identity can obtain a fresh budget. IP/device/provider-level controls remain future launch hardening if evidence justifies them.
- Invalid/nonexistent room-code probes are not durably counted by this RPC-level limiter because exception paths roll back the transaction. Solving that correctly requires a separate request boundary/token or gateway-level control and is outside this one objective.
- Legacy RPCs remain supported for compatibility but now share the same limiter, avoiding an abuse bypass.
- Production remains independently blocked/inactive and does not have either Session 30 or Session 31 migrations.

### Deploy-safety status
**Not deploy-safe yet because `validate` and `qa` for `bdd73e1a...` were still running.** No Production deploy, restore, migration, or data write occurred.

### Roadmap impact
This closes the second concrete public-launch abuse-control slice after AI generation. Since Sessions 29–31 are three implementation sessions after Checkpoint 28, the next Green handoff should trigger a bounded checkpoint/planning session rather than another implementation feature.

## Backlog / roadmap
- [x] Core/full-game 4–10 stable in deterministic + local RPC suites.
- [x] Identity/story contract stable.
- [x] Curated library exact coverage 4–10 + deep fairness review.
- [x] Shared curated registry + legacy identity compatibility audit.
- [x] Same-room rematch.
- [x] Curated case packs/theme browsing.
- [x] AI generation abuse protection; Session 30 Green.
- [ ] Room creation/join abuse protection; implementation complete, awaiting final `validate`/`qa` result.
- [ ] Production parity blocked while Supabase project is `INACTIVE`.
- [ ] Future launch hardening only after checkpoint reprioritization: observability/error telemetry, provider quotas/runbook, possible gateway/IP-level probing controls.
- [ ] Polish/README/workflow-label drift cleanup.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## اتجاه المنتج
**Core Stable → Identity/Story Contract Stable → Story Quality → Curated Library 4–10 → New Gameplay/Product Features → Production/Launch Safety → Polish/Launch**.

## الأولوية الدقيقة للجلسة التالية
افحص أولًا نتيجة `validate` و`qa` لـ`bdd73e1a8b6ba0c4a3fa6dcb51d628d6a1c6b36d`. لو ظهر failure حقيقي مرتبط بالـroom/join abuse guard، أصلح أول failure meaningful فقط ولا تبدأ scope جديد. لو Green، نفّذ **Checkpoint/Planning session فقط**: راجع launch-safety coverage الفعلية، residual abuse risks، Production DB blocker، full-game regression health، story/library status، technical/docs drift، وحدد 3–4 milestones تالية مع أولوية واحدة دقيقة؛ لا تبدأ feature جديدة في نفس checkpoint.
