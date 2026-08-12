export type BrainWorkoutStatus = {
  fromDateKey: string;
  toDateKey: string;
  workoutCount: number;
  activeDays: number;
  totalMinutes: number;
  totalCaloriesBurned: number;
  averageMinutesPerWorkout: number;
  consistencyPercent: number;
  currentStreak: number;
  lastWorkout: {
    name: string;
    type: string;
    performedAt: string;
  } | null;
};
