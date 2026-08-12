export type BrainContext = {
  timestamp: string;
  dateKey: string;
  primaryGoal: string | null;
  today: {
    calories: number;
    calorieGoal: number | null;
    protein: number;
    proteinGoal: number | null;
    waterMl: number;
    waterGoalMl: number | null;
  };
  habits: { active: number; completed: number; streaks: number[] };
  supplements: { active: number; taken: number; remaining: number };
  reminders: { pending: number; next: { id: string; title: string; type: string; scheduledAt: string } | null };
  calendar: { todayCount: number; next: { id: string; title: string; startsAt: string; endsAt: string | null; completed: boolean } | null };
  workouts: { todayCount: number; latest: { id: string; name: string; type: string; durationMinutes: number; caloriesBurned: number; performedAt: string } | null };
  notifications: { unread: number };
  priorities: string[];
  source: string;
};
