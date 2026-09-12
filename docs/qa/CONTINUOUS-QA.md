# آخر خيط — Continuous QA Handoff

> مصدر الحقيقة للحالة الحالية والهاند أوف. اقرأ قبله `AGENTS.md` ثم `docs/qa/QA-OPERATING-MODE.md`. لا تعتمد على chat memory بدل الريبو. التاريخ التفصيلي محفوظ في Git history؛ هذا الملف rolling handoff للحالة الحالية.

## ثوابت المنتج والـQA
- full-game: create → join → role/case install → clues → voting → ties → elimination → reconnect → next round → winner.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يؤثر على mafia assignment أو الفوز؛ Boss يحتفظ بإدارة اللعبة بعد elimination.
- bug/failure مهم → regression أو إصلاح حقيقي؛ لا تضعف test لجعل CI أخضر.
- لا Production deploy/migration إلا بعد relevant E2E Green و`deploy-safe` صريح هنا.
- الجلسة العادية vertical slice واحد؛ checkpoint حسب `QA-OPERATING-MODE.md`.

## الحالة الحالية
- Session 58 bounded product/UX review started from latest `main` `bcaf0825500d328f8f325487b076572662d526cc`; exact-SHA CI and Game QA were both completed/success.
- Core/full-game 4–10 remains Green with no known P0. Established QA evidence includes 140 deterministic simulations plus local Supabase full-game RPC coverage across every player count 4–10, tie reset, elimination, reconnect, next clue, Boss authority, winner, rematch, and AI Players identity.
- Production migration parity remains closed: 17/17 repo migrations reconcile with 20/20 Production ledger records.
- Guarded web release remains externally blocked because the connected GitHub execution surface still exposes no authorized workflow-dispatch action for `Vercel Release Package` with exact `release_sha`. Generic/unpinned deploy remains prohibited.
- Curated story library has 14 cases covering every count 4–10; current human semantic/Egyptian-Arabic quality milestone is closed.
- AI Players discussion decision: **no-go on LLM-generated bot discussion now**. The current product gap is that solo bots vote but do not visibly participate in discussion. The smallest justified next slice is deterministic, public-evidence-only bot discussion cues; LLM generation is deferred until that cheaper interaction proves useful.

## Roadmap status
- [x] Core/full-game 4–10 stable with deterministic + local-RPC coverage.
- [x] Identity/story contract + gender-safe wording + caseRole + curated 4–10 fairness foundation.
- [x] Same-room rematch.
- [x] AI generation + room/join abuse protection per authenticated identity.
- [x] Solo/AI Players MVP + authoritative `isBot` snapshot/UI contract + Production DB rollout.
- [x] Release parity/deployment guardrails + Production observability + public-launch abuse perimeter.
- [x] Migration-history parity reconciliation.
- [x] Human semantic/Egyptian-Arabic quality pass for the current 14 curated 4–10 stories.
- [~] Web rollout/live-browser evidence: product/check/DB prerequisites are Green, but guarded exact-SHA package dispatch is unavailable from the connected execution surface.
- [x] AI Players discussion-scope decision: deterministic public-evidence cues first; no LLM yet.
- [ ] Deterministic AI discussion cues vertical slice, gated behind latest Green checks and continued release-dispatch unavailability.
- [ ] LLM discussion only if deterministic UX evidence shows a concrete quality ceiling worth the privacy/cost/latency complexity.
- [ ] 11–15 only if later gameplay/UX evidence justifies expansion.

## Session 58 — 2026-09-12 — Product/UX review: AI Players discussion scope

### Session type
Bounded product/UX design review. Exactly one coherent objective: decide whether AI Players discussion needs LLM generation, define the smallest safe interaction contract and fallback, and record a go/no-go implementation objective. No feature implementation in this review session.

### Starting evidence
- Required repository truth read in order: `AGENTS.md` → `docs/qa/QA-OPERATING-MODE.md` → this handoff.
- Latest `main` at start: `bcaf0825500d328f8f325487b076572662d526cc` (`docs: record curated story quality closure`).
- Exact-SHA GitHub Actions on that SHA: CI completed/success; Game QA completed/success.
- Authorized exact-SHA `Vercel Release Package` workflow-dispatch capability remains unavailable from the connected GitHub execution surface, so the handoff's bounded AI discussion review fallback was selected.
- Current solo UX explicitly tells the human that three AI players join automatically and vote automatically; the room UI marks bots through authoritative `player.isBot`, but there is no bot discussion surface.
- Current `cast_ai_votes` is server-side and intentionally constrained: innocent bots lean toward case roles appearing in revealed clues; mafia bots can use only their own secret-team knowledge to avoid teammates when an innocent target exists. The migration comment explicitly forbids exposing the solution/private case payload to clients.

### Exact objective
Decide whether bot discussion requires an LLM now; define the minimum useful player-facing contract, deterministic fallback, information boundary, and privacy/cost/latency/failure gates; leave one implementation-sized next objective without building it in this session.

