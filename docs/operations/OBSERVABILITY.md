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

## Failure behavior

Telemetry transport remains non-blocking for gameplay. A failure to send telemetry must never fail create/join/start/vote/resolve or room refresh. Client telemetry calls intentionally swallow telemetry transport failures. The telemetry endpoint itself returns `429` when its installation budget is exhausted and `503` if the server-authoritative guard cannot be checked; both are swallowed by gameplay callers.

Reconnect telemetry is intentionally low-noise: routine successful room snapshots are not emitted. Only a snapshot that recovers after a transient retry emits `recovered`, and a snapshot that ultimately fails emits `error`.

## Operational query shape

Vercel logs contain JSON objects with `type: "akher_kheit.gameplay"`. Filter by that type, then by `release`, `event`, `outcome`, and `errorClass`. Do not add user-entered values to the schema when investigating an incident; add only bounded enumerated operational dimensions and extend the CI privacy contract at the same time.

## Current limitation

The telemetry endpoint is intentionally data-minimal and write-only to application logs; it is not an analytics warehouse. The installation boundary is designed to survive routine anonymous-auth churn, not deliberate storage resets or sophisticated distributed abuse. Stronger controls, if later justified by evidence, should be added without introducing gameplay identity or PII into telemetry.
