export const STORY_PACKS = [
  { id: 'home-social', label: 'لمة وبيت', description: 'قضايا في بيوت ولمّات وأماكن اجتماعية قريبة من الحياة اليومية.' },
  { id: 'stage-events', label: 'مسرح وفعاليات', description: 'كواليس عروض ومزادات وفعاليات فيها حركة وتوقيتات متقاطعة.' },
  { id: 'work-records', label: 'شغل وسجلات', description: 'ألغاز ملفات ومفاتيح وسجلات وأماكن عمل محتاجة ربط أدلة.' },
] as const;

export type StoryPackId = (typeof STORY_PACKS)[number]['id'];

export const STORY_CATALOG = [
  { id: 'last-tray', playerCount: 4, packId: 'home-social', title: 'آخر صينية', teaser: 'ظرف اختفى من درج البوفيه وقت دقيقة زحمة وكل أثر له أكتر من تفسير.' },
  { id: 'balcony-key', playerCount: 4, packId: 'home-social', title: 'مفتاح البلكونة', teaser: 'مفتاح اختفى من طبق في الصالة وظهر له أثر غريب جنب البلكونة.' },
  { id: 'clock-1117', playerCount: 5, packId: 'work-records', title: 'الساعة 11:17', teaser: 'عقد اختفى من خزنة مقفولة وكاميرا فصلت أربع دقايق.' },
  { id: 'room-312', playerCount: 5, packId: 'work-records', title: 'مفتاح 312', teaser: 'ظرف اختفى من أوضة مقفولة مع إن سجل الباب بيقول محدش دخل.' },
  { id: 'last-rehearsal', playerCount: 6, packId: 'stage-events', title: 'آخر بروفة', teaser: 'قطعة نادرة اختفت والأدلة بتقول إن شخصين لعبوا في الحماية.' },
  { id: 'blue-notebook', playerCount: 6, packId: 'work-records', title: 'الكراسة الزرقا', teaser: 'أرقام سرية اتسربت والكراسة الأصلية اختفت في عملية منفصلة.' },
  { id: 'fourth-floor', playerCount: 7, packId: 'work-records', title: 'الدور الرابع مقفول', teaser: 'مظروف اختفى بعد زيارتين قصيرتين والسجل نفسه اتغير.' },
  { id: 'silent-auction', playerCount: 7, packId: 'stage-events', title: 'المزاد الصامت', teaser: 'لوحة اتبدلت بنسخة ممتازة والختم اتفتح بطريقتين مختلفتين.' },
  { id: 'rooftop-envelope', playerCount: 8, packId: 'home-social', title: 'ظرف السطح', teaser: 'عقد اختفى وسط حركة مفاتيح وتصوير وكل توقيت يفتح احتمال مختلف.' },
  { id: 'backstage-pass', playerCount: 8, packId: 'stage-events', title: 'تصريح الكواليس', teaser: 'تصريح اختفى وكشف درجات اتبدل وسط زحمة عرض مسرحي.' },
  { id: 'gallery-ledger', playerCount: 9, packId: 'stage-events', title: 'دفتر المعرض', teaser: 'دفتر مبيعات اختفى وبطاقة لوحة اتبدلت وسط ملفات متشابهة.' },
  { id: 'garden-locker', playerCount: 9, packId: 'home-social', title: 'دولاب الجنينة', teaser: 'صندوق تبرعات اتبدل والسجل نفسه اتعدل بعد زيارتين متتاليتين.' },
  { id: 'midnight-menu', playerCount: 10, packId: 'stage-events', title: 'منيو نص الليل', teaser: 'منيو نهائية اختفت وحجز اتبدل وطابعة اتعطلت في نفس عشر دقايق.' },
  { id: 'archive-seal', playerCount: 10, packId: 'work-records', title: 'ختم الأرشيف', teaser: 'محضر أصلي اختفى والسجل والنسخة البديلة اتحركوا كل واحد في توقيت مختلف.' },
] as const;

export function storiesForPlayerCount(playerCount: number, packId?: StoryPackId | null) {
  return STORY_CATALOG.filter((story) => story.playerCount === playerCount && (!packId || story.packId === packId));
}

export function packsForPlayerCount(playerCount: number) {
  const availablePackIds = new Set(storiesForPlayerCount(playerCount).map((story) => story.packId));
  return STORY_PACKS.filter((pack) => availablePackIds.has(pack.id));
}

export function storyMetadata(id: string) {
  return STORY_CATALOG.find((story) => story.id === id) ?? null;
}
