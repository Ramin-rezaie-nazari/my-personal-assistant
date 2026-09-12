import { addWater, createReminder, createWorkout } from './api';
import { getStoredLocale } from './i18n';

export type CommandActionResult = {
  ok: boolean;
  message: string;
};

export async function runQuickCommand(action: 'water' | 'walk' | 'strength' | 'reminder'): Promise<CommandActionResult> {
  const locale = await getStoredLocale();
  const fa = locale === 'fa';
  switch (action) {
    case 'water':
      await addWater(500);
      return { ok: true, message: fa ? '۵۰۰ میلی‌لیتر آب ثبت شد.' : '500 ml water logged.' };
    case 'walk':
      await createWorkout({ name: '20 min walk', type: 'cardio', durationMinutes: 20, caloriesBurned: 100 });
      return { ok: true, message: fa ? 'پیاده‌روی ۲۰ دقیقه‌ای ثبت شد.' : '20 min walk logged.' };
    case 'strength':
      await createWorkout({ name: '45 min strength', type: 'strength', durationMinutes: 45, caloriesBurned: 300 });
      return { ok: true, message: fa ? 'تمرین قدرتی ۴۵ دقیقه‌ای ثبت شد.' : '45 min strength workout logged.' };
    case 'reminder':
      await createReminder({ title: 'Check in with My Personal Assistant', type: 'assistant', time: '20:00' });
      return { ok: true, message: fa ? 'یادآور برای ساعت ۲۰:۰۰ ساخته شد.' : 'Reminder created for 20:00.' };
  }
}
