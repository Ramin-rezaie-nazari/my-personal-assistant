export class CreateLifeTaskDto {
  title!: string;
  description?: string;
  goalId?: string;
  priority?: number;
  estimatedMinutes?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  dueAt?: string;
  scheduledAt?: string;
  source?: string;
}
