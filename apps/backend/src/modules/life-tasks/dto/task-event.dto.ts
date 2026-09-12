import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class TaskEventDto {
  @IsIn(['started', 'completed', 'cancelled', 'snoozed', 'skipped'])
  eventType!: 'started' | 'completed' | 'cancelled' | 'snoozed' | 'skipped';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
