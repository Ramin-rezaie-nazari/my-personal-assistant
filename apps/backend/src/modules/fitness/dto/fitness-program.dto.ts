import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

const PROGRAM_DISCIPLINES = ['gym', 'calisthenics', 'yoga', 'cardio', 'running', 'mobility'] as const;
const PROGRAM_GOALS = ['strength', 'hypertrophy', 'fat_loss', 'body_sculpt', 'mobility', 'conditioning', 'skill', 'general_fitness'] as const;
const PROGRAM_LEVELS = ['beginner', 'foundation', 'intermediate', 'advanced', 'expert'] as const;
const ASSIGNMENT_STATUSES = ['active', 'paused', 'completed', 'cancelled'] as const;

export class FitnessProgramQueryDto {
  @IsOptional() @IsString() @Max(60) discipline?: (typeof PROGRAM_DISCIPLINES)[number];
  @IsOptional() @IsString() @Max(80) goal?: (typeof PROGRAM_GOALS)[number];
  @IsOptional() @IsString() @Max(40) level?: (typeof PROGRAM_LEVELS)[number];
  @IsOptional() @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @IsInt() @Min(0) offset?: number;
}

export class StartFitnessProgramDto {
  @IsString() @IsNotEmpty() programId!: string;
}

export class CompleteFitnessProgramSessionDto {
  @IsInt() @Min(1) @Max(100) week!: number;
  @IsInt() @Min(1) @Max(31) day!: number;
}

export class UpdateFitnessProgramStatusDto {
  @IsIn(ASSIGNMENT_STATUSES) status!: (typeof ASSIGNMENT_STATUSES)[number];
}
