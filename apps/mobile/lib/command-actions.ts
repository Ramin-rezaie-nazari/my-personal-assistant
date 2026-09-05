import { addWater, createReminder, createWorkout } from './api';
import { getAppLocale, t } from './i18n';

export type CommandActionResult = {
  ok: boolean;
  message: string;
};

export async function runQuickCommand(action: 'water' | 'walk' | 'strength' | 'reminder'): Promise<CommandActionResult> {
  const locale = getAppLocale();

  switch (action) {
    case 'water':
      await addWater(500);
      return { ok: true, message: t(locale, 'commandWaterLogged') };
    case 'walk':
      await createWorkout({ name: '20 min walk', type: 'cardio', durationMinutes: 20, caloriesBurned: 100 });
      return { ok: true, message: t(locale, 'commandWalkLogged') };
    case 'strength':
      await createWorkout({ name: '45 min strength', type: 'strength', durationMinutes: 45, caloriesBurned: 300 });
      return { ok: true, message: t(locale, 'commandStrengthLogged') };
    case 'reminder':
      await createReminder({ title: t(locale, 'commandReminderTitle'), type: 'assistant', time: '20:00' });
      return { ok: true, message: t(locale, 'commandReminderCreated') };
  }
}
