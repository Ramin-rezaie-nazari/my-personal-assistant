export type BrainHabitSnapshot = {
  id: string;
  name: string;
  targetPerWeek: number;
  completedThisWeek: number;
  streak: number;
};

export type BrainGoalSnapshot = {
  id: string;
  title: string;
  category: string;
  priority: number;
  progressPercent: number;
  targetDate: string | null;
  daysRemaining: number | null;
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
  goals: {
    active: number;
    dueSoon: number;
    averageProgress: number;
    next: BrainGoalSnapshot | null;
    items: BrainGoalSnapshot[];
  };
};
