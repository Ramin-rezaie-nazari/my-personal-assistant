export class UpdateHabitDto {
  name?: string;
  frequency?: 'daily' | 'weekly';
  targetPerWeek?: number;
  active?: boolean;
}
