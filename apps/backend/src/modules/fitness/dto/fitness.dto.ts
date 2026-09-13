import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const DISCIPLINES = ['gym', 'calisthenics', 'yoga', 'cardio', 'running', 'mobility'] as const;
const GOAL_KINDS = ['strength', 'hypertrophy', 'fat_loss', 'body_sculpt', 'mobility', 'conditioning', 'skill', 'general_fitness'] as const;
const TARGET_AREAS = ['full_body', 'shoulders', 'arms', 'chest', 'back', 'core', 'waist', 'hips', 'glutes', 'thighs', 'legs', 'calves'] as const;
const EQUIPMENT_TYPES = ['none', 'dumbbells', 'barbell', 'bench', 'pull_up_bar', 'parallel_bars', 'rings', 'resistance_band', 'cable_machine', 'treadmill', 'bike', 'dip_belt', 'yoga_mat'] as const;
const CONSTRAINTS = ['low_impact', 'avoid_high_volume', 'minimize_muscle_bulk', 'no_jumps', 'quiet_home', 'short_sessions'] as const;

export class FitnessGoalDto {
  @IsUUID() id!: string;
  @IsIn(GOAL_KINDS) kind!: (typeof GOAL_KINDS)[number];
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsArray() @ArrayMaxSize(12) @IsIn(TARGET_AREAS, { each: true }) targetAreas!: Array<(typeof TARGET_AREAS)[number]>;
  @IsString() @IsNotEmpty() @MaxLength(500) desiredOutcome!: string;
  @IsInt() @Min(0) @Max(100) priority!: number;
  @IsBoolean() avoidBulk!: boolean;
  @IsBoolean() active!: boolean;
}

export class FitnessEquipmentItemDto {
  @IsUUID() id!: string;
  @IsIn(EQUIPMENT_TYPES) type!: (typeof EQUIPMENT_TYPES)[number];
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsNumber() @Min(1) @Max(1000) quantity!: number;
  @IsObject() metadata!: Record<string, string | number | boolean>;
  @IsBoolean() active!: boolean;
}

export class FitnessProfileDto {
  @IsArray() @ArrayMinSize(0) @ArrayMaxSize(6) @IsIn(DISCIPLINES, { each: true }) disciplines!: Array<(typeof DISCIPLINES)[number]>;
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => FitnessGoalDto) goals!: FitnessGoalDto[];
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => FitnessEquipmentItemDto) equipment!: FitnessEquipmentItemDto[];
  @IsArray() @ArrayMaxSize(6) @IsIn(CONSTRAINTS, { each: true }) constraints!: Array<(typeof CONSTRAINTS)[number]>;
  @IsArray() @ArrayMaxSize(12) @IsNumber({}, { each: true }) @Min(5, { each: true }) @Max(240, { each: true }) preferredSessionMinutes!: number[];
}

export class SaveFitnessProfileDto {
  @ValidateNested() @Type(() => FitnessProfileDto) profile!: FitnessProfileDto;
}

export class AddFitnessEquipmentDto {
  @ValidateNested() @Type(() => FitnessEquipmentItemDto) item!: FitnessEquipmentItemDto;
}

export class AddFitnessGoalDto {
  @ValidateNested() @Type(() => FitnessGoalDto) goal!: FitnessGoalDto;
}

export class ParseFitnessGoalDto {
  @IsString() @IsNotEmpty() @MaxLength(500) text!: string;
}
