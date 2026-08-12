export class UpdateGoalDto {
  title?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'completed' | 'paused';
  priority?: number;
  targetDate?: string | null;
  progressPercent?: number;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
}
