export type BrainWeeklyDay = {
  dateKey: string;
  hasLog: boolean;
  waterMl: number;
  calories: number;
  protein: number;
};

export type BrainWeeklyStatus = {
  startDateKey: string;
  endDateKey: string;
  days: BrainWeeklyDay[];
  loggedDays: number;
  totalCalories: number;
  totalProtein: number;
  totalWaterMl: number;
  averageCalories: number;
  averageProtein: number;
  averageWaterMl: number;
  currentStreak: number;
};
