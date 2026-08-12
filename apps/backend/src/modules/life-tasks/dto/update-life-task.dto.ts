export class UpdateLifeTaskDto {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'snoozed';
  priority?: number;
  estimatedMinutes?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  dueAt?: string | null;
  scheduledAt?: string | null;
}
