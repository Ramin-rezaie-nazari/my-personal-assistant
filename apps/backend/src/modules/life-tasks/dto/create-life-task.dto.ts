import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateLifeTaskDto {
  @IsString() @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(100)
  goalId?: string;

  @IsOptional() @IsInt() @Min(1) @Max(3)
  priority?: number;

  @IsOptional() @IsInt() @Min(1) @Max(1440)
  estimatedMinutes?: number;

  @IsOptional() @IsIn(['low', 'medium', 'high'])
  energyLevel?: 'low' | 'medium' | 'high';

  @IsOptional() @IsISO8601()
  dueAt?: string;

  @IsOptional() @IsISO8601()
  scheduledAt?: string;

  @IsOptional() @IsString() @MaxLength(100)
  source?: string;
}
