# آخر خيط — Akher Kheit

لعبة تحقيق اجتماعية للعائلة والأصدقاء. الـBoss يعمل روم ويشارك رابطًا واحدًا، وكل لاعب يدخل باسمه. التطبيق يوزع الأدوار سرًا، يولّد قضية جديدة بالـAI، يكشف الأدلة جولة بجولة، ويدير التصويت والسجن والنهاية.

## الموجود في النسخة الأولى

- Expo SDK 57: Web + Android + iOS من نفس الكود.
- روم بكود 6 حروف ورابط قابل للمشاركة.
- Boss خارج عدد المشتبه فيهم.
- من 4 إلى 12 لاعبًا.
- توزيع سري `Mafia / Innocent` فقط؛ كل باقي معلومات الشخصية علنية.
- عدد المافيا تلقائي: 1 للـ4–5، 2 للـ6–9، 3 للـ10–12.
- 4 جولات أدلة، تصويت حي، كشف دور المسجون، وحسم الفائز.
- Supabase Anonymous Auth + RLS حتى لا يرى اللاعب أدوار الآخرين أو الأدلة المستقبلية.
- Supabase Realtime لتحديث كل الموبايلات فورًا.
- Gemini route server-side: المفتاح لا يصل للموبايل.
- Model fallback عبر `GEMINI_MODELS`؛ الافتراضي:
  - `gemini-3.5-flash-lite`
  - `gemini-3.1-flash-lite`
- الـAI يولّد القضية مرة واحدة فقط عند بداية الروم ثم تُحفظ في قاعدة البيانات لكل اللاعبين.

## 1) تثبيت المشروع

```bash
npm install
cp .env.example .env
```

## 2) إعداد Supabase

أنشئ مشروع Supabase جديدًا خاصًا باللعبة، ثم:

1. فعّل **Anonymous Sign-Ins** من Authentication settings.
2. شغّل migration الموجود في:

```text
supabase/migrations/20260809180000_initial_game.sql
```

3. ضع Project URL وPublishable Key في `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

> لا تستخدم service-role key في التطبيق. التصميم الحالي لا يحتاجه أصلًا.

## 3) Gemini

ضع مفتاح Gemini على السيرفر فقط:

```env
GEMINI_API_KEY=...
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite
```

يمكن إضافة موديلات أخرى إلى القائمة مفصولة بفواصل. الـroute يجربها بالترتيب إلى أن يحصل على قضية JSON صحيحة.

## 4) التشغيل

للـExpo Go / التطبيق:

```bash
npm run start
```

لتشغيل Web + API routes محليًا:

```bash
npm run web
```

على Native، بعد نشر نسخة الويب/السيرفر، ضع:

```env
EXPO_PUBLIC_API_BASE_URL=https://YOUR_DEPLOYED_DOMAIN
EXPO_PUBLIC_APP_URL=https://YOUR_DEPLOYED_DOMAIN
```

`EXPO_PUBLIC_APP_URL` هو الرابط الذي سيُشارك مع اللاعبين مثل:

```text
https://your-domain.com/room/A1B2C3
```

## منطق الـAI

الـprompt يفرض قواعد حتى لا تكون الأدلة فاضحة:

- أول دليل يورّط 3 شخصيات على الأقل.
- لا يوجد دليل واحد يحدد مافيوزو وحده.
- أدلة مضللة صحيحة للأبرياء.
- الدليل الرابع يصبح قويًا فقط عند ربطه بما سبقه.
- المافيوزو لا يعرفون بعضهم داخل القصة.
- الشخصيات ومعلوماتها كلها علنية؛ السر الوحيد هو الدور.
- الحل النهائي يفسر الجريمة والأدلة المضللة خطوة بخطوة.

## هيكل المشروع

```text
app/
  index.tsx                 الصفحة الرئيسية
  create.tsx                إنشاء روم
  join.tsx                  دخول بكود
  room/[code].tsx           اللوبي + اللعبة + التصويت
  api/generate-case+api.ts  Gemini server route
components/
  game-ui.tsx
lib/
  game.ts
  supabase.ts
  theme.ts
  types.ts
supabase/migrations/
  20260809180000_initial_game.sql
```

## الخطوة التالية

النسخة الحالية هي Core Multiplayer MVP. بعد توصيل Supabase وتشغيلها، أفضل إضافات المرحلة الثانية:

- Timer للجولات والتصويت.
- مؤثرات صوتية وهزات أقوى عند كشف الدور.
- أنواع قضايا وثيمات جاهزة.
- إعادة مباراة بنفس الروم.
- Achievements وإحصائيات.
- QR للروم.
- وضع Offline على موبايل واحد.
- Moderation/Turnstile قبل فتح اللعبة للعامة.
- Android production build ونشر Google Play.
