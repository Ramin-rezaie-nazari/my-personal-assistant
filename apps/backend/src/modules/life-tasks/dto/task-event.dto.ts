export class TaskEventDto {
  eventType!: 'started' | 'completed' | 'cancelled' | 'snoozed' | 'skipped';
  reason?: string;
  metadata?: Record<string, unknown>;
}
