export class CreateGoalDto {
  title!: string;
  description?: string;
  category?: string;
  priority?: number;
  targetDate?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}
