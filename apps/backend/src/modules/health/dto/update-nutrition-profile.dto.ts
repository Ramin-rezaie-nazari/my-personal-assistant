import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateNutritionProfileDto {
  @IsOptional()
  @IsInt()
  dailyCaloriesGoal?: number;

  @IsOptional()
  @IsInt()
  proteinGoalGrams?: number;

  @IsOptional()
  @IsInt()
  waterGoalMl?: number;

  @IsOptional()
  @IsString()
  dietType?: string;
}
