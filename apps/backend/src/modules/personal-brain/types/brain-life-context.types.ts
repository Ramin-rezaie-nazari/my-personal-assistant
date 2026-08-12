export type BrainHabitSnapshot = {
  id: string;
  name: string;
  targetPerWeek: number;
  completedThisWeek: number;
  streak: number;
};

export type BrainLifeContext = {
  habits: {
    active: number;
    completedThisWeek: number;
    completionPercent: number;
    currentStreak: number;
    items: BrainHabitSnapshot[];
  };
  reminders: {
    pending: number;
    next: {
      id: string;
      title: string;
      type: string;
      scheduledAt: string;
    } | null;
  };
  supplements: {
    total: number;
    taken: number;
    remaining: number;
    completionPercent: number;
    next: {
      id: string;
      name: string;
      dosage: string | null;
      scheduledTime: string;
    } | null;
  };
};
