# Curated Story Fairness Review — 4–10 Players

Date: 2026-09-13
Scope: all 21 curated cases currently shipped for exact player counts 4–10.

This is the semantic/human review layer that complements `scripts/qa/story-critic.mjs`. The automated critic checks lexical role-distribution and final-role reconnection; this review judges whether the story logic leaves plausible alternatives alive, escalates clues fairly, separates independent mafia acts, and reads naturally in spoken Egyptian Arabic.

## Review rubric

A case passes when:
- rounds 1–3 preserve at least one plausible non-mafia explanation for important evidence;
- no single early clue functionally solves the case;
- the final clue narrows strongly but makes sense only when connected to earlier opportunity/motive/evidence;
- every mafia role has a coherent action, motive, and evidence chain;
- red herrings have a real innocent explanation rather than random noise;
- wording is natural enough to read aloud during a social game;
- multi-mafia cases clearly separate independent acts instead of pretending unrelated evidence is one conspiracy.

## Case-by-case matrix

| Players | Case | Mafia role(s) | R1–R3 alternatives / final-clue function | Review |
| ---: | --- | --- | --- | --- |
| 4 | `last-tray` — آخر صينية | الحلويات | shared serving access stays ambiguous; final timing connects the serving box to drawer knowledge | PASS |
| 4 | `balcony-key` — مفتاح البلكونة | تهوية البلكونة | tea/music/seating explain contact; final location only works with earlier curtain/plate timing | PASS |
| 4 | `soundcheck-ticket` — تذكرة الساوند تشيك | الصوت | backstage access and silver tape are shared; accidental video resolves only after opportunity evidence | PASS |
| 5 | `clock-1117` — الساعة 11:17 | الديكور | sound/photo share power access; final camera-power evidence still needs safe-code/opportunity chain | PASS |
| 5 | `room-312` — مفتاح 312 | تصوير الرحلة | balcony/service-route alternatives remain live; recovered clip resolves after key evidence | PASS |
| 5 | `family-fridge` — ورقة التلاجة | تنظيم السفر | kitchen movement and paper/magnet traces are shared; later photo needs prior knowledge + timing | PASS |
| 6 | `last-rehearsal` — آخر بروفة | الإضاءة + الرعاة | stage-access alternatives survive; final records separate sensor disabling from later removal | PASS |
| 6 | `blue-notebook` — الكراسة الزرقا | التسويق + التقنية والطباعة | accounts/design/investor roles remain plausible; filename/account evidence separates two acts | PASS |
| 6 | `birthday-envelope` — ظرف عيد الميلاد | تجهيز الزينة + تنظيم المفاجأة | shared kitchen/side-room movement stays plausible; photo and guest video independently resolve key-copy and theft windows | PASS |
| 7 | `fourth-floor` — الدور الرابع مقفول | الصيانة + تاريخ الفندق | event/photo and hospitality/check-in compete across two windows; final logs separate preparation from theft | PASS |
| 7 | `silent-auction` — المزاد الصامت | ترميم اللوحات + تمثيل المشتري | gallery/photo and auction/security retain access explanations; final residue/template evidence separates acts | PASS |
| 7 | `beach-house-key` — مفتاح بيت المصيف | توزيع المصاريف + حجز العربية | shared travel movement and note-paper remain ambiguous; independent photo/call evidence resolves card swap and key removal | PASS |
| 8 | `rooftop-envelope` — ظرف السطح | إدارة الفندق + الصوت | office-corridor/key/tool access is shared; key checkout + power log resolve independent acts | PASS |
| 8 | `backstage-pass` — تصريح الكواليس | إدارة الكواليس + تسجيل النتائج | corridor and score-sheet access have innocent alternatives; drawer timing + print account resolve two acts | PASS |
| 8 | `invoice-stamp` — ختم الفاتورة | المراجعة القانونية + إدارة الموردين | paper/clip traces and office movement are deliberately shared; cabinet log identifies removal, printer log independently identifies the replacement copy | PASS |
| 9 | `gallery-ledger` — دفتر المعرض | التنسيق الفني + الحسابات | office/card-material alternatives remain; checkout + two-file exit separate label swap from ledger removal | PASS |
| 9 | `garden-locker` — دولاب الجنينة | إدارة النادي + الاستقبال | key/log and replacement-box access stay ambiguous; final pen-log and visit order assign independent acts | PASS |
| 9 | `expense-ledger` — دفتر المصروفات | المراجعة الداخلية + إدارة الجمعية | ruler/paper traces are non-exclusive and several roles handle the records; camera removal and printer record independently resolve page removal and receipt substitution | PASS |
| 10 | `midnight-menu` — منيو نص الليل | إدارة المطعم + الحسابات + الدعم التقني | office/printer/reservation access stays broad; final camera evidence plus door/printer logs separate three acts | PASS |
| 10 | `archive-seal` — ختم الأرشيف | تسجيل الاستلام + الشؤون القانونية + إدارة المشروع | original/copy/seal access has several innocent explanations; camera + e-pen + printer logs separate three acts | PASS |
| 10 | `villa-guest-list` — قائمة ضيوف الفيلا | تنسيق الموسيقى + تنظيم العيلة + متابعة الدعوات | drawer/marker/list access is shared across normal party prep; final camera, saved seating copy, and hall footage independently resolve card, seating sheet, and guest-list acts | PASS |

