# آخر خيط — Akher Kheit

لعبة تحقيق اجتماعية للعائلة والأصدقاء. الـBoss يعمل روم ويشارك رابطًا واحدًا، وكل لاعب يدخل باسمه. التطبيق يوزع الأدوار سرًا، يولّد قضية جديدة بالـAI، يكشف الأدلة جولة بجولة، ويدير التصويت والسجن والنهاية.

## Architecture

```text
Players / Boss
      |
      v
Expo Router app on EAS Hosting
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
  - Generated case storage
```

**Supabase لا يشغّل الـAI في الـproduction architecture.** هو فقط multiplayer backend والداتا. توليد القضية يتم في Expo API Route على السيرفر.

## الموجود في النسخة الأولى

- Expo SDK 57: Web + Android + iOS من نفس الكود.
- روم بكود 6 حروف ورابط قابل للمشاركة.
- Boss خارج عدد المشتبه فيهم.
- من 4 إلى 12 لاعبًا.
- توزيع سري `Mafia / Innocent` فقط؛ كل باقي معلومات الشخصية علنية.
- عدد المافيا تلقائي: 1 للـ4–5، 2 للـ6–9، 3 للـ10–12.
- 4 جولات أدلة، تصويت حي، كشف دور المسجون، وحسم الفائز.
- Supabase Anonymous Auth + RLS.
- Supabase Realtime لتحديث كل الأجهزة.
- Gemini server route في `app/api/generate-case+api.ts`.
- الـAI يولّد القضية مرة واحدة فقط عند بداية الروم ثم تُحفظ للجميع.

## Environment variables

Public client values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bwxgzcppxdrfcaorobpm.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Server-only Gemini values:

```env
GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-31b-it,gemma-4-26b-a4b-it
```

After the first production web deployment also set:

```env
EXPO_PUBLIC_APP_URL=https://YOUR_APP.expo.app
EXPO_PUBLIC_API_BASE_URL=https://YOUR_APP.expo.app
```

Never prefix `GEMINI_API_KEY` with `EXPO_PUBLIC_`.

## First deployment to EAS Hosting

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init
```

Add the environment variables above to the EAS `production` environment, then:

```bash
npm run export:web
npx eas-cli@latest deploy --prod
```

The first deploy gives the production `*.expo.app` URL. Put that URL in `EXPO_PUBLIC_APP_URL` and `EXPO_PUBLIC_API_BASE_URL`, then deploy once more.

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

## AI rules

The prompt requires:

- The first clue implicates at least three characters.
- No single clue identifies a mafia player on its own.
- Innocent characters have genuine misleading details.
- The fourth clue only becomes strong when connected to previous clues.
- Mafia players do not know each other in the story.
- All character information is public; only the role is private.
- The final solution explains both the crime and the red herrings.

## Main files

```text
app/
  index.tsx
  create.tsx
  join.tsx
  room/[code].tsx
  api/generate-case+api.ts
components/
  game-ui.tsx
lib/
  game.ts
  supabase.ts
  theme.ts
  types.ts
supabase/migrations/
  20260809180000_initial_game.sql
.eas/workflows/
  deploy.yml
```

## Next

After the first live multiplayer test:

- Timer for discussion/voting.
- QR room join.
- Rematch in the same room.
- Better animations, sounds and haptics.
- Case packs and custom themes.
- Android production build for Google Play.
- Abuse protection before a public launch.
