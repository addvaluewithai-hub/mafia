# Legacy DB Identity Compatibility Audit — 2026-09-11

## Scope
Audit `character_name` / `character_bio` from schema → install RPC → room snapshot → TypeScript → UI/tests. This is an audit and compatibility hardening slice, not a production migration.

## Findings

### `character_name` — compatibility-only
- Originates in the initial `players` schema as nullable legacy fictional identity storage.
- Current `install_case` still accepts an optional legacy `name` and writes it when present.
- `room_snapshot` still returns it as `characterName`, and `PlayerState` still models it.
- Current PlayerCard deliberately does **not** render `characterName`; nickname is the visible identity and `caseRole` is the semantic story role.
- Current curated/AI identity contracts no longer require fictional names.

**Classification:** compatibility-only. It is not required for current player identity UX, but removing it from DB/snapshot now could break old persisted rooms or unknown production data.

### `character_bio` — runtime-required
- Current gender-aware `install_case` resolves `bioByGender`/`bio` and persists the selected result to `players.character_bio`.
- `room_snapshot` exposes it as `characterBio`.
- `PlayerState` models it and PlayerCard renders it as descriptive story context.

**Classification:** runtime-required under the current contract. It must not be dropped or stopped from snapshotting until a replacement field/contract is implemented end-to-end.

### Canonical identity contract
- `nickname` is the only visible player identity.
- `case_role` is the semantic in-story role attached to that real nickname.
- gender only selects wording variants and must not affect mafia assignment.
- `character_name` is never a second identity in the UI.

## Migration-safe recommendation
1. Do **not** drop either legacy DB column while Production DB parity is unknown/inactive.
2. Keep `character_name` as a compatibility bridge only; do not add new product behavior depending on it.
3. Keep `character_bio` runtime-active until a deliberately named replacement (for example a case-description field) is introduced through schema + install RPC + snapshot + types + UI + E2E in one future vertical slice.
4. Before any destructive migration, perform read-only production parity/data inspection for non-null legacy values and old live rooms, then document rollback/backfill strategy.
5. Only after that evidence is Green should a future migration remove `character_name`; `character_bio` removal requires a replacement contract first.

## Regression guard
`scripts/qa/legacy-identity-contract.mjs` codifies the current boundary:
- legacy `characterName` remains available for compatibility but cannot render as player identity;
- `characterBio` remains install/snapshot/UI-required;
- nickname remains visible identity and `case_role` remains the semantic story role.

## Production safety
No production deployment, restore, data mutation, or migration was performed in this audit. Production parity remains a separate blocker.