## 2026-09-13 launch-breadth completion — 8–10 players

The checkpoint identified exactly one missing reviewed theme pack at each remaining count: 8 lacked `work-records`, 9 lacked `work-records`, and 10 lacked `home-social`. The coherent slice adds one case to each count and completes three exact-count cases for every supported count 4–10.

### `invoice-stamp` — 8 players / work-records
- rounds 1–3 preserve alternatives through normal cabinet, paper, clip, printing, and supplier-file handling;
- the two mafia acts are independent: removal of the original invoice and later insertion of a deficient replacement;
- the final cabinet and printer logs resolve different actors at different times rather than implying a conspiracy;
- spoken wording is office-Egyptian and deduction depends on timing, not jargon.

### `expense-ledger` — 9 players / work-records
- the ruler edge, copied receipt paper, and record access all have legitimate innocent explanations;
- page removal and receipt substitution are separate actions with separate motives;
- the final office camera and printer record reconnect both semantic roles explicitly while preserving earlier ambiguity;
- the story asks players to separate evidence sources rather than decode obscure wording.

### `villa-guest-list` — 10 players / home-social
- normal party setup gives multiple innocent roles access to the office, seating sheet, guest list, and shared marker;
- the three mafia acts are deliberately independent: taking an access card, changing a seating sheet, and hiding the original guest list;
- final evidence uses three independent sources and timestamps so the larger case does not collapse into one oversized conspiracy;
- language is domestic/social Egyptian Arabic and all visible identities remain real player nicknames at runtime.

## Deterministic regression baseline

`story-critic.mjs` fails QA when either of these conditions is true:
1. a pre-final clue explicitly mentions mafia role(s) but no explicit non-mafia role alternative;
2. the final clue fails to reconnect every mafia role to the evidence chain.

It also scores jargon/stiff phrasing, clue density, and bio density. Lexical checks remain intentionally narrower than semantic judgment.

`curated-player-count-contract.mjs` now protects the completed launch library:
- exactly three curated cases for every supported exact count 4–10;
- 6–10 must span all three reviewed theme packs, while 4–5 retain at least two packs each;
- catalog and server registry must agree and each registered file must exist;
- browsing/reference selection remains exact-count-first with no fallback to unrelated counts;
- 11–12 remain unadvertised until their own gameplay/UX/E2E slice exists.

## Review conclusion

All 21 curated cases pass the current 4–10-player semantic/fairness review. Every supported exact count now has three reviewed cases; counts 6–10 cover all three theme packs, while 4–5 already have meaningful pack choice. The new cases do not change nickname identity, gender wording-only behavior, mafia assignment rules, or supported player-count semantics.

The 4–10 curated breadth milestone is therefore content-complete at the current target. Future story work should be triggered by a material rewrite, regression signal, or evidence-backed launch need—not by hourly churn. Expansion to 11–15 remains deferred until gameplay/UX and release evidence justify it.
