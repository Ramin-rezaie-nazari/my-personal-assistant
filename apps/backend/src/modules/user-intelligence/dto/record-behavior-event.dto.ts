import { IsEnum, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { BehaviorAction, BehaviorContext } from '../types/behavior.types';

export class RecordBehaviorEventDto {
  @IsEnum([
    'task_completed', 'task_skipped', 'task_snoozed', 'task_started',
    'reminder_completed', 'reminder_ignored', 'habit_completed',
    'notification_opened', 'notification_dismissed', 'suggestion_accepted',
    'suggestion_rejected',
  ])
  action!: BehaviorAction;

  @IsOptional()
  @IsObject()
  context?: BehaviorContext;
}
