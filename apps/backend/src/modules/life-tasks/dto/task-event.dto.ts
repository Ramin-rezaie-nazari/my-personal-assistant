import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class TaskEventDto {
  @IsIn(['started', 'completed', 'cancelled', 'snoozed', 'skipped'])
  eventType!: 'started' | 'completed' | 'cancelled' | 'snoozed' | 'skipped';

  @IsOptional() @IsString() @MaxLength(1000)
  reason?: string;

  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}
