export class CreateHabitDto {
  name!: string;
  frequency!: 'daily' | 'weekly';
  targetPerWeek?: number;
}

export class UpdateHabitDto {
  name?: string;
  frequency?: 'daily' | 'weekly';
  targetPerWeek?: number;
  active?: boolean;
}
