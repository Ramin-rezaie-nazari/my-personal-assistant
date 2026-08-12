export class CreateWorkoutDto {
  name!: string;
  type!: string;
  durationMinutes!: number;
  caloriesBurned!: number;
  performedAt?: string;
}
