# Curated Story Fairness Review — 4–10 Players

Date: 2026-09-11
Scope: all 14 curated cases currently shipped for exact player counts 4–10.

This is the semantic/human review layer that complements `scripts/qa/story-critic.mjs`. The script can prove lexical role-distribution properties; this review judges whether the actual story logic leaves plausible alternatives alive, escalates clues fairly, and reads naturally in spoken Egyptian Arabic.

## Review rubric

A case passes when:
- rounds 1–3 preserve at least one plausible non-mafia explanation for the important evidence;
- no single early clue functionally solves the case;
- the final clue can narrow strongly, but still makes sense only when connected to earlier opportunity/motive/evidence;
- every mafia role has a coherent action, motive, and evidence chain;
- red herrings have a real innocent explanation rather than random noise;
- wording is natural enough to read aloud during a social game;
- multi-mafia cases clearly separate independent acts instead of pretending unrelated evidence is one conspiracy.

## Case-by-case matrix

| Players | Case | Mafia role(s) | R1–R3 plausible alternatives | Final-clue function | Review |
| ---: | --- | --- | --- | --- | --- |
| 4 | `last-tray` — آخر صينية | الحلويات | ترتيب السفرة، التصوير، المشروبات all retain legitimate access/evidence explanations | ties the serving box to timing; still needs drawer knowledge + distraction + shared traces | PASS |
| 4 | `balcony-key` — مفتاح البلكونة | تهوية البلكونة | الشاي والقهوة، الموسيقى، ترتيب القعدة all have physical contact explanations | locates the key near the balcony; prior curtain/plate timing is still needed | PASS |
| 5 | `clock-1117` — الساعة 11:17 | الديكور | الصوت والتصوير can touch power; gift coordination and house knowledge preserve code/access alternatives | CAM-UPS sticker identifies camera-power manipulation; theft conclusion still requires safe-code/opportunity chain | PASS |
| 5 | `room-312` — مفتاح 312 | تصوير الرحلة | العرض والفيديو، التورتة والهدايا، الحجز والاستقبال retain balcony/service-route explanations | recovered accidental clip links the same device to the crossing; earlier key/service evidence completes the case | PASS |
| 6 | `last-rehearsal` — آخر بروفة | الإضاءة + الرعاة | إدارة الخشبة/الإكسسوارات compete for stage-one access; التمثيل/المكياج compete for stage-two movement | final records separate sensor disabling from later removal | PASS |
| 6 | `blue-notebook` — الكراسة الزرقا | التسويق + التقنية والطباعة | الحسابات، تصميم العرض، تنسيق المستثمرين remain plausible around notebook/printing paths | separate filename/account evidence resolves two independent acts | PASS |
| 7 | `fourth-floor` — الدور الرابع مقفول | الصيانة + تاريخ الفندق | تنظيم الفعالية/التصوير compete in first window; الضيافة/تسجيل الدخول compete in second | key log + corridor permit separate preparation from opportunistic theft | PASS |
| 7 | `silent-auction` — المزاد الصامت | ترميم اللوحات + تمثيل المشتري | إدارة الجاليري/التصوير compete for careful opening; مساعدة المزاد/الأمن compete for fast-access window | adhesive/template versus file residue cleanly separates fabrication and final swap | PASS |
| 8 | `rooftop-envelope` — ظرف السطح | إدارة الفندق + الصوت | تنظيم الحفلة/الضيافة compete for office corridor; الديكور and others share key/tool evidence | key checkout + sound power log explain two overlapping but independent actions | PASS |
| 8 | `backstage-pass` — تصريح الكواليس | إدارة الكواليس + تسجيل النتائج | تنسيق العرض/الإضاءة/الصوت compete for corridor; لجنة التحكيم compete around score sheets | pass-drawer timing + print-account evidence resolves the two acts | PASS |
| 9 | `gallery-ledger` — دفتر المعرض | التنسيق الفني + الحسابات | إدارة المعرض/المبيعات/المخزن compete around office; العلاقات العامة/mخزن compete around card materials | card checkout + two-file office exit separate label swap from ledger removal | PASS |
| 9 | `garden-locker` — دولاب الجنينة | إدارة النادي + الاستقبال | الصيانة/تنظيم اليوم compete for key/log; المخزن/الأنشطة/الضيافة compete for replacement box | **fixed in this review**: pen-log evidence now assigns the log edit to إدارة النادي; visit order assigns the replacement to الاستقبال | PASS AFTER FIX |
| 10 | `midnight-menu` — منيو نص الليل | إدارة المطعم + الحسابات + الدعم التقني | الحجوزات/الصالة/التصوير compete around office; المطبخ/المخزن compete around printer; shared purple-mark evidence keeps reservation path ambiguous | **fixed in this review**: final camera evidence now links the reviewed reservation sheet to الحسابات, while door/printer logs separate all three acts | PASS AFTER FIX |
| 10 | `archive-seal` — ختم الأرشيف | تسجيل الاستلام + الشؤون القانونية + إدارة المشروع | إدارة الأرشيف/الحسابات compete for original access; التصوير/المراجعة/mراسلات provide copy/seal alternatives | door camera + e-pen record + office printer cleanly separate three acts | PASS |

## Defects found and corrected

### 1. `garden-locker`: unresolved log-tamper actor
Before this review, the crime explicitly included changing the key log, but the final evidence only said the log changed after the visits. The solution named two mafia roles without assigning the log edit to either one with evidence. That left one crime component semantically unproven.

Fix:
- final clue now records إدارة النادي returning to the desk at 5:21 and changing the key-out time;
- solution explicitly assigns theft + log cover-up to إدارة النادي and the later replacement-box act to الاستقبال.

### 2. `midnight-menu`: weak reservation-sheet motive/evidence for accounts
Before this review, الحسابات was a mafia role that replaced the reservation sheet, but its bio focused on menu margin disagreement and the clues did not clearly connect it to that reservation sheet. The final conclusion was therefore stronger than the evidence chain.

Fix:
- الحسابات now has a concrete relationship to the unauthorized large-group discount;
- round 2 adds a deliberately non-exclusive purple review mark shared by multiple roles;
- round 3 keeps multiple reservation/printer alternatives alive;
- final clue shows the marked reservation sheet inside the accounts file, giving the final deduction a direct but appropriately late anchor.

## Deterministic regression added

`story-critic.mjs` now fails QA when either of these conditions is true:
1. a pre-final clue explicitly mentions mafia role(s) but no explicit non-mafia role alternative;
2. the final clue fails to reconnect every mafia role to the evidence chain.

This is intentionally narrower than semantic judgment. It does not claim that lexical mentions prove guilt or innocence; it only prevents a common unfair structure from silently returning while the human review remains the source for motive/plausibility/escalation quality.

## Review conclusion

All 14 curated cases are acceptable for the current 4–10-player library after the two fixes above. The larger 8–10-player cases use multiple independent acts rather than one oversized conspiracy, which keeps mafia counts compatible with the game while making the evidence separable. No player-count expansion beyond 10 is justified by this review.

The next story-quality review should be triggered by a material content rewrite, a new curated case, or a regression signal—not by a fixed hourly cadence.
