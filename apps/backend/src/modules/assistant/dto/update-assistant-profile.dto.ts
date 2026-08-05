import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';

export class UpdateAssistantProfileDto {
  @IsOptional()
  @IsString()
  healthGoal?: string;

  @IsOptional()
  @IsString()
  fitnessGoal?: string;

  @IsOptional()
  @IsString()
  nutritionGoal?: string;

  @IsOptional()
  @IsString()
  smokingHabit?: string;

  @IsOptional()
  @IsInt()
  waterGoalMl?: number;

  @IsOptional()
  @IsNumber()
  sleepGoalHours?: number;

  @IsOptional()
  @IsString()
  exerciseGoal?: string;
}
