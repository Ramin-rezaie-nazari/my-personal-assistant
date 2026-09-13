import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  BodyTarget,
  FitnessDiscipline,
  FitnessEquipment,
  FitnessGoalKind,
  TrainingConstraint,
} from '../models/fitness.model';

const DISCIPLINES: FitnessDiscipline[] = ['gym', 'calisthenics', 'yoga', 'cardio', 'running', 'mobility'];
const GOAL_KINDS: FitnessGoalKind[] = [
  'strength',
  'hypertrophy',
  'fat_loss',
  'body_sculpt',
  'mobility',
  'conditioning',
  'skill',
  'general_fitness',
];
const BODY_TARGETS: BodyTarget[] = [
  'full_body',
  'shoulders',
  'arms',
  'chest',
  'back',
  'core',
  'waist',
  'hips',
  'glutes',
  'thighs',
  'legs',
  'calves',
];
const CONSTRAINTS: TrainingConstraint[] = [
  'low_impact',
  'avoid_high_volume',
  'minimize_muscle_bulk',
  'no_jumps',
  'quiet_home',
  'short_sessions',
];
const EQUIPMENT: FitnessEquipment[] = [
  'none',
  'dumbbells',
  'barbell',
  'bench',
  'pull_up_bar',
  'parallel_bars',
  'rings',
  'resistance_band',
  'cable_machine',
  'treadmill',
  'bike',
  'dip_belt',
  'yoga_mat',
];

export class FitnessGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  id!: string;

  @IsIn(GOAL_KINDS)
  kind!: FitnessGoalKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BODY_TARGETS.length)
  @ArrayUnique()
  @IsIn(BODY_TARGETS, { each: true })
  targetAreas!: BodyTarget[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  desiredOutcome!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  priority!: number;

  @IsBoolean()
  avoidBulk!: boolean;

  @IsBoolean()
  active!: boolean;
}

export class FitnessEquipmentItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  id!: string;

  @IsIn(EQUIPMENT)
  type!: FitnessEquipment;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;

  @IsObject()
  metadata!: Record<string, string | number | boolean>;

  @IsBoolean()
  active!: boolean;
}

export class FitnessProfileBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DISCIPLINES.length)
  @ArrayUnique()
  @IsIn(DISCIPLINES, { each: true })
  disciplines!: FitnessDiscipline[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FitnessGoalDto)
  goals!: FitnessGoalDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FitnessEquipmentItemDto)
  equipment!: FitnessEquipmentItemDto[];

  @IsArray()
  @ArrayMaxSize(CONSTRAINTS.length)
  @ArrayUnique()
  @IsIn(CONSTRAINTS, { each: true })
  constraints!: TrainingConstraint[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(14)
  @IsInt({ each: true })
  @Min(5, { each: true })
  @Max(240, { each: true })
  preferredSessionMinutes!: number[];
}

export class SaveFitnessProfileDto {
  @ValidateNested()
  @Type(() => FitnessProfileBodyDto)
  profile!: FitnessProfileBodyDto;
}

export class AddFitnessEquipmentDto {
  @ValidateNested()
  @Type(() => FitnessEquipmentItemDto)
  item!: FitnessEquipmentItemDto;
}

export class AddFitnessGoalDto {
  @ValidateNested()
  @Type(() => FitnessGoalDto)
  goal!: FitnessGoalDto;
}

export class ParseFitnessGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text!: string;
}

export class RecordFitnessProgressDto {
  @IsIn(['gym', 'calisthenics', 'yoga'])
  discipline!: Extract<FitnessDiscipline, 'gym' | 'calisthenics' | 'yoga'>;

  @IsInt()
  @Min(1)
  @Max(10)
  difficulty!: number;

  @IsBoolean()
  completed!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  formScore?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^\S[\s\S]{0,199}$/)
  sessionId?: string;
}
