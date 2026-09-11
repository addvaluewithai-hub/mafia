# Akher Kheit — Production Release Runbook

Production web is currently served from Vercel at `https://akher-kheit.vercel.app`. Supabase is the production multiplayer/database backend. EAS configuration remains in the repository for Expo-related workflows, but it is **not** the authoritative production web release path.

## Release invariant

A production release candidate is an exact 40-character Git commit SHA from `main`. Do not package or deploy a moving branch name.

Before any production write or Vercel deployment, the same SHA must have:

1. GitHub check `validate` completed with `success`.
2. GitHub check `qa` completed with `success`.
3. Production Supabase migration history exactly matching `supabase/migrations/` in that SHA.
4. A successful read-only release preflight.
5. An explicit `deploy-safe` statement in `docs/qa/CONTINUOUS-QA.md` for the exact change being released.

The preflight never applies migrations and never deploys anything.

## GitHub secret required

The `Vercel Release Package` workflow requires `SUPABASE_PRODUCTION_DB_URL` as a GitHub Actions secret. It must be a production PostgreSQL connection string whose credentials are permitted to read `supabase_migrations.schema_migrations`. The preflight issues only a `SELECT` against migration history.

Do not put the connection string in repository files, workflow inputs, logs, or `EXPO_PUBLIC_*` variables.

## Guarded release package

1. Confirm the candidate SHA is on `main` and its `validate` and `qa` checks are Green.
2. Run GitHub Actions → `Vercel Release Package` → `Run workflow`.
3. Paste the full candidate SHA into `release_sha`.
4. The workflow checks out that exact SHA, runs `scripts/release/preflight.mjs`, and stops immediately if either required check is not Green or migration history differs.
5. Only after preflight passes does it create `vercel-source-<short-sha>` containing `vercel-source.zip` and `release-manifest.txt`.
6. Use that exact artifact as the source for the existing Vercel `akher-kheit` project. Do not rebuild from a later `main` tip or an unpinned branch.
7. After deployment, record deployment ID, stable alias result, live smoke evidence, and deploy-safety outcome in `docs/qa/CONTINUOUS-QA.md`.

Until Vercel Git integration is intentionally configured and verified, the guarded exact-SHA artifact is the canonical repository-controlled production web path.

## Local/operator preflight

From the candidate checkout:

```bash
export RELEASE_SHA=<40-char-sha>
export GITHUB_REPOSITORY=addvaluewithai-hub/mafia
export GITHUB_TOKEN=<token-with-checks-read>
export SUPABASE_PRODUCTION_DB_URL=<production-read-connection-string>
node scripts/release/preflight.mjs
```

Expected success output states that `validate` and `qa` are Green for the exact SHA and reports the number of migrations matching production.

Any missing production migration, unexpected production migration, missing check, pending check, or failed check is a hard stop. Investigate and update the handoff; do not bypass the preflight and do not rewrite tests to obtain a release.

## Production migration changes

This runbook intentionally does not automate migration application. If a release contains a new migration, parity preflight is expected to fail before production is changed. Migration application remains a separate, explicit production operation governed by `docs/qa/QA-OPERATING-MODE.md` and the current handoff. After an approved migration is applied, rerun the same preflight before packaging/deploying web source.
