// Registration contract for PersonalBrain action adapters.
// Runtime wiring is owned by PersonalBrainModule.
export const PERSONAL_BRAIN_ADAPTERS = [
  'ReminderActionAdapter',
  'CalendarActionAdapter',
  'WorkoutActionAdapter',
  'HabitActionAdapter',
  'SupplementActionAdapter',
] as const;
