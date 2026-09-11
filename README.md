# آخر خيط — Akher Kheit

لعبة تحقيق اجتماعية للعائلة والأصدقاء. الـBoss لاعب كامل داخل الروم، وكل لاعب يدخل بـnickname ظاهر. التطبيق يوزع الأدوار السرية، يثبت قضية curated أو يولد قضية بالـAI، يكشف الأدلة جولة بجولة، ويدير التصويت والإقصاء والفائز.

## Production architecture

```text
Players / Boss
      |
      v
Expo Router web app on Vercel
  - Web UI
  - /api/generate-case server route
  - Gemini API key stays server-side
      |
      +------> Gemini API
      |
      v
Supabase
  - Anonymous Auth
  - Rooms / players / roles
  - Realtime events
  - Votes / eliminations
  - Case storage
```

Production web: `https://akher-kheit.vercel.app`.

Supabase لا يشغّل الـAI في production architecture؛ هو multiplayer/database backend. توليد القضية يتم في server API route.

## Current product state

- Expo SDK 57: Web + Android + iOS من نفس الكود.
- Boss لاعب كامل ويحتفظ بصلاحيات الإدارة المطلوبة حتى لو تم إقصاؤه.
- Core/full-game automated coverage للـ4–10 لاعبين: create → join → case/roles → clues → voting/ties → elimination → reconnect → next round → winner.
- curated cases مغطاة للـ4–10؛ 11–12 AI-generated only حاليًا، و13–15 ليست launch target حاليًا.
- nickname هو الهوية الظاهرة؛ gender للصياغة فقط ولا يدخل في mafia assignment أو win probability.
- Supabase Anonymous Auth + RLS + server-authoritative gameplay RPCs.
- Gemini server route في `app/api/generate-case+api.ts`.
- Solo/AI Players MVP: Human Boss + 3 server-side bots مع نفس role/vote/round lifecycle.
- abuse guards موجودة لتوليد القضايا وإنشاء/دخول الرومات؛ public-launch perimeter ضد anonymous identity churn ما زال roadmap item منفصلًا.

## Environment variables

Public client values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bwxgzcppxdrfcaorobpm.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
EXPO_PUBLIC_APP_URL=https://akher-kheit.vercel.app
EXPO_PUBLIC_API_BASE_URL=https://akher-kheit.vercel.app
```

Server-only Gemini values:

```env
GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-31b-it,gemma-4-26b-a4b-it
```

Never prefix `GEMINI_API_KEY` with `EXPO_PUBLIC_`.

## Local development

Create `.env` from `.env.example`, then:

```bash
npm install
npx expo start
```

For testing the web server + API route:

```bash
npx expo export --platform web
npx expo serve
```

## Production release safety

Vercel is the authoritative production web path. EAS files remain for Expo-related workflows but are not the current production web release mechanism.

Every production candidate is pinned to one full commit SHA. Before packaging or deploying it, the repository preflight requires the `validate` and `qa` checks for that exact SHA to be completed/success and compares production Supabase migration history with `supabase/migrations/` using a read-only query.

Runbook: `docs/operations/RELEASE-RUNBOOK.md`.

Guarded GitHub workflow: `.github/workflows/package-vercel-source.yml` (`Vercel Release Package`). It packages source only after the read-only preflight passes. Production migrations and deployment remain explicit operations and must also satisfy the deploy-safety gate in `docs/qa/CONTINUOUS-QA.md`.

## Main files

```text
app/
  index.tsx
  create.tsx
  join.tsx
  solo.tsx
  room/[code].tsx
  api/generate-case+api.ts
components/
lib/
scripts/qa/
scripts/release/preflight.mjs
supabase/migrations/
docs/qa/
docs/operations/RELEASE-RUNBOOK.md
.github/workflows/
```

## QA source of truth

Before autonomous QA/product work, read in order:

1. `AGENTS.md`
2. `docs/qa/QA-OPERATING-MODE.md`
3. `docs/qa/CONTINUOUS-QA.md`
4. latest `main` commits and checks

Do not infer production parity from an older session; verify it before a release.