### Reproduction / design finding
- The actual UX gap is social presence, not reasoning correctness: bots already participate in the authoritative player/role/vote lifecycle and can complete votes, but the human sees no bot contribution during the discussion window.
- An LLM is not required to test whether visible bot participation improves solo play. Introducing one now would add a second inference path, latency during a timed discussion phase, per-round cost, prompt-injection/content-quality surface, retry/failure UX, and a new privacy boundary around secret role/team data before there is evidence that generative prose is necessary.
- The smallest useful contract is **one short, clearly AI-labeled Egyptian-Arabic discussion cue per alive bot per revealed round**, derived only from already-public game state: bot nickname, public caseRole/bio, revealed clue(s), discussion prompt, alive/eliminated public roster, and round number. It must never consume solution text, unrevealed clues, another player's private role, or mafia-team membership.
- Cue semantics should be modest rather than pretending to be human reasoning: point to a public clue/case-role connection, express uncertainty, or ask the round's public discussion question. It must not claim hidden knowledge and must not announce a definitive culprit before public evidence supports that conclusion.
- Determinism is the fallback and the first implementation path, not merely an outage mode: select from small Egyptian templates using stable public inputs so refresh/reconnect shows the same cue, no network call is needed, and tests can assert privacy and wording contracts.
- Bot voting may continue to use the existing server-side secret-team rule for mafia self-preservation, but visible discussion cues must be computed from a stricter public-only projection. Discussion text must not become an input that changes mafia assignment, win probability, phase progression, or authoritative voting eligibility.

### Go / no-go decision and gates
- **NO-GO now: LLM-generated bot discussion.** There is no evidence yet that generative language adds enough value over deterministic cues to justify new operational and privacy risk.
- **GO next, after Green gate: deterministic discussion-cue vertical slice.** Prefer a pure/shared function over new schema or persistence unless implementation evidence proves persistence is necessary. Stable inputs must make refresh/reconnect deterministic.
- Privacy gate for any future LLM: construct an explicit public-context DTO allowlist; never send solution, unrevealed clues, private role/team fields, auth/session tokens, room secrets, or arbitrary database rows. Add regression proving forbidden fields are absent before any provider call.
- Cost gate for any future LLM: hard maximum one bounded generation per bot/round (or one batched generation per round), explicit token/output cap, no generation on refresh/reconnect, and a documented per-full-game upper bound before enabling it.
- Latency gate: discussion and voting must remain usable without waiting for inference; generation cannot block reveal, timer, vote, resolve, reconnect, or winner paths.
- Failure gate: timeout/provider error/invalid output silently falls back to deterministic cues; no gameplay state transition depends on generated text.
- Quality/safety gate: Egyptian-Arabic output must be short/read-aloud natural, nickname-led, non-abusive, and uncertainty-aware; deterministic tests cover no hidden-information leakage and no stale/eliminated-bot speaking.
- Evidence gate before reconsidering LLM: collect browser/live or structured playtest evidence that deterministic cues are repetitive/confusing enough to harm solo deduction. Without that evidence, keep LLM deferred.

### Code / database / test / doc changes
- Code: none by design; this was a bounded decision session.
- Database/Production: none. No DDL, DML, migration, deploy, restore, or service mutation.
- Tests: none changed or weakened. Existing Green AI/full-game suite remains the safety baseline.
- Docs: this handoff now records the product decision, public/private information contract, operational gates, and exact implementation-sized next objective.

### Commits
- Session handoff commit: `docs: decide AI discussion scope`.

### Check / test results at session close
- Starting SHA `bcaf0825...`: CI completed/success; Game QA completed/success.
- This session changes documentation only. Checks for the new handoff commit should be inspected first next session; no new deploy-safe claim is inferred until they are known.

### Newly discovered bugs / risks
- Product gap, not a correctness bug: solo AI players are visually identified and vote, but provide no visible social/discussion presence.
- LLM-first implementation would create unnecessary secret-context leakage risk because current bot voting legitimately has server-side mafia-team knowledge that visible discussion must not inherit.
- Timed discussion makes inference latency especially dangerous if UI/gameplay waits on generation.
- Refresh/reconnect can multiply cost or produce contradictory bot statements unless generation is persisted or deterministically keyed; deterministic public-input cues avoid that class of problem for the first slice.
- Guarded web release/live-browser evidence remains externally blocked.
- 11–15 remains unsupported absent gameplay/UX evidence.

### Deploy-safety status
No Production change is authorized by this session. Starting code is Green, but this review makes no deploy claim and performs no production/web/database mutation. Generic/unpinned web deployment remains prohibited while exact-SHA guarded packaging cannot be dispatched.

### Roadmap impact
The AI discussion question is no longer an open-ended "add LLM" feature. The roadmap now has a bounded evidence-first step: deterministic public-evidence discussion cues, then evaluate real UX evidence before considering generative language. This preserves core/full-game safety and avoids adding provider cost/privacy/latency complexity without demonstrated product value.

## الأولوية الدقيقة للجلسة التالية
Resolve CI/Game QA for this latest handoff first. If Green and authorized exact-SHA `Vercel Release Package` dispatch has become available, execute the guarded release/live-smoke objective. If dispatch is still unavailable, implement exactly one **deterministic AI discussion-cues vertical slice**: public-context-only cue derivation, Egyptian-Arabic bot lines in the room discussion UX, stable refresh/reconnect behavior, no eliminated-bot speaking, automated privacy/determinism/UI regressions, and docs. Do not add an LLM/provider, new player-count support, or unrelated gameplay in that session.
