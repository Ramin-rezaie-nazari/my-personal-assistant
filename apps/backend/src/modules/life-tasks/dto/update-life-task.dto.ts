import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateLifeTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled', 'snoozed'])
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'snoozed';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  energyLevel?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string | null;
}
