export const STORY_CATALOG = [
  { id: 'clock-1117', playerCount: 5, title: 'الساعة 11:17', teaser: 'عقد اختفى من خزنة مقفولة وكاميرا فصلت أربع دقايق.' },
  { id: 'room-312', playerCount: 5, title: 'مفتاح 312', teaser: 'ظرف اختفى من أوضة مقفولة مع إن سجل الباب بيقول محدش دخل.' },
  { id: 'last-rehearsal', playerCount: 6, title: 'آخر بروفة', teaser: 'قطعة نادرة اختفت والأدلة بتقول إن شخصين لعبوا في الحماية.' },
  { id: 'blue-notebook', playerCount: 6, title: 'الكراسة الزرقا', teaser: 'أرقام سرية اتسربت والكراسة الأصلية اختفت في عملية منفصلة.' },
  { id: 'fourth-floor', playerCount: 7, title: 'الدور الرابع مقفول', teaser: 'مظروف اختفى بعد زيارتين قصيرتين والسجل نفسه اتغير.' },
  { id: 'silent-auction', playerCount: 7, title: 'المزاد الصامت', teaser: 'لوحة اتبدلت بنسخة ممتازة والختم اتفتح بطريقتين مختلفتين.' },
] as const;

export function storiesForPlayerCount(playerCount: number) {
  return STORY_CATALOG.filter((story) => story.playerCount === playerCount);
}
