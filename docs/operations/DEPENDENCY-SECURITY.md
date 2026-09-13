# Dependency security readiness

Akher Kheit uses a lockfile-backed `npm ci` install and a reviewed production-audit baseline at `qa/reports/npm-audit-baseline.json`.

## Current reviewed baseline

The reviewed baseline contains 13 moderate findings, 0 high, and 0 critical findings. The known findings are concentrated in the Expo / Expo Router transitive dependency graph, including `@expo/*`, `expo`, `expo-router`, `query-string`, `decode-uri-component`, `uuid`, and `xcode`.

`npm audit` currently proposes remediations that would move the app away from the supported Expo 57 stack (for example, suggesting Expo 46 or Expo Router 5). Those suggestions are not treated as deploy-safe fixes. Do not use `npm audit fix --force` or downgrade the Expo runtime only to reduce the audit count.

## CI contract

Run:

```sh
npm run qa:dependencies
```

The contract executes a fresh production-only `npm audit --json` and fails when any of these conditions is true:

- a high or critical vulnerability is present;
- an audited vulnerability name appears that is not in the reviewed baseline;
- the moderate vulnerability count rises above the reviewed baseline.

The command also reports baseline vulnerability names that disappeared, so a compatible upstream remediation is visible immediately and the baseline can then be deliberately tightened.

## Updating the baseline

Only update `qa/reports/npm-audit-baseline.json` after reviewing the actual dependency graph and confirming that the new state is intentional and compatible with the supported Expo/React Native stack.

A baseline update must never be used to hide a new high/critical finding or an unexplained new vulnerability. Prefer a compatible dependency upgrade when Expo Doctor, TypeScript, CI, and Game QA remain Green.

## Release posture

The current moderate-only baseline is launch debt, not proof of zero risk. Production release still requires the repository's guarded exact-SHA release preflight and live-smoke process. Dependency changes that alter Expo, React Native, routing, native modules, or server/runtime packages require the normal CI/Game QA evidence before any deploy-safe claim.
