import { addWater, createReminder, createWorkout } from './api';
import { getStoredLocale } from './i18n';

export type CommandActionResult = { ok: boolean; message: string };

const messages = {
  en: { water: '500 ml water logged.', walk: '20 min walk logged.', strength: '45 min strength workout logged.', reminder: 'Reminder created for 20:00.' },
  fa: { water: '۵۰۰ میلی‌لیتر آب ثبت شد.', walk: 'پیاده‌روی ۲۰ دقیقه‌ای ثبت شد.', strength: 'تمرین قدرتی ۴۵ دقیقه‌ای ثبت شد.', reminder: 'یادآوری برای ساعت ۲۰:۰۰ ساخته شد.' },
} as const;

export async function runQuickCommand(action: 'water' | 'walk' | 'strength' | 'reminder'): Promise<CommandActionResult> {
  const locale = (await getStoredLocale()) ?? 'en';
  switch (action) {
    case 'water':
      await addWater(500);
      return { ok: true, message: messages[locale].water };
    case 'walk':
      await createWorkout({ name: '20 min walk', type: 'cardio', durationMinutes: 20, caloriesBurned: 100 });
      return { ok: true, message: messages[locale].walk };
    case 'strength':
      await createWorkout({ name: '45 min strength', type: 'strength', durationMinutes: 45, caloriesBurned: 300 });
      return { ok: true, message: messages[locale].strength };
    case 'reminder':
      await createReminder({ title: 'Check in with My Personal Assistant', type: 'assistant', time: '20:00' });
      return { ok: true, message: messages[locale].reminder };
  }
}
