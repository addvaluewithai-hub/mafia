# Production gameplay observability

Akher Kheit emits structured, privacy-safe telemetry for the critical gameplay paths that are hardest to diagnose from a user report alone.

## Events

The allowlisted event names are:

- `create`
- `join`
- `start`
- `generation`
- `vote`
- `resolve`
- `reconnect`

Each event contains only an outcome (`success`, `error`, or `recovered`), bounded duration, a coarse error class when relevant, an allowlisted non-sensitive detail, and release correlation.

`start` and `generation` are emitted separately even though generation/install is currently part of the same start request. This preserves a stable operational vocabulary if those stages are split later.

## Privacy contract

Telemetry must never contain room codes, room/player IDs, nicknames, session/access tokens, prompts/themes, story titles, clues, generated story text, roles, mafia assignments, or the case solution.

`app/api/telemetry+api.ts` uses a strict schema: unknown fields are rejected rather than stripped, and request bodies larger than 2 KiB are rejected. `scripts/qa/observability-contract.mjs` keeps the event coverage and sensitive-field exclusions under CI.

Errors are reduced to coarse classes (`auth`, `rate_limit`, `network`, `not_found`, `conflict`, `server`, `unknown`). Raw exception messages are not sent to the telemetry sink.

## Anonymous-churn abuse boundary

The public telemetry endpoint also requires the same locally persisted random installation key used by the launch-abuse perimeter. The key travels only in the `X-Abuse-Key` request header and is never included in telemetry JSON or application logs. The database stores only a SHA-256 digest in `public_abuse_rate_limits` and uses it for a bounded telemetry request budget.

This is intentionally a coarse abuse boundary, not product identity or analytics identity. It is unrelated to nickname, gender, room code, player ID, story text, case role, or mafia assignment. Rotating anonymous Supabase auth alone does not reset this budget; clearing application/site storage can rotate the key, so it should not be treated as a fraud-proof device identifier.

## Release correlation

Server logs use `VERCEL_GIT_COMMIT_SHA` when available, with `RELEASE_SHA` as an alternate and `unknown` as a fail-soft value. Client events may include `EXPO_PUBLIC_RELEASE_SHA`; the server records it as `clientRelease` but always replaces the canonical `release` field with the server-side release value.

This makes production logs searchable by deployed SHA without trusting client-supplied release metadata.

## Telemetry-ingest diagnostics

Gameplay telemetry is deliberately non-blocking, which means a broken telemetry transport must not break the game. That also means failures in the telemetry endpoint need their own bounded evidence or they can become operationally invisible.

Rejected/failed telemetry ingestion emits a second structured log type: `akher_kheit.telemetry_ingest`. It is emitted only for ingest failures and contains exactly the operational dimensions needed to diagnose the path:

- `outcome: "error"`
- an allowlisted `reason`: `missing_abuse_key`, `payload_too_large`, `invalid_json`, `invalid_telemetry`, `guard_unavailable`, or `rate_limited`
- HTTP `status`
- server `release`

These diagnostics never include the installation key, request body, room/player identity, user-entered values, raw Supabase guard errors, or other exception text. `scripts/qa/observability-contract.mjs` guards both the reason vocabulary and the logger privacy boundary.

## Failure behavior

Telemetry transport remains non-blocking for gameplay. A failure to send telemetry must never fail create/join/start/vote/resolve or room refresh. Client telemetry calls intentionally swallow telemetry transport failures. The telemetry endpoint itself returns `429` when its installation budget is exhausted and `503` if the server-authoritative guard cannot be checked; both are swallowed by gameplay callers.

Reconnect telemetry is intentionally low-noise: routine successful room snapshots are not emitted. Only a snapshot that recovers after a transient retry emits `recovered`, and a snapshot that ultimately fails emits `error`.

## Operator incident workflow

Use Vercel's log view/export to select the incident window and, whenever possible, the exact deployed SHA. Do not search for or export room codes, nicknames, player IDs, story text, or other user-entered values.

The repository includes a deterministic summary tool for JSONL log exports:

```bash
npm run ops:observability-summary -- --file /path/to/vercel-logs.jsonl --release <40-char-sha>
```

The default mode is failures-only. It groups only allowlisted operational dimensions:

- gameplay: `release`, `event`, `outcome`, `errorClass`, count
- telemetry ingest: `release`, `reason`, HTTP `status`, count

It accepts either the structured telemetry object directly on each JSONL line or common wrappers where the JSON log string is in `message`, `text`, or `msg`. Unknown records and invalid dimensions are ignored rather than echoed.

Use `--all` only when a success/error denominator is needed for the same bounded incident window:

```bash
npm run ops:observability-summary -- --file /path/to/vercel-logs.jsonl --release <40-char-sha> --all
```

The output never reproduces arbitrary input fields, so even a malformed export containing a nickname, room code, installation key, or other unexpected field cannot make that value part of the operator summary. `scripts/qa/observability-operations-contract.mjs` regression-tests this boundary and runs under CI through `qa:observability`.

### Triage order

1. Confirm the exact `release` first. Do not mix releases in one diagnosis when a deployment boundary is known.
2. Check `akher_kheit.telemetry_ingest` failures. A spike in `guard_unavailable` or `rate_limited` means the reporting channel itself is degraded or constrained and gameplay counts may be incomplete.
3. Check gameplay `error` counts by event and `errorClass`. Prioritize `start`, `vote`, `resolve`, and `reconnect` because those can strand a full-game journey.
4. Treat `recovered` reconnects as reliability degradation evidence, not gameplay failure. Compare them against errors only within the same release/window.
5. Correlate any material spike with the exact release checks and release-preflight evidence before considering rollback/deploy action.

Do not create numeric alert thresholds from local/test data. Alerting thresholds require production baseline evidence across multiple real windows so normal traffic variation is not encoded as a false operational contract.

## Operational query shape

For gameplay events, Vercel logs contain JSON objects with `type: "akher_kheit.gameplay"`. Filter by that type, then by `release`, `event`, `outcome`, and `errorClass`.

For telemetry transport incidents, filter on `type: "akher_kheit.telemetry_ingest"`, then by `release`, `reason`, and `status`. This separates "the game operation failed" from "the telemetry channel itself rejected or could not accept the report" without introducing user identity into either stream.

Do not add user-entered values to either schema when investigating an incident; add only bounded enumerated operational dimensions and extend the CI privacy contract at the same time.

## Current limitation

The telemetry endpoint is intentionally data-minimal and write-only to application logs; it is not an analytics warehouse. The operator summary is an incident-analysis helper over exported logs, not a persistent dashboard or alerting system. The installation boundary is designed to survive routine anonymous-auth churn, not deliberate storage resets or sophisticated distributed abuse. Stronger controls or alerting, if later justified by production evidence, should be added without introducing gameplay identity or PII into telemetry.
