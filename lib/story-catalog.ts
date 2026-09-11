export const STORY_CATALOG = [
  { id: 'last-tray', playerCount: 4, title: 'آخر صينية', teaser: 'ظرف اختفى من درج البوفيه وقت دقيقة زحمة وكل أثر له أكتر من تفسير.' },
  { id: 'balcony-key', playerCount: 4, title: 'مفتاح البلكونة', teaser: 'مفتاح اختفى من طبق في الصالة وظهر له أثر غريب جنب البلكونة.' },
  { id: 'clock-1117', playerCount: 5, title: 'الساعة 11:17', teaser: 'عقد اختفى من خزنة مقفولة وكاميرا فصلت أربع دقايق.' },
  { id: 'room-312', playerCount: 5, title: 'مفتاح 312', teaser: 'ظرف اختفى من أوضة مقفولة مع إن سجل الباب بيقول محدش دخل.' },
  { id: 'last-rehearsal', playerCount: 6, title: 'آخر بروفة', teaser: 'قطعة نادرة اختفت والأدلة بتقول إن شخصين لعبوا في الحماية.' },
  { id: 'blue-notebook', playerCount: 6, title: 'الكراسة الزرقا', teaser: 'أرقام سرية اتسربت والكراسة الأصلية اختفت في عملية منفصلة.' },
  { id: 'fourth-floor', playerCount: 7, title: 'الدور الرابع مقفول', teaser: 'مظروف اختفى بعد زيارتين قصيرتين والسجل نفسه اتغير.' },
  { id: 'silent-auction', playerCount: 7, title: 'المزاد الصامت', teaser: 'لوحة اتبدلت بنسخة ممتازة والختم اتفتح بطريقتين مختلفتين.' },
  { id: 'rooftop-envelope', playerCount: 8, title: 'ظرف السطح', teaser: 'عقد اختفى وسط حركة مفاتيح وتصوير وكل توقيت يفتح احتمال مختلف.' },
  { id: 'backstage-pass', playerCount: 8, title: 'تصريح الكواليس', teaser: 'تصريح اختفى وكشف درجات اتبدل وسط زحمة عرض مسرحي.' },
  { id: 'gallery-ledger', playerCount: 9, title: 'دفتر المعرض', teaser: 'دفتر مبيعات اختفى وبطاقة لوحة اتبدلت وسط ملفات متشابهة.' },
  { id: 'garden-locker', playerCount: 9, title: 'دولاب الجنينة', teaser: 'صندوق تبرعات اتبدل والسجل نفسه اتعدل بعد زيارتين متتاليتين.' },
  { id: 'midnight-menu', playerCount: 10, title: 'منيو نص الليل', teaser: 'منيو نهائية اختفت وحجز اتبدل وطابعة اتعطلت في نفس عشر دقايق.' },
  { id: 'archive-seal', playerCount: 10, title: 'ختم الأرشيف', teaser: 'محضر أصلي اختفى والسجل والنسخة البديلة اتحركوا كل واحد في توقيت مختلف.' },
] as const;

export function storiesForPlayerCount(playerCount: number) {
  return STORY_CATALOG.filter((story) => story.playerCount === playerCount);
}
