export type BehaviorAction =
  | 'task_completed'
  | 'task_skipped'
  | 'task_snoozed'
  | 'task_started'
  | 'reminder_completed'
  | 'reminder_ignored'
  | 'habit_completed'
  | 'notification_opened'
  | 'notification_dismissed'
  | 'suggestion_accepted'
  | 'suggestion_rejected';
export type BehaviorContext = {
  hour?: number;
  weekday?: number;
  source?: string;
  taskId?: string;
  category?: string;
  energyLevel?: string;
  estimatedMinutes?: number;
  metadata?: Record<string, unknown>;
};
export type BehaviorPattern = {
  key: string;
  label: string;
  score: number;
  evidenceCount: number;
  confidence: number;
  recommendation?: string;
};
export type AdaptiveProfile = {
  bestHours: number[];
  completionByHour: Record<string, number>;
  completionByWeekday: Record<string, number>;
  preferredTaskMinutes: number | null;
  acceptanceRate: number;
  snoozeRate: number;
  patterns: BehaviorPattern[];
};
