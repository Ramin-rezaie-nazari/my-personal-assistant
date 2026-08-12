export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'snoozed';
export type TaskEnergy = 'low' | 'medium' | 'high';

export class CreateTaskDto {
  title!: string;
  description?: string;
  source?: string;
  goalId?: string;
  priority?: number;
  energy?: TaskEnergy;
  scheduledAt?: string;
  dueAt?: string;
  estimatedMinutes?: number;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  energy?: TaskEnergy;
  scheduledAt?: string | null;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
}

export class TaskEventDto {
  event!: 'started' | 'completed' | 'cancelled' | 'snoozed' | 'skipped';
  reason?: string;
  metadata?: Record<string, unknown>;
}
