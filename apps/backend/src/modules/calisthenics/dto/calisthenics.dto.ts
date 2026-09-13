import { IsArray, IsIn, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';
import type { CalisthenicsSession } from '../models/calisthenics.model';
import type { CalisthenicsCoachState } from '../services/calisthenics-coach.service';

const CALISTHENICS_LEVELS = ['beginner', 'foundation', 'intermediate', 'advanced', 'expert', 'elite'] as const;
const CALISTHENICS_FOCUSES = ['strength', 'hypertrophy', 'conditioning', 'mobility', 'skills', 'full_body', 'upper_body', 'lower_body', 'core', 'balance'] as const;
const EQUIPMENT = ['none', 'pull_up_bar', 'parallel_bars', 'rings', 'bench', 'resistance_band', 'dip_belt', 'wall'] as const;

export class CalisthenicsSessionDto {
  @IsInt()
  @Min(1)
  @Max(600)
  durationMin!: number;

  @IsOptional()
  @IsIn(CALISTHENICS_LEVELS)
  level?: (typeof CALISTHENICS_LEVELS)[number];

  @IsOptional()
  @IsIn(CALISTHENICS_FOCUSES)
  focus?: (typeof CALISTHENICS_FOCUSES)[number];

  @IsOptional()
  @IsArray()
  @IsIn(EQUIPMENT, { each: true })
  equipment?: Array<(typeof EQUIPMENT)[number]>;

  @IsOptional()
  @IsObject()
  progress?: Record<string, unknown>;
}

export class CalisthenicsSessionInputDto {
  @IsObject()
  session!: CalisthenicsSession;
}

export class CalisthenicsTickDto {
  @IsObject()
  session!: CalisthenicsSession;

  @IsObject()
  state!: CalisthenicsCoachState;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  elapsedSec?: number;
}
