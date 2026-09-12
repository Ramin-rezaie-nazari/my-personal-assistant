import { addWater, createReminder, createWorkout } from './api';

export type CommandActionResult = {
  ok: boolean;
  message: string;
};

export async function runQuickCommand(action: 'water' | 'walk' | 'strength' | 'reminder'): Promise<CommandActionResult> {
  switch (action) {
    case 'water':
      await addWater(500);
      return { ok: true, message: '500 ml water logged.' };
    case 'walk':
      await createWorkout({ name: '20 min walk', type: 'cardio', durationMinutes: 20, caloriesBurned: 100 });
      return { ok: true, message: '20 min walk logged.' };
    case 'strength':
      await createWorkout({ name: '45 min strength', type: 'strength', durationMinutes: 45, caloriesBurned: 300 });
      return { ok: true, message: '45 min strength workout logged.' };
    case 'reminder':
      await createReminder({ title: 'Check in with My Personal Assistant', type: 'assistant', time: '20:00' });
      return { ok: true, message: 'Reminder created for 20:00.' };
  }
}
