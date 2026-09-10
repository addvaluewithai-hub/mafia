# Production DB parity audit — 2026-09-10

Scope: read-only audit. No migration, restore, deploy, schema mutation, or production data write was performed.

Repository baseline contains six ordered migrations through `20260910083000_server_authoritative_vote_phase.sql`.

The handoff-target commit `6cab1c56de726ddf0f97059d35883a0d046fb807` has both `validate` and `qa` completed successfully, closing the eliminated-Boss admin P0 regression.

The connected Supabase project named `mafia` was observed as `INACTIVE`. A read-only query against `supabase_migrations.schema_migrations` was attempted and failed with a connection timeout. Because the project was inactive, this session did not restore it automatically.

Therefore production migration parity is not proven yet. In particular, this audit could not verify whether the latest case-mode sync and server-authoritative vote-phase migrations are recorded/applied in production, nor whether production `room_snapshot` exposes the expected `phase` and `canVote` contract.

Next safe action: retry the read-only parity audit only when production is already active or there is explicit authorization to restore it. Then compare migration history and relevant function/schema definitions before proposing any migration or smoke test.

Until then, the next independent QA priority is P1 Player Identity: design `gender` + `caseRole` schema with regression tests before UI or story rewrites.
