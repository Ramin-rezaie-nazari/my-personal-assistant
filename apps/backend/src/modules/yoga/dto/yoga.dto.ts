import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import type { YogaSession } from '../models/yoga.model';
import type { YogaCoachState } from '../services/yoga-coach.service';
import type { PoseFrame } from '../models/pose-provider.model';

const YOGA_LEVELS = ['beginner', 'foundation', 'intermediate', 'advanced', 'expert'] as const;
const YOGA_FOCUSES = ['mobility', 'flexibility', 'balance', 'strength', 'recovery', 'relaxation', 'stress_relief', 'morning', 'evening', 'breathing'] as const;

export class YogaSessionDto {
  @IsInt()
  @Min(1)
  @Max(600)
  durationMin!: number;

  @IsOptional()
  @IsIn(YOGA_LEVELS)
  level?: (typeof YOGA_LEVELS)[number];

  @IsOptional()
  @IsIn(YOGA_FOCUSES)
  focus?: (typeof YOGA_FOCUSES)[number];

  @IsOptional()
  @IsObject()
  progress?: Record<string, unknown>;
}

export class YogaSessionInputDto {
  @IsObject()
  session!: YogaSession;
}

export class YogaTickDto {
  @IsObject()
  session!: YogaSession;

  @IsObject()
  state!: YogaCoachState;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  elapsedSec?: number;
}

export class YogaCueDto {
  @IsObject()
  state!: YogaCoachState;
}

export class YogaMotionDto {
  @IsString()
  poseId!: string;

  @IsObject()
  frame!: PoseFrame;
}
